// postgreSql 모듈 import
import { Client } from "pg";
import { Query } from 'pg';
import Config from "./config";

// local postgre connection
const client = new Client({
    user : Config.postgre.user,
    host : Config.postgre.host,
    database : Config.postgre.database,
    password : Config.postgre.password,
    port : Config.postgre.port
});

// fly.io internal connection
// // const DATABASE_URL = 'postgres://charlendar:fzw5iptoNUjVS36@top2.nearest.of.charlendar-db.internal:5432/charlendar?sslmode=disable';
// const client = new Client(Config.fly_postgre.DATABASE_URL);

// connection 확인
const checkConnection = () => {
    client.connect(err => {
        if (err) {
          console.error('DB Connection error', err.stack)
        } else {
            console.log('DB Connection success!')
        }
    });
}
// This function resolves query results(array of objects).
const executeQuery = (query) => {
    return new Promise((resolve,reject) => {
        client.query(query);
        var rows = [];

        query.on("row", row => {
            rows.push(row);
        });
        query.on('end', () => {
            // console.log('query done');
            resolve(rows);
        });
        query.on('error', err => {
            console.error(err.stack)
        });
    });
}
// 컬럼 1개일때 object아닌 array로 반환
const executeQueryToArray = (query, colName) => {
    return new Promise((resolve,reject) => {
        client.query(query);
        var arr = [];
        query.on("row", row => {
            arr.push(row[colName]);
        });
        query.on('end', () => {
            // console.log('query done');
            resolve(arr);
        });
        query.on('error', err => {
            console.error(err.stack)
        });
    });
}
function round_2(num){    //소수점2자리반올림 + 콤마(,)찍기
    const rounded = Math.round(num * 100) / 100;
    return rounded.toLocaleString();  //type = String
}
function findDate(timeStamp) {
    return (new Date(timeStamp*1000)).toISOString().slice(0, 10);
}

