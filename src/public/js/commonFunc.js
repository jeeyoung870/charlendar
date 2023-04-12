// 가까운 영업일찾기
async function getNextBday(date, increase) {
    return new Promise((resolve,reject) => {
        const options = {
            method: 'POST',
            url: "/next_businessday",
            data: {dt:date, oneDay:increase},
            withCredentials: true
        };
        axios.request(options).then(res => {
            resolve(res.data.bDay) ;
        }).catch(function (error) {
            console.error(error);
        });
    });
}
// 영업일여부 확인
async function checkBdayOrNot(date) {
    return new Promise((resolve,reject) => {
        const options = {
            method: 'POST',
            url: "/check_businessday",
            data: {dt: date.toISOString().slice(0, 10)},
            withCredentials: true
        };
        axios.request(options).then(res => {
            resolve(res.data.isBDay) ;
        }).catch(function (error) {
            console.error(error);
        });
    });
}
// 모든 종목정보 불러오기
async function getAllStockInfo() {
    return new Promise((resolve,reject) => {
        const options = {
            method: 'POST',
            url: "/get_all_stockInfo",
            withCredentials: true
        };
        axios.request(options).then(res => {
            resolve(res.data) ;
        }).catch(function (error) {
        console.error(error);
        });
    });
}