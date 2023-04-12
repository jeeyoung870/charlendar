// title
const msgTitle_welcome = '어서오세요!👋';   // 정보 없을때
const msgTitle_fail = '예측 실패..💀';
const msgTitle_success = '예측 성공!🎉';    // 전날 성공시(휴장일에도 보임)
const msgTitle_holiday = '오늘은 휴장일💤'; 
// 상세메세지
const msg_welcome = `경제 일기를 쓰고, 관심종목의 차트를 맞춰봐요.`;
const msg_fail = ' 예측은 빗나갔어요. 다시 도전해봐요!';
const msg_success1 = '위대한 첫걸음! 앞으로도 함께해요!';  //첫번째성공
const msg_success4 = '잘 하고 있어요!';  //2~4번째
const msg_success9 = '챌린더가 인정한 고수!';  //5~9번째
const msg_success10up = '챌린저들의 귀감이 되실 분!';  //10이상
const msg_holiday = '다음 개장일은 '; 
// 순위별 이모지
const emo1 = 'emoji_1.png'   // 상위100~50%
const emo2 = 'emoji_2.png'   // 상위50~15%
const emo3 = 'emoji_3.png'   // 상위15~5%
const emo4 = 'emoji_4.png'   // 상위5~0%

const updownMap = {BULL:'상승', BEAR:'하락'};
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
                    console.log('바로 전 영업일 : ', bDay );
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
                    var mm = date.getMonth()+1;
                    var dd = date.getDate();
                    messages = [msgTitle_fail, `${mm}월 ${dd}일의 ${updownMap[dData.vote]}${msg_fail}`];
                } else{ // 예측 성공
                    var voteInfoStr = `${stckmap[dData.votecode]}의 ${updownMap[dData.vote]}을 맞췄어요.`;
                    messages = [msgTitle_success, voteInfoStr];

                    if(dData.wincount >= 10){
                        var str = `${dData.wincount}일째 연승 중! ${msg_success10up}`;
                        messages.push(str);
                    }else if(dData.wincount >= 5){
                        var str = `${dData.wincount}일째 연승 중! ${msg_success9}`;
                        messages.push(str);
                    }else if(dData.wincount >= 2){
                        var str = `${dData.wincount}일째 연승 중! ${msg_success4}`;
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
                <span className="average_is">님의 이번 달 적중률은</span><br/>
                <span className="your_average">{ranking.userRank.voterate}%</span>
                <div className="your_rank">
                    <span>{ranking.totalCnt}명 중 </span>
                    <span className="font_key_color">{ranking.userRank.rownum}등</span>
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