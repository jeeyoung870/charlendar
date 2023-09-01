import Config from "./config";
import schedule from "node-schedule";
import pgDB from "./postgreDB";
import setting from "./dataSettingSteps";
import http from "http";
import express from "express";
import axios from 'axios';
import cheerio from 'cheerio';

// DB connection 확인
pgDB.checkConnection();

// ================ app setting start ================
const app = express();
// const port = process.env.PORT || 3000;   
const port = 8080;    // fly.io internal 실행

// app.set("view engine", "pug");
app.set("view engine", "ejs");
app.engine('html', require('ejs').renderFile);
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
//post정보인 req.body 사용위해 선언
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true }));

console.log(__dirname + "/public/views");
// ================ app setting end ================

app.get("/", (req, res) => {
  // res.render("home", {ttt:"some text"});
  res.redirect("/welcome");
});
app.get("/welcome", (req, res) => {
  const redirectPath = req.query.path ? req.query.path : "/myEcoCalendar";
  res.render("welcomePage.html", {redirectPath : redirectPath});
});
app.get("/myEcoCalendar", (req, res) => {
  res.render("myEcoCalendar.html");
});
app.get("/dailyDiary", (req, res) => {
  // 문제: 구글로그인후 리다이렉트하는경우 무조건 오늘날짜가 됨.(query지정불가)
  var targetDt = null;
  if(req.query.dt) {
    targetDt = req.query.dt;
  } else {
    // 9시간 더해서 한국시간 맞추기
    var todayObj = new Date();
    todayObj.setHours(todayObj.getHours()+9);
    targetDt = todayObj.toISOString().slice(0,10);
  }
  res.render("dailyDiary.html", {targetDt: targetDt});
});
app.get("/login", (req, res) => {
  res.render("googleLogin.html");
});
app.get("/initDataSetting", (req, res) => {  //초기 db데이터(chartData,영업일 등) 세팅
  res.render("initDataSetting.html");
});

// app.get("/*", (req, res) => {
//   res.redirect("/");
// });

app.post("/gLogin_auth_config", (req, res) => {
  console.log("Called /login_auth_config");
  res.send(Config.gLogin);
  res.status(200).end();
});
app.post("/user_signIn", (req, res) => {
  console.log("Called /user_signIn");
  const query = pgDB.query.user_signIn(req);
  sendQueryResult(query, res);
});
app.post("/next_businessday", (req, res) => {
  console.log("Called /next_businessday");
  const dt = req.body.dt;
  const oneDay = req.body.oneDay;

  setting.steps.getNextBusinessDay(dt, oneDay).then(bDay => {
    res.send({bDay: bDay});
    res.status(200).end();
  }).catch(function (error) {
    console.error(error);
  });
});
app.post("/check_businessday", (req, res) => {
  console.log("Called /check_businessday");
  const dt = req.body.dt;

  setting.steps.checkBusinessday(dt).then(isBDay => {
    res.send({isBDay: isBDay});
    res.status(200).end();
  }).catch(function (error) {
    console.error(error);
  });
});
app.post("/get_chartData_21day", (req, res) => {
  console.log("Called /get_chartData_21day");
  const dt = req.body.dt;
  const stckCd = req.body.stckCd;

  setting.steps.getChartData21day(stckCd, dt).then(chartData => {
    res.send(chartData);
    res.status(200).end();
  }).catch(function (error) {
    console.error(error);
  });
});
app.post("/get_diaryWrittenDt", (req, res) => {
  console.log("Called /get_diaryWrittenDt");
  const userId = req.body.userId;
  const dtFrom = req.body.dtFrom;
  const dtTo = req.body.dtTo;

  const query = pgDB.query.get_diaryWrittenDt(userId, dtFrom, dtTo);
  pgDB.executeQueryToArray(query, 'dt').then( dtArr => {
    res.send(dtArr);
    res.status(200).end();
  });
});
app.post("/get_monthHolidaysDt", (req, res) => {
  console.log("Called /get_monthHolidaysDt");
  const dt = req.body.dt;
  const query = pgDB.query.get_monthHolidaysDt(dt);
  sendQueryResult(query, res);
});
app.post("/get_diary", (req, res) => {
  console.log("Called /get_diary");
  const query = pgDB.query.get_diary(req);
  sendQueryResult(query, res);
});
app.post("/get_monthDiary", (req, res) => {
  console.log("Called /get_monthDiary");
  const query = pgDB.query.get_monthDiary(req);
  sendQueryResult(query, res);
});
app.post("/get_userRanking", (req, res) => {
  console.log("Called /get_userRanking");
  const query1 = pgDB.query.get_userRanking(req.body.range, req.body.userId);
  const query2 = pgDB.query.get_rankingUser_count(req.body.range);
  const result = {userRank:null, totalCnt:null};
  pgDB.executeQuery(query1).then( rows => {
    result.userRank = rows[0];
    pgDB.executeQuery(query2).then(rows => {
      result.totalCnt = rows[0].count;
      res.send(result);
      res.status(200).end();
    });
  });
});
app.post("/save_diary", (req, res) => {
  console.log("Called /save_diary");
  const query = pgDB.query.save_diary(req);
  sendQueryResult(query, res);
});
app.post("/get_all_stockInfo", (req, res) => {
  console.log("Called /get_all_stockInfo");
  const query = pgDB.query.all_stockInfo(req);
  sendQueryResult(query, res);
});
app.post("/get_economy_issues", (req, res) => {
  const dt = req.body.dt;
  const issueOptions = {
      method: 'GET',
      url: `https://investing.com/economic-calendar/?dateFrom=${dt}&dateTo=${dt}`
  };
  axios.request(issueOptions).then(response => {
    const $ = cheerio.load(response.data);
    const $us = $('span[data-img_key="United_States"]', "#economicCalendarData").parent(); //미국issue만 추리기
    var twoOrThreeStar = [];
    $us.each((i, u) => {
      var bullish = $(u).parent().find('td:nth-child(3)').attr('data-img_key');
      if(bullish === 'bull2' || bullish === 'bull3') {  //중요도 2,3만 고르기
        const issue = $(u).parent().find('td:nth-child(4)').find('a');
        // var issueName = issue.text().substring(2);
        var issueName = issue.text();
        var issueUrl = issue.attr('href');
        twoOrThreeStar.push({issueName:issueName, issueUrl:`https://investing.com${issueUrl}`});
      }
    });
    res.send(twoOrThreeStar);
    res.status(200).end();
  })
  .catch(function (error) {
      console.error(error);
  });
});
// 관리(설정)페이지 사용 요청
app.post("/setting_holidays", (req, res) => {
  console.log("Called /setting_holidays");
  const tYear = req.body.tYear;
  console.log(`tYear = ${tYear}`);
  setting.steps.save_holidays(tYear, res);
});
app.post("/add_stockInfo", (req, res) => {
  console.log("Called /add_stockInfo");
  setting.steps.add_stockInfo(req.body, res);
});
app.post("/setting_5yearChartData", (req, res) => {
  console.log("Called /setting_5yearChartData");

  setting.steps.save_range_chartData('5y').then(result => {
    res.send(result);
    res.status(200).end();
  }).catch((errorMsg) => {
    res.send(errorMsg);
    res.status(200).end();
  });
});

