const DailyChart = ({userId, dt, stckArr}) => {
    // 선택중인 종목 state
    const [selected_stck, selectStock] = React.useState();
    const [chartData, setChartData] = React.useState();
    const [writtenDtArr, setWrittenDtArr] = React.useState(); // 일기쓴날 arr

    React.useEffect(() => {
        console.log('DailyChart useEffect : ',userId, dt, stckArr);

        if(!selected_stck){
            selectStock(stckArr[0]);
        }
        if(selected_stck && userId && dt){
            get21chartData(selected_stck.stckcode, dt).then(cData => {
                // writtenDtArr 세팅
                findWrittenDt(userId, cData).then(dtArr => { setWrittenDtArr(dtArr); });
                // chartData(선택한종목) 세팅
                mapChartData(cData).then(result => {setChartData(result);});
            }).catch(function (error) {
                console.error(error);
            });
        }

    }, [userId, dt, stckArr]);

    function findWrittenDt(userId, cData) {
        return new Promise((resolve,reject) => {
            const dtFrom = cData[0].dt;
            const dtTo = cData[cData.length-1].dt;

            var writtenDtOptions = {
                method: 'POST',
                url: "/get_diaryWrittenDt",
                data: {userId:userId, dtFrom:dtFrom, dtTo:dtTo},
                withCredentials: true
            };
            axios.request(writtenDtOptions).then(res => {
                resolve(res.data);
            }).catch(function (error) {
                console.error(error);
            });
        });
    }
    function mapChartData(chartData) {
        var result = {dt:[], baseprice:[], endprice:[], rtn:[]};
        return new Promise((resolve,reject) => {
            chartData.map((data, index) => {
                result.dt.push(data.dt);
                if(index==chartData.length-1 && dt==today){ //차트에 오늘 날짜추가
                    result.dt.push(today);
                }
                result.baseprice.push(Math.round(data.baseprice*100)/100);
                result.endprice.push(Math.round(data.endprice*100)/100);
                result.rtn.push(Math.round(data.rtn*100)/100);
            });
            resolve(result);
        });
    }
    function get21chartData(stckcode, tDate) {
        return new Promise((resolve,reject) => {
            var chartSelectOptions = {
                method: 'POST',
                url: "/get_chartData_21day",
                data: {stckCd:stckcode, dt:tDate},
                withCredentials: true
            };
            axios.request(chartSelectOptions).then(res => {
                resolve(res.data);
            });
        });
    }
    function stockSelect(event) {
        event.preventDefault();
        document.querySelector('.stockBtn_selected').classList.remove('stockBtn_selected');
        event.target.classList.add('stockBtn_selected');
        var idx = event.target.value;
        selectStock(stckArr[idx]);
        // selected_stck 해당하는 종목 차트를 setChartData() 지정
        get21chartData(stckArr[idx].stckcode, dt).then(cData => {
            mapChartData(cData).then(result => {setChartData(result);});
        }).catch(function (error) {
            console.error(error);
        });
    }

    return (
        <div>
            <div className="chips">
                {stckArr.map((stck, index) => (
                    <button  
                        className={index===0?"stockBtn stockBtn_selected":"stockBtn"}
                        value={index}
                        onClick={stockSelect}
                    >{stck.stcknm_eng}</button>
                ))}
            </div>
            <ApexChart stck={selected_stck} chartData={chartData} dt={dt} diaryDt={writtenDtArr} />
        </div>
    );
};

const DailyEconomyIssues = ({ dt}) => {
    const [issueArr, setIssueArr] = React.useState([]);
    React.useEffect(() => {
        const options = {
            method: 'POST',
            url: "/get_economy_issues",
            data: {dt: dt},
            withCredentials: true,
            headers: {
                'Content-type': 'application/x-www-form-urlencoded' 
            }
        };
        axios.request(options).then(res => {
            setIssueArr(res.data);
            // console.log('issues : ',issueArr);
        }).catch(function (error) {
            console.error(error);
        });
    }, [dt]);
    
    return (
        <div className="today_message">
            <div className="message_title" >Today's Issues</div>
            <div className="p_today_message" >
                {issueArr.map((issue, index) => (
                    <a href={issue.issueUrl} target="_blank" rel="noopener noreferrer" >
                        {issue.issueName}
                    </a>
                ))}
            </div>
        </div>
    );
};

