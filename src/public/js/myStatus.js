// title
const msgTitle_welcome = 'Welcome!👋';   // 정보 없을때
const msgTitle_fail = 'Prediction Failed..💀';
const msgTitle_success = 'Prediction Succeed!🎉';    // 전날 성공시(휴장일에도 보임)
const msgTitle_holiday = 'Holiday💤'; 
// 상세메세지
const msg_welcome = `Write an economic diary and predict the movement of chart.`;
const msg_fail = `Prediction missed. Let's try again!`;
const msg_success1 = `Great first step! Let's move forward together!`;  //첫번째성공
const msg_success4 = `You're doing well!`;  //2~4번째
const msg_success9 = `Master approved by Charlendar!`;  //5~9번째
const msg_success10up = `Inspiration for Charlengers!`;  //10이상
const msg_holiday = 'Next trading day > '; 
// 순위별 이모지
const emo1 = 'emoji_1.png'   // 상위100~50%
const emo2 = 'emoji_2.png'   // 상위50~15%
const emo3 = 'emoji_3.png'   // 상위15~5%
const emo4 = 'emoji_4.png'   // 상위5~0%

const updownMap = {BULL:'Bullish', BEAR:'Bearish'};
// const stckmap = {'^IXIC':'나스닥', '^DJI':'다우', '^GSPC':'S&P'};


const MyStatus = ({userId, userNm, stckArr}) => {

    // 1. 전영업일 작성 일기 기준 정보 보여주기 (votecodename, vote, votechk, wincount)
    // 3. user ranking 정보 (rownum, count(*), voterate )
    const [predictMsg, setPredictMsg] = React.useState();
    const [ranking, setRanking] = React.useState();
    // const [stckMap, setStckMap] = React.useState();

    React.useEffect(() => {
        if(stckArr[0] && userId) {
            mapStckArr().then(stckmap => {
                // setStckMap(stckmap);

                // checkBusinessday(todayStr).then();
                getNextBday(todayStr, -oneDay).then(bDay => {
                    console.log('Prior trading day : ', bDay );
                    getLastDiaryInfo(bDay).then( dData => {
                        console.log(dData);

                        makePredictMessages(dData, stckmap).then(msgs =>{
                            console.log(msgs);
                            setPredictMsg(msgs);
                        });
                    });
                });

                getMonthlyRankingInfo().then(data => {
                    console.log(data);
                    var usrRank = data.userRank.rownum / data.totalCnt * 100;   //상위몇프로 계산
                    if(usrRank <= 5){
                        data.emoji = emo4;
                    } else if(usrRank <= 15){
                        data.emoji = emo3;
                    } else if(usrRank <= 50){
                        data.emoji = emo2;
                    } else{
                        data.emoji = emo1;
                    }
                    setRanking(data);
                });

            });
        }
    }, [userId, stckArr]);

    function mapStckArr() {
        var arrToMap = {};
        return new Promise((resolve,reject) => {
            stckArr.map((stck, index) =>{
                arrToMap[stck.stckcode] = stck.stcknm_kr;
            });
            resolve( arrToMap );
        });
    }
    function getMonthlyRankingInfo() {
        return new Promise((resolve,reject) => {
            const options = {
                method: 'POST',
                url: "/get_userRanking",
                data: {userId:userId, range:'MONTHLY'},
                withCredentials: true
            };
            axios.request(options).then(res => {
                resolve(res.data) ;
            }).catch(function (error) {
                console.error(error);
            });
        });
    }
    function getLastDiaryInfo(businessDay) {
        return new Promise((resolve,reject) => {
            const options = {
                method: 'POST',
                url: "/get_diary",
                data: {userId:userId, dt:businessDay},
                // data: {userId:userId, dt:'2023-02-24'},
                withCredentials: true
            };
            axios.request(options).then(res => {
                resolve(res.data[0]) ;
            }).catch(function (error) {
                console.error(error);
            });
        });
    }
    function makePredictMessages(dData, stckmap){
        var messages = [];
        return new Promise((resolve,reject) => {
            
            if(!dData){     // 일기 없을때
                messages = [msgTitle_welcome, msg_welcome];
                // 휴장일 확인처리 로직
            }
            else if(dData.votechk !== null){     //투표 했을때
                if(!dData.votechk){ // 예측 실패
                    console.log('dData.dt ==> ', dData.dt);
                    var date = new Date(dData.dt);
                    // var mm = date.getMonth()+1;
                    var mmName = date.toLocaleString("en-US", { month: "long" });
                    var dd = date.getDate();
                    messages = [msgTitle_fail, `${dd} ${mmName} ${updownMap[dData.vote]}${msg_fail}`];
                } else{ // 예측 성공
                    var voteInfoStr = `Correctly predicted the ${updownMap[dData.vote]} of ${stckmap[dData.votecode]}!`;
                    messages = [msgTitle_success, voteInfoStr];

                    if(dData.wincount >= 10){
                        var str = `You're on a ${dData.wincount}-day winning streak! ${msg_success10up}`;
                        messages.push(str);
                    }else if(dData.wincount >= 5){
                        var str = `You're on a ${dData.wincount}-day winning streak! ${msg_success9}`;
                        messages.push(str);
                    }else if(dData.wincount >= 2){
                        var str = `You're on a ${dData.wincount}-day winning streak! ${msg_success4}`;
                        messages.push(str);
                    }else{
                        var str = `${msg_success1}`;
                        messages.push(str);
                    }
                }
            } else { //투표내역 없을때
                messages = [msgTitle_welcome, msg_welcome];
                // 휴장일 확인처리 로직
            }
            resolve(messages);
        });
    }
    function checkBusinessday(date) {
        return new Promise((resolve,reject) => {
            const options = {
                method: 'POST',
                url: "/check_businessday",
                data: {dt:date},
                withCredentials: true
            };
            axios.request(options).then(res => {
                resolve(res.data.isBDay) ;
            }).catch(function (error) {
                console.error(error);
            });
        });
    }

    return (
        <>
        {ranking ?
        <div className="user_profile">
            <div className="p_batting_average">
                <span className="user_name">{userNm}</span>
                <span className="average_is">'s Month Accuracy</span><br/>
                <span className="your_average">{ranking.userRank.voterate}%</span>
                <div className="your_rank">
                    <span className="font_key_color">{ranking.userRank.rownum}th </span>
                    <span>of {ranking.totalCnt}</span>
                </div>
            </div>
            <div className="user_emoji">
                <img src={"/public/css/image/"+ranking.emoji} />
            </div>
        </div>
        : null}
        <PredictMessage predictMsg={predictMsg} />
        </>
    );
};

const PredictMessage = ({predictMsg}) => {

    return(
        predictMsg ? 
        <div className="private_message">
            <div className="private_message_title">{predictMsg[0]}</div>
            <div className="p_private_message">
                {predictMsg[1]} 
                {predictMsg[2] ? (<div>{predictMsg[2]}</div>) : null}
            </div>
        </div>
        : null
    );
};