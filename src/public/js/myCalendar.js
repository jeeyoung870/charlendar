const emptyDay = 'day_empty.png'   // 일기없음
const sosoDay = 'day_soso.png'   // 일기쓴날
const goodJobDay = 'day_goodjob.png'   // 일기쓰고 맞춘날

const MyCalendar = ({userId, userNm}) => {
    //필요 data:
    // 1.해당월 휴장일 정보 (dt, description)
    // 2. 해당월 작성일기 정보 (dt, votechk)
    const [diaryArr, setDiaryArr] = React.useState();
    const [holidayArr, setHolidayArr] = React.useState({});
    const [yearMonth, setYearMonth] = React.useState( todayObj.toISOString().slice(0, 7) ); // ex) '2023-03'
    const [todayBDay, setTodayBDay] = React.useState(true);     // boolean

    if(userId && userNm && diaryArr){
        console.log('MyCalendar monthDiary ==> ', diaryArr);
        console.log('휴장일 ==> ', holidayArr);

        const tday = new Date(yearMonth);
        makeCalendar(tday);
    }
    
    React.useEffect(() => {
        if(userId ) {
            getMonthDiary(yearMonth, userId).then(dArr => {
                var diaryList = dArr.reduce( (acc, v) => {
                    return ({ ...acc, [v.dt]: [...(acc[v.dt] || []), 
                        v.votechk ?  goodJobDay : sosoDay ] }) ;
                }
                , {} );
                setDiaryArr(diaryList);
            });
            getMonthHolidaysDt(yearMonth).then(hDayArr => {
                var hDayList = hDayArr.reduce( (acc, v) => {
                    return ({ ...acc, [v.dt]: [...(acc[v.dt] || []), 
                        v.description ] }) ;
                }
                , {} );
                setHolidayArr(hDayList);
            });
            checkBdayOrNot(todayObj).then(bDay => {   // 오늘 영업일여부 확인
                if(!bDay){
                    setTodayBDay(bDay);
                }
            });
        }
        
    }, [userId, yearMonth]);

    // 달력 생성
    function makeCalendar(date) {
        const currentYear = date.getFullYear();
        const currentMonth = date.getMonth() + 1;
        const currMonthNm = date.toLocaleString("en-US", { month: "short" });
    
        const firstDay = new Date(date.setDate(1)).getDay();
        const lastDay = new Date(currentYear, currentMonth, 0).getDate();
    
        const limitDay = firstDay + lastDay;
        const nextDay = Math.ceil(limitDay / 7) * 7;
    
        let htmlDummy = '';
    
        for (let i = 0; i < firstDay; i++) {
        htmlDummy += `<div class="noColor"></div>`;
        }
    
        for (let i = 1; i <= lastDay; i++) {
            const targetDt = `${currentYear}-${currentMonth.pad()}-${i.pad()}`
            
            // htmlDummy += `
            //     <div>
            //     ${i}
            //     <p>
            //         ${diaryArr[targetDt]?.join('</p><p>') || ''}
            //     </p>
            //     </div>
            // `;
            if(holidayArr[targetDt]) {
                htmlDummy += `
                    <div class="holiday" onclick="alert('${holidayArr[targetDt][0]} is Holiday.')" >
                    ${i}
                    <p>H.D</p>
                    </div>
                `;
            } else {
                htmlDummy += `
                    <div class="normalDay" onclick="goToDiary('${targetDt}')" >
                        ${i} <br/>
                        <img class="calendar_face" src="/public/css/image/${diaryArr[targetDt] ? diaryArr[targetDt][0] : emptyDay }" />
                    </div>
                `;
            }
        }
        for (let i = limitDay; i < nextDay; i++) {
            htmlDummy += `<div class="noColor"></div>`;
        }
        
        document.querySelector(`.dateBoard`).innerHTML = htmlDummy;
        document.querySelector(`.dateTitle`).innerText = `${currMonthNm} ${currentYear}`;
    }
    // 이전달 이동
    function prevMonth () {
        setYearMonth(curr => {
            var currDt = new Date(curr);
            return new Date(currDt.setMonth(currDt.getMonth()-1)).toISOString().slice(0, 7);
        } );
        // makeCalendar(new Date(date.setMonth(date.getMonth() - 1)));
    }
    // 다음달 이동
    function nextMonth() {
        setYearMonth(curr => {
            var currDt = new Date(curr);
            return new Date(currDt.setMonth(currDt.getMonth()+1)).toISOString().slice(0, 7);
        } );
        // makeCalendar(new Date(date.setMonth(date.getMonth() + 1)));
    }

    return (
        <>
        <div className="calendar">
            <div className="header">
                <div className="btn prevDay" onClick={prevMonth} ></div>
                <div className='dateTitle'></div>
                <div className="btn nextDay" onClick={nextMonth} ></div>
            </div>
            
            <div className="grid dateHead">
                <div>S</div>
                <div>M</div>
                <div>T</div>
                <div>W</div>
                <div>T</div>
                <div>F</div>
                <div>S</div>
            </div>

            <div className="grid dateBoard"></div>
        </div>

        {todayBDay ? 
        <a  onClick={() =>  goToDiary()} >
            <div className="diary_button">Today's Diary</div>
        </a>
        :
        <div className="diary_button today_holiday">Today is Holiday</div>
        }
        </>
    );
};

function getMonthDiary(yearMonthStr, userId) {
    return new Promise((resolve,reject) => {
        const options = {
            method: 'POST',
            url: "/get_monthDiary",
            data: {userId:userId, yearMonthStr:yearMonthStr},
            withCredentials: true
        };
        axios.request(options).then(res => {
            resolve(res.data) ;
        }).catch(function (error) {
            console.error(error);
        });
    });
}
function getMonthHolidaysDt(yearMonthStr) {
    return new Promise((resolve,reject) => {
        const options = {
            method: 'POST',
            url: "/get_monthHolidaysDt",
            data: {dt:yearMonthStr},
            withCredentials: true
        };
        axios.request(options).then(res => {
            resolve(res.data) ;
        }).catch(function (error) {
            console.error(error);
        });
    });
}

// pad method
Number.prototype.pad = function() {
    return this > 9 ? this : '0' + this;
};
function goToDiary(targetDt) {
    if(targetDt){
        window.location.href = `/dailyDiary?dt=${targetDt}`;
    } else {
        window.location.href = `/dailyDiary`;
    }
}
