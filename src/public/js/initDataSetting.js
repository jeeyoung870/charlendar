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
            <h2>Insert Holiday Info</h2>
            <form onSubmit={handleSubmit}>
                Target Year:
                <input type="text" placeholder="2024" required
                    value={tYear}
                    onChange={handleChange}
                />
                <button type="submit">INSERT</button>
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
            <h2>Add Stock</h2>
            Add stock infos for acquiring chart datas.
            <form onSubmit={handleSubmit}>
                <ul>
                    <li> Stock Code(<a href="https://rapidapi.com/apidojo/api/yh-finance/">yahoo finance</a> symbol) :
                        <input
                            type="text" name="stckcode" placeholder="^IXIC" required
                            value={values.stckcode}
                            onChange={handleChange}
                        />
                    </li>
                    <li> Display Name(English) : 
                        <input
                            type="text" name="stcknm_eng" placeholder="NASDAQ" required
                            value={values.stcknm_eng}
                            onChange={handleChange}
                        />
                    </li>
                    <li> Display Name(Korean) : 
                        <input
                            type="text" name="stcknm_kr" placeholder="나스닥지수" required
                            value={values.stcknm_kr}
                            onChange={handleChange}
                        />
                    </li>
                    <li> Location(<a href="https://rapidapi.com/apidojo/api/yh-finance/">yahoo finance</a> region) : 
                        <input
                            type="text" name="region" placeholder="US" required
                            value={values.region}
                            onChange={handleChange}
                        />
                    </li>
                </ul>
                <button type="submit">Add Stock</button>
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
            <h2>Insert past 5 years' Chart Datas</h2>
            <button onClick={insert5yearChartData}>INSERT</button>
        </div>
    );
}