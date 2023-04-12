// 휴장일 정보 적재
const InitBusinessDaySet = () => {
    const [tYear, setYear] = React.useState("");
    const handleChange = e => {
        setYear(e.target.value);
    }
    const handleSubmit = e => {
        e.preventDefault();

        const options = {
            method: 'POST',
            url: "/setting_holidays",
            data: {tYear: tYear},
            withCredentials: true
        };
        axios.request(options).then(res => {
            alert(`${res.data}`);
        }).catch(function (error) {
        console.error(error);
        });
    }

    return (
        <div>
            <h2>휴장일 정보 입수</h2>
            <form onSubmit={handleSubmit}>
                대상 년도:
                <input type="text" placeholder="2024" required
                    value={tYear}
                    onChange={handleChange}
                />
                <button type="submit">적재하기</button>
            </form>
        </div>
    );
}
// 관리종목 추가(cld.STOCK_INFO) -차트데이터 입수 대상종목추가.
const AddStock = () => {
    const [values, setValues] = React.useState({
        stckcode: "",
        stcknm_eng: "",
        stcknm_kr: "",
        region: ""
    });
    const handleChange = e => {
        setValues({
            ...values,
            [e.target.name]: e.target.value,
        });
    }
    const handleSubmit = e => {
        e.preventDefault();
        console.log(values);

        const options = {
            method: 'POST',
            url: "/add_stockInfo",
            data: values,
            withCredentials: true
        };
        axios.request(options).then(res => {
            alert(res.data);
            setValues({stckcode: "",stcknm_eng: "",stcknm_kr: "",region: ""});
        });
    }

    return (
        <div>
            <h2>종목(stock) 추가</h2>
            차트데이터 입수대상 주식종목을 추가합니다.
            <form onSubmit={handleSubmit}>
                <ul>
                    <li> 종목코드(<a href="https://rapidapi.com/apidojo/api/yh-finance/">야후파이낸스</a> symbol) :
                        <input
                            type="text" name="stckcode" placeholder="^IXIC" required
                            value={values.stckcode}
                            onChange={handleChange}
                        />
                    </li>
                    <li> 표시 이름(영문) : 
                        <input
                            type="text" name="stcknm_eng" placeholder="NASDAQ" required
                            value={values.stcknm_eng}
                            onChange={handleChange}
                        />
                    </li>
                    <li> 표시 이름(한글) : 
                        <input
                            type="text" name="stcknm_kr" placeholder="나스닥지수" required
                            value={values.stcknm_kr}
                            onChange={handleChange}
                        />
                    </li>
                    <li> 지역(<a href="https://rapidapi.com/apidojo/api/yh-finance/">야후파이낸스</a> region) : 
                        <input
                            type="text" name="region" placeholder="US" required
                            value={values.region}
                            onChange={handleChange}
                        />
                    </li>
                </ul>
                <button type="submit">종목 추가하기</button>
            </form>
        </div>
    );
}
// 과거 5년치 차트 데이터 적재
const InitChartDataSet = () => {
    function insert5yearChartData() {
        const options = {
            method: 'POST',
            url: "/setting_5yearChartData",
            data: {},
            withCredentials: true
        };
        axios.request(options).then(res => {
            alert(`${res.data}`);
        }).catch(function (error) {
        console.error(error);
        });
    }
    return (
        <div>
            <h2>5년치 과거 차트데이터 입수</h2>
            <button onClick={insert5yearChartData}>적재하기</button>
        </div>
    );
}