const updownMap = {BULL:'Bullish', BEAR:'Bearish'};
const limitTime = 14*(1000*60*60) + 30*(1000*60);    // 11:30 (미국주식시장 open시각) 세팅
const DailyDiaryForm = ({user, dt, stckArr}) => {

    const userId = user.userId;

    // 선택중인 종목cd state
    // const [selected_stckcode, selectStock] = React.useState("");
    const [diary, setDiary] = React.useState({});
    console.log('handleChange diary = ', diary);

    var voteImg = document.querySelector(`.bull_and_bear_img input[value=${diary.vote}]`);
    if(diary.vote){
        if(diary.vote !== 'X'){    // 선택한 투표 있을경우
            document.querySelector('.vote_selected')?.classList.remove('vote_selected');
            voteImg.classList.add('vote_selected');
        }    
    }

    React.useEffect(() => {
        // vote 초기화
        document.querySelector('.vote_selected')?.classList.remove('vote_selected');
        
        const options = {
            method: 'POST',
            url: "/get_diary",
            data: {userId:userId, dt:dt},
            withCredentials: true
        };
        axios.request(options).then(res => {
            const dData = res.data[0];
            setDiaryInfo(dData);    //rerender
        }).catch(function (error) {
            console.error(error);
        });
    }, [stckArr, userId, dt]);

    function handleChange(event) {
        setDiary({
            ...diary,
            [event.target.name]: event.target.value,
        });
    }
    function setDiaryInfo(dData) {
        if(dData) {  //일기 있을때
            setDiary(dData);
        } else {    //일기 없을때
            setDiary({
                dt: dt, 
                userid: userId,
                memo: '', 
                votecode: stckArr[0]?.stckcode, 
                vote: 'X',
                votechk: null
            });
        }
    }
    function saveDiary(event) {
        const options = {
            method: 'POST',
            url: "/save_diary",
            data: diary,
            withCredentials: true
        };
        axios.request(options).then(res => {
            alert(`${res.data[0].dt} Diary Saved!`);
        }).catch(function (error) {
        console.error(error);
        });
    }

    return(
        <div>
            <div className="diary_all">
                <div className="message_title">My Diary</div>
                <div className="diary">
                    <div>{diary.memo?diary.memo.length:0}/500</div>
                    <textarea cols="30" rows="10" 
                        name="memo" className="dairy_textarea"
                        value={diary.memo} maxlength="500"
                        onChange={handleChange}
                    ></textarea>
                </div>

                <div className="bull_and_bear_all">
                    <div className="message_title">
                        <span>{"Today's "}</span>
                        <span>
                            <select name="votecode" value={diary.votecode} 
                                onChange={handleChange}
                                disabled={ (new Date(dt).getTime() + limitTime) > new Date().getTime() ? false : true }
                            >
                                { stckArr.map((stck, index) => (
                                    <option value={stck.stckcode}>{stck.stcknm_eng}</option>
                                )) }
                            </select>
                        </span>
                        <span>{"will be..."}</span>
                    </div>
                    {/* <select 
                        name="vote" value={diary.vote} 
                        onChange={handleChange}>
                        <option value="X">Select BULL or BEAR</option>
                        <option value="BULL">BULL</option>
                        <option value="BEAR">BEAR</option>
                    </select> */}
                    <div className="bull_and_bear_img">
                        <input type="image" name="vote" value="BULL" onClick={handleChange}
                            src="/public/css/image/bull.png" 
                            className="bull_img" 
                        />
                        <input type="image" name="vote" value="BEAR" onClick={handleChange}
                            src="/public/css/image/bear.png" 
                            className="bear_img"
                        />
                    </div>
                </div>
                
                { (new Date(dt).getTime() + limitTime) > new Date().getTime() ? null : 
                    <div className="predict_message" >
                        {diary.votechk===null ? 
                            <div className="predict_message_title">Prediction Period Ended</div> : 
                            (diary.votechk ? 
                                <div>
                                    <div className="predict_message_title">🎉Prediction Succeed!🎉</div>
                                    <div class="p_predict_message">
                                        predicted the {updownMap[diary.vote]} of 
                                        {stckArr.map((stck, index) => (
                                            stck.stckcode==diary.votecode ? ' '+stck.stcknm_eng : ''
                                        ))}!
                                    </div>
                                </div> 
                                : 
                                <div>
                                    <div className="predict_message_title">💀Prediction Failed!💀</div>
                                    <div class="p_predict_message">Let's get correct next time!</div>
                                </div>
                            )
                        }
                    </div>
                }
            </div>
            <div onClick={saveDiary} className="diary_button" >Save Diary</div>
        </div>
    );
};