function sendQueryResult(query, res) {
  pgDB.executeQuery(query).then( rows => {
    res.send(rows);
    res.status(200).end();
  });
}
function charlendarDailyBatch() {
  console.log('charlendarDailyBatch setted.');
  // node-schedule 모듈로 06:05에 실행되는 데일리배치 작성하기.

  // const job = schedule.scheduleJob( {start: startTime, end: endTime, rule: '*/3 * * * * *', tz:'Asia/Seoul'}, () => {
  const job = schedule.scheduleJob( { rule: '0 30 8 * * *', tz:'Asia/Seoul' }, () => {  // 매일 새벽06:05에 실행
    return new Promise((resolve,reject) => {

      // 1) 어제 영업일정보(tdate)가져오기 -> 비영업일일경우 배치종료
      // 배포서버시간(UTC)이 한국보다 9시간 빨라서 (날짜-1) 안해도됨. 한국이 12일오전6시면 서버시간은 11일21시임.
      // var today = new Date();
      // const yesterday = new Date(today.setDate(today.getDate() - 1)).toISOString().slice(0, 10);
      const yesterday = new Date().toISOString().slice(0, 10);    // 클라우드서버 실행시
      setting.steps.checkBusinessday(yesterday).then( isBDay => {
        console.log(`=======> Target date : ${yesterday}`);
        if(!isBDay){
          resolve(`${yesterday} : 비영업일로 스케줄 종료.`);
        } else {
          // 2) tdate의 3가지 지표 종가데이터 어제날짜로 적재하기
          //    어제데이터 하루치만 가져오면 rtn(전일종가 필요)은 계산불가하므로 5일치를 가져와 4일치를 delete-insert한다.
          //    rtn null로 입수후, 데일리배치에서  rtn 업데이트를 하는 step 개발로 개선가능할듯함.

          setting.steps.save_range_chartData('5d').then(result => {
            console.log(result);

            // 3) 어제자 rtn으로 BULL/BEAR 판단하여 DAILY_DIARY테이블votechk컬럼 적재하기
            //    +월간 누적 정답일수(wincount) 적재하기
            setting.steps.score_votecheck(yesterday).then(result => {
              console.log(result);

              // 4) 월간 유저 랭킹(cld.user_ranking) 업데이트하기
              setting.steps.update_user_ranking(yesterday).then(result => {
                console.log(result);
                resolve('batch success!!');
              }).catch((errorMsg) => {reject(`update_user_ranking() 실행중 ERROR : `, errorMsg);});
            }).catch((errorMsg) => {reject(`score_votecheck() 실행중 ERROR : `, errorMsg);});
          }).catch((errorMsg) => {
            reject(`save_range_chartData('5d') 실행중 ERROR : `, errorMsg);
          });
        }
      }).catch(function (error) {
        reject(`checkBusinessday(${yesterday}) 실행중 ERROR : `, error);
      });
    });
  });

  job.on('scheduled', (time) => {
    console.log(time.toISOString(), ' - Daily batch job scheduled');
  });
  job.on('success', (successMsg) => {
    console.log(successMsg);
  });
  job.on('error', (errorMsg) => {
    console.log(errorMsg);
  });
}

const handleListen = () => {
  // console.log(`====>> Listening on http://localhost:3000`);
  console.log(`====>> Listening on '${port}'`);
  // 챌린더 일배치 schedule등록
  charlendarDailyBatch();
};


// express app 객체로 http 서버 만들기
const httpServer = http.createServer(app);
httpServer.listen(port, '::', handleListen);  