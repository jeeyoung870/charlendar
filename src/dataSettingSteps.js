// daily batch / init data setting 작업 
import Config from "./config";
import pgDB from "./postgreDB";
import axios from 'axios';

const steps = {
  // ================ init data setting start =====================

  // 1년 뉴욕시장 휴장일정보 적재 (delete+insert)
  // 요청 : https://rapidapi.com/joursouvres-api/api/working-days
  save_holidays: (tYear, res) => {
    const hDayOptions = {
      method: 'GET',
      url: 'https://working-days.p.rapidapi.com/1.3/list_non_working_days',
      params: {
        country_code: 'US',
        start_date: `${tYear}-01-01`,
        end_date: `${tYear}-12-31`,
        configuration: 'New York Stock Exchange'
      },
      headers: {
        'X-RapidAPI-Key': Config.rapidAPI.RapidAPI_KEY,
        'X-RapidAPI-Host': Config.rapidAPI.RapidAPI_HOST_HOLIDAY
      }
    };
    axios.request(hDayOptions).then( response => response.data.non_working_days )
    .then(hDays => {
      const deleteQuery = pgDB.query.delete_year_holidays(tYear);
      pgDB.executeQuery(deleteQuery).then(r => {
        console.log(`${tYear}년 휴장일정보 삭제 성공.`);
        const insertQuery = pgDB.query.insert_year_holidays(hDays);
        pgDB.executeQuery(insertQuery).then( r => {
          console.log(`${tYear}년 휴장일정보 적재 성공.`);
          res.send(`${tYear}년 휴장일정보 적재 성공.`);
          res.status(200).end();
        });
      })
      .catch(function (error) {
        console.error(error);
      });
    }).catch(function (error) {
      console.error(error);
      res.send(`${tYear}년 휴장일정보 적재 실패.`);
    });
  },

  // cld.STOCK_INFO -차트데이터 입수 대상종목추가.
  add_stockInfo : (stckInfo, res) => {
    const mergeQuery = pgDB.query.insert_stock_info(stckInfo);
      pgDB.executeQuery(mergeQuery).then( rows => {
        res.send(`${rows[0].stckcode} 종목 추가 성공.`);
        res.status(200).end();
      })
      .catch( e => {
        console.log(e);
        res.send(`종목 추가 실패.`);
        res.status(200).end();
      });
  },

  // Range별 주가 시계열데이터 적재 (delete+insert)
  // tRange : (1d|5d|1mo|3mo|6mo|1y|2y|5y|10y|ytd|max)
  // region : (US|BR|AU|CA|FR|DE|HK|IN|IT|ES|GB|SG)
  save_range_chartData: (tRange) => {
    return new Promise(async (resolve,reject) => {
      // 검색할 종목
      const query = pgDB.query.all_stockInfo();
      pgDB.executeQuery(query).then( stcks => {

        recursive_chart_requester(stcks, tRange).then(result => {
          resolve(result);
        }).catch(errMsg => {
          reject(errMsg);
        });
      })
      .catch( error => {
        console.log(`all_stockInfo : 종목정보 불러오기 실패.`);
        reject(error);
      });
    });
  },
  // ================ init data setting end =====================

  // ================ Chartdata function =====================
  getChartData21day : (stckCd, dt) => {
    var result;
    return new Promise(async (resolve,reject) => {
      const query1 = pgDB.query.get_chartData_before10day(stckCd, dt);
      const query2 = pgDB.query.get_chartData_after11day(stckCd, dt);
      pgDB.executeQuery(query1).then( rows => {
        result = rows;
        pgDB.executeQuery(query2).then( rows => {
          resolve(result.concat(rows)); 
        });
      });
    });
  },
  // ================ Chartdata function end =====================

  //=================== 영업일찾기 function start ======================
  getNextBusinessDay : (nowDt, oneDay) => {     //바로 전(후)영업일 찾기
    return new Promise(async (resolve,reject) => {
      var nowDate = nowDt;
      var isBusinessday = false;
      while(!isBusinessday) {
          getNextWeekday(nowDate, oneDay).then(nextWeekday => {
              nowDate = nextWeekday;
              // db에서 비영업일 비교
              steps.checkBusinessday(nextWeekday).then(isBday => {
                  isBusinessday = isBday;
              });
          }).catch(function (error) {
              console.error(error);
          });
          await new Promise(res => setTimeout(res, 20));
      }
      resolve( nowDate);
    });
  },
  
  checkBusinessday: (weekday) => {    // 영업일여부 확인
    return new Promise((resolve,reject) => {
      const dt = weekday;
      const query = pgDB.query.get_businessday(dt);
      pgDB.executeQuery(query).then( rows => {
        resolve (!rows.length);   // 영업일=true, 비영업일=false
      });
    });
  },
  //=================== 영업일찾기 function end ======================

  //=================== daily batch function start ======================
  score_votecheck: (yesterday) => {
    return new Promise((resolve,reject) => {

      const query1 = pgDB.query.get_stock_bullOrBear(yesterday);
      pgDB.executeQuery(query1).then( voteAnswer => {
        console.log(voteAnswer);
        const query2 = pgDB.query.update_votechk(yesterday, voteAnswer);
        pgDB.executeQuery(query2).then( (r) => {
          console.log('cld.DAILY_DIARY votechk update succeed.');

          // wincount 비교 적재 위한 전전영업일 가져오기
          const oneDay = 24 * 60 * 60 * 1000; //miliseconds
          steps.getNextBusinessDay(yesterday, -oneDay).then(beforeBDay => {

            console.log('전전영업일 : ', beforeBDay);
            const query3 = pgDB.query.update_wincount(yesterday, beforeBDay);
            pgDB.executeQuery(query3).then(r => {
              resolve(`${r.length} users wincount update succeed.`);
            }).catch(errMsg => {reject('update_wincount()중 에러 : '+ errMsg);});
          }).catch(errMsg => {reject('getNextBusinessDay()중 에러 : '+ errMsg);});
        }).catch(errMsg => {reject('update_votechk()중 에러 : '+ errMsg);});
      }).catch(errMsg => {reject('get_stock_bullOrBear()중 에러 : '+ errMsg);});
      
    });
  },
  update_user_ranking: (yesterday) => {
    return new Promise((resolve,reject) => {
      const firstDayOfMonth = yesterday.slice(0, 8) + '01';   // 이번달 1일 날짜

      const query1 = pgDB.query.get_all_userid();
      pgDB.executeQueryToArray(query1, 'userid').then(userArr => {

        recursive_ranking_updater(userArr, firstDayOfMonth, yesterday).then(result => {
          resolve(result);
        }).catch(errMsg => {
          reject(errMsg);
        });

      });
    });
  }
}