const query = {
    get_all_userid: () => {
        return new Query(
            `select userid 
            from cld.user_info `
        );
    },
    get_diary: (req) => {
        return new Query(
            `select 
                dt, userid, memo, votecode, vote, votechk, wincount 
            from cld.DAILY_DIARY 
                where DT = '${req.body.dt}' 
                and USERID = '${req.body.userId}' `
        );
    },
    get_monthDiary: (req) => {
        return new Query(
            `select *  
            from cld.DAILY_DIARY 
                where USERID = '${req.body.userId}'
                and DT like '${req.body.yearMonthStr}%' 
            order by DT asc `
        );
    },
    get_userRanking: (range, userId) => {
        return new Query(
            `select (row_number() over()) AS rownum, R.voterate
            from (
                select *  
                from cld.USER_RANKING 
                where voterange = '${range}' 
                and voterate is not null 
                order by voterate desc 
            ) as R 
            where userid = '${userId}' `
        );
    },
    get_rankingUser_count: (range) => {
        return new Query(
            `select count(*) from cld.user_ranking
            where voterange = '${range}' 
            and voterate is not null `
        );
    },
    get_diaryWrittenDt: (userId, dtFrom, dtTo) => {
        return new Query(
            `select dt
            from cld.DAILY_DIARY 
                where USERID = '${userId}'
                and DT between '${dtFrom}' and '${dtTo}' `
        );
    },
    get_monthHolidaysDt: (dt) => {
        return new Query(
            `select dt, description  
            from cld.MARKET_HOLIDAY 
                where dt like '${dt}%'  
            order by dt `
        );
    },
    save_diary: (req) => {
        const dt = req.body.dt;
        const userid = req.body.userid;
        const memo = req.body.memo;
        const votecode = req.body.votecode;
        const vote = req.body.vote;

        return new Query(
            `INSERT INTO cld.DAILY_DIARY (DT, USERID, MEMO, VOTECODE, VOTE) 
                VALUES ('${dt}', '${userid}', '${memo}', '${votecode}', '${vote}') 
                ON CONFLICT ON CONSTRAINT DAILY_DIARY_PK 
                DO UPDATE 
                SET MEMO = '${memo}', 
                    VOTECODE = '${votecode}', 
                    VOTE = '${vote}' 
            RETURNING DT `
        );
    },
    user_signIn: (req) => {
        const userId = req.body.userId;
        const userNm = req.body.userNm;
        const photoUrl = req.body.photoUrl;
        const ageRange = req.body.ageRange;
        const gender = req.body.gender;
        return new Query(
            `INSERT INTO cld.USER_INFO (USERID, USERNM, PHOTOURL, AGERANGE, GENDER) 
                VALUES ('${userId}', '${userNm}', '${photoUrl}', '${ageRange}', '${gender}') 
                ON CONFLICT ON CONSTRAINT USER_INFO_PK 
                DO UPDATE 
                SET USERNM = '${userNm}', 
                    PHOTOURL = '${photoUrl}', 
                    AGERANGE = '${ageRange}', 
                    GENDER = '${gender}' 
            RETURNING USERID, USERNM `
        );
    },
    all_stockInfo: () => {
        return new Query(
            `select * from cld.STOCK_INFO 
            order by stckcode desc `
        );
    },
    get_stock_bullOrBear: (tDate) => {
        return new Query(
            `select stckcode,  
                case when rtn > 0 then 'BULL' 
                    when rtn < 0 then 'BEAR' 
                    else 'X' 
                end as rtn  
            from cld.STOCKPRICE_DAILY 
            where dt = '${tDate}' `
        );
    },
    get_userVoteInfo: (tDate) => {
        return new Query(
            `select  userid, votecode, vote  
                from cld.DAILY_DIARY 
                where dt = '${tDate}' 
                and vote != 'X' `
        );
    },
    get_businessday: (dt) => {
        return new Query(
            `SELECT * from cld.MARKET_HOLIDAY 
                where DT = '${dt}' `
        );
    },
    get_chartData_before10day: (stckCd, dt) => {
        return new Query(
            `select * from ( 
                select * from cld.STOCKPRICE_DAILY 
                    where stckcode = '${stckCd}' 
                    and DT < '${dt}' 
                    order by dt desc 
                limit 10
            ) as SP 
            order by dt asc `
        );
    },
    get_chartData_after11day: (stckCd, dt) => {
        return new Query(
            `select * from cld.STOCKPRICE_DAILY 
                where stckcode = '${stckCd}' 
                and DT >= '${dt}' 
                order by dt asc 
            limit 11 `
        );
    },
    delete_year_holidays: (tYear) => {
        return new Query(
            `DELETE from cld.MARKET_HOLIDAY 
                where DT like '${tYear}%' `
        );
    },
    delete_chartDatas: (stckcode, timestamp) => {
        const startDt = findDate(timestamp[1]);
        const endDt = findDate(timestamp[ timestamp.length-1 ]);
        return new Query(
            `delete from cld.STOCKPRICE_DAILY
                where STCKCODE = '${stckcode}'
                and DT BETWEEN '${startDt}' AND '${endDt}' `
        );
    },
    insert_stock_info: (stckInfo) => {
        var stckcode = stckInfo.stckcode;
        var stcknm_eng = stckInfo.stcknm_eng;
        var stcknm_kr = stckInfo.stcknm_kr;
        var region = stckInfo.region;
        return new Query(
            `INSERT INTO cld.STOCK_INFO (stckcode, stcknm_eng, stcknm_kr, region) 
                VALUES ('${stckcode}', '${stcknm_eng}', '${stcknm_kr}', '${region}') 
                ON CONFLICT ON CONSTRAINT STOCK_INFO_PK 
                DO UPDATE 
                SET stcknm_eng = '${stcknm_eng}', 
                    stcknm_kr = '${stcknm_kr}', 
                    region = '${region}' 
            RETURNING stckcode `
        );
    },
    insert_year_holidays: (hDays) => {
        var stmt = `INSERT INTO cld.MARKET_HOLIDAY(DT, DESCRIPTION, TYPE) VALUES `;
        for (var i=0; i<hDays.length; i++) {
            var hDay = hDays[i];
            stmt += `('${hDay.date}', '${hDay.description.replace(/'/g, "")}', '${hDay.type}') `;
            if(i<hDays.length-1){
                stmt += ", ";
            }
        }
        return new Query(stmt);
    },
    insert_chartDatas: (chartData) => {
        const metaData = chartData.meta;  //종목정보(symbol, currency, instrumentType 등등...)
        const timestamp = chartData.timestamp;  //날짜Array
        const openPrice = chartData.indicators.quote[0].open; //시초가Array
        const endPrice = chartData.indicators.quote[0].close; //종가Array
        // 이외 속성...( 고: high / 저: low / 거래량: volume )
        var stmt = `INSERT INTO cld.STOCKPRICE_DAILY(DT, STCKCODE, BASEPRICE, ENDPRICE, RTN) VALUES `;
        for (var i=1; i<timestamp.length; i++) { // idx=0은 전일종가 없어서 rtn계산이 불가능하므로 2번째부터 시작.
            var basePr = endPrice[i-1];
            var endPr = endPrice[i];
            stmt += `('${findDate(timestamp[i])}', '${metaData.symbol}', ${basePr}, ${endPr}, ${(endPr-basePr)/basePr*100}) `;
            if(i<timestamp.length-1){
                stmt += ", ";
            }
        }
        return new Query(stmt);
    },
    update_votechk: (yesterday, voteAnswer) => {
        var stmt = `update cld.DAILY_DIARY  
                    set votechk = 
                        case `;
        for (var i=0; i<voteAnswer.length; i++) {
            stmt += `when votecode = '${voteAnswer[i].stckcode}' and vote = '${voteAnswer[i].rtn}' then true  `;
            if(i == voteAnswer.length-1){
                stmt += `   when vote = 'X' then null  
                            else false  
                        end   
                    where dt = '${yesterday}'  `;
            }
        }
        console.log(stmt);
        return new Query(stmt);
    },
    update_wincount: (yesterday, beforeBDay) => {
        // postgre에서 가능한 UPDATE JOIN문 사용
        var stmt = `update cld.DAILY_DIARY A 
                    set wincount =  
                        case when B.wincount is null then 1 
                            else B.wincount + 1 
                        end 
                        from (select * from  
                                cld.DAILY_DIARY 
                                where dt = '${beforeBDay}') B 
                        where 	A.userid = B.userid 
                        and 	A.dt = '${yesterday}' 
                        and 	A.votechk = true 
                    returning A.userid `;
        console.log(stmt);
        return new Query(stmt);
    },
    update_monthly_user_rankings: (userid, firstDayOfMonth, yesterday) => {
        var stmt = `insert into cld.user_ranking (userid, voterange, voterate) 
                        VALUES ('${userid}', 'MONTHLY', 
                                    (select  
                                        CAST(A.correctday AS DOUBLE PRECISION) /  
                                        CAST(  
                                            (case when A.votedday=0 then null  
                                                else A.votedday 
                                            end) 
                                            AS DOUBLE PRECISION) * 100 as hitrate 
                                        from  
                                        (select 
                                            count(case when votechk=true then 1 end) as correctday, 
                                            count(*) as votedday 
                                            from cld.DAILY_DIARY 
                                            where dt between '${firstDayOfMonth}' and '${yesterday}' 
                                            and userid = '${userid}' 
                                            and votechk is not null 
                                        ) A 
                                    )  
                                ) 
                        ON CONFLICT ON CONSTRAINT user_ranking_PK 
                        DO UPDATE 
                        SET voterate = (select  
                                            CAST(A.correctday AS DOUBLE PRECISION) /  
                                            CAST( 
                                                (case when A.votedday=0 then null  
                                                    else A.votedday 
                                                end) 
                                                AS DOUBLE PRECISION) * 100 as hitrate 
                                            from  
                                            (select 
                                                count(case when votechk=true then 1 end) as correctday, 
                                                count(*) as votedday 
                                                from cld.DAILY_DIARY 
                                                where dt between '${firstDayOfMonth}' and '${yesterday}' 
                                                and userid = '${userid}' 
                                                and votechk is not null 
                                            ) A 
                                        )  
                    RETURNING userid  `;
        return new Query(stmt);
    }
}


export default {checkConnection, executeQuery, executeQueryToArray, query };