function getNextWeekday(nowDt, oneDay) {     // 바로 다음 평일 찾기(주말제외)
  return new Promise((resolve,reject) => {
      var nextday = new Date(+new Date(nowDt)+oneDay);
      if (nextday.getDay() === 0 || nextday.getDay() === 6) {   //goYesterday || goTomorrow
          // console.log( dtFormat(nextday), '는 주말');
          resolve( dtFormat(new Date(+nextday + oneDay*2)) );
      } else {
          resolve( dtFormat(nextday) );
      }
  });
}
function dtFormat(dateObj) {
  return dateObj.toISOString().slice(0, 10);
}

var cnt = 0;
function recursive_ranking_updater(userArr, firstDayOfMonth, yesterday) {
  // 반복문 순차 실행후 resolve하기 위해 재귀 사용.
  return new Promise((resolve, reject) => {
    var userid = userArr[cnt];

    if(cnt === userArr.length ){
      cnt = 0;
      resolve(`월간 유저 랭킹 업데이트 성공.`);
    }else{
      merge_user_ranking(userid, firstDayOfMonth, yesterday).then(() => {
        cnt++;
        recursive_ranking_updater(userArr, firstDayOfMonth, yesterday).then(m => resolve(m));
      })
      .catch(errMsg => {
        cnt = 0;
        reject(`'${userid}' 유저의 cld.user_ranking merge중 실패 : `, errMsg);
      });
    }
  });
}
function merge_user_ranking(userid, firstDayOfMonth, yesterday) {
  return new Promise((resolve, reject) => {
    var mergeQuery = pgDB.query.update_monthly_user_rankings(userid, firstDayOfMonth, yesterday);
    pgDB.executeQuery(mergeQuery).then(r => {
      resolve();
    }).catch(errMsg => {reject(errMsg);});
  });
}

var idx = 0;
function recursive_chart_requester(stcks, tRange) {
  // 반복문 순차 실행후 resolve하기 위해 재귀 사용.
  return new Promise((resolve, reject) => {
    var stck = stcks[idx];

    if(idx === stcks.length ){
      idx = 0;
      resolve(`${tRange} 기간 주가데이터 적재 성공.`);
    }else{
      getChartData_and_insert(stck, tRange).then(() => {
        idx++;
        recursive_chart_requester(stcks, tRange).then(m => resolve(m));
      })
      .catch(errMsg => {
        idx = 0;
        reject(`${tRange} 기간 주가데이터 적재 실패.`, errMsg);
      });
    }
  });
}
function getChartData_and_insert(stck, tRange) {
  return new Promise((resolve, reject) => {
    const stckcode = stck.stckcode;
    const region = stck.region;
    console.log(stckcode +' ' + region);
    // interval : (5m | 15m | 1d | 1wk | 1mo)
    const chartOptions = {
      method: 'GET',
      url: 'https://yh-finance.p.rapidapi.com/stock/v3/get-chart',
      params: {symbol: stckcode, interval: '1d', range: tRange, region: region},
      headers: {
        'X-RapidAPI-Key': Config.rapidAPI.RapidAPI_KEY,
        // 'X-RapidAPI-Key': '0a3d72aa14mshb25c628e736c9dbp1a4a3bjsne3433a2103dd',
        'X-RapidAPI-Host': Config.rapidAPI.RapidAPI_HOST_CHART
      }
    };
    axios.request(chartOptions).then(response => response.data.chart.result[0] )
    .then( chartData => {
      // console.log(chartData);

      const deleteQuery = pgDB.query.delete_chartDatas(stckcode, chartData.timestamp);
      pgDB.executeQuery(deleteQuery).then(r => {
        console.log(`${tRange}기간의 '${stckcode}' 주가데이터 삭제 성공.`);
        const insertQuery = pgDB.query.insert_chartDatas(chartData); // 한종목씩 적재함.
        pgDB.executeQuery(insertQuery).then( r => {
          console.log(`${tRange}기간의 '${stckcode}' 주가데이터 적재 성공.`);
          resolve();
        })
        .catch(function (error) {
          console.log(`${tRange}기간의 '${stckcode}' 주가데이터 적재 중 에러 발생.`);
          reject(error);
        });
      })
      .catch(function (error) {
        console.log(`${tRange}기간의 '${stckcode}' 주가데이터 삭제 중 에러 발생.`);
        reject(error);
      });
    })
    .catch(function (error) {
      console.error(`api에서 ${tRange} 기간 주가데이터 요청 실패.`);
      reject(error);
    });
  });
}


export default {steps };
