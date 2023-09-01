const ApexChart = ({stck, chartData, dt, diaryDt}) => {
    const [pointsArr, setPointsArr] = React.useState([]);

    React.useEffect(() => {
        // setStckNm(stcknm);
        if(chartData && diaryDt){
            // console.log('dt = ', dt);
            // console.log(chartData);
            // console.log(diaryDt);

            // 일기쓴날 표시
            mapDiaryPoints().then(annotationPoints => { setPointsArr(annotationPoints); });
        }
    }, [chartData, diaryDt, stck/*stck, chartData, dt*/]);

    function mapDiaryPoints() {
        const maxYval = Math.max(...chartData.endprice);
        const minYval = Math.min(...chartData.endprice);
        var adjust = (maxYval-minYval)*0.07;

        var annotationPoints = [];
        return new Promise((resolve,reject) => {
            diaryDt.map(dDt => {
                var diaryPoint = {  
                    x: 0,
                    y: null,
                    marker: {size: 0},
                    image: { path: '/public/css/image/memo.png' }
                };
                var yIdx = chartData.dt.indexOf(dDt);
                var xVal = new Date(dDt).getTime();
                var yVal = chartData.endprice[yIdx];
                diaryPoint.x = xVal;
                diaryPoint.y = yVal + adjust;
                annotationPoints.push(diaryPoint);
            });
            resolve(annotationPoints);
        });
    }
        
    var state = {     
        series: [{
            name: "종가",
            // data: chartSeries.monthDataSeries1.prices
            data: chartData?.endprice
        }],
        options: {
            chart: {
                height: 250,
                type: 'line',
                id: 'areachart-2',
                // toolbar: {show: false},
                // zoom: {enabled: false}
            },
            markers: {
                size: 3
            },
            annotations: {
                yaxis: [],
                xaxis: [{   // 기준일(오늘) 표시
                    x: new Date(dt).getTime(),
                    strokeDashArray: 0,
                    borderColor: '#FF9900',
                    label: {
                        borderColor: '#FF9900',
                        style: {
                            color: '#fff',
                            background: '#FF9900',
                        },
                        text: 'Today',
                        position: 'bottom'
                    }
                }],
                points: pointsArr
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                width: 6,
                curve: 'straight',
                lineCap: 'round'
            },
            grid: {
                padding: {
                right: 30,
                left: 20
                }
            },
            title: {
                text: `Daily ${stck?.stcknm_eng} prices`,
                align: 'left'
            },
            // legend: {
            //     tooltipHoverFormatter: function(val, opts) {
            //     return val + ' - ' + opts.w.globals.series[opts.seriesIndex][opts.dataPointIndex] + ''
            //     }
            // },
            // labels: series.monthDataSeries1.dates,
            xaxis: {
                // categories: chartSeries.monthDataSeries1.dates,
                categories: chartData?.dt,
                type: 'datetime',
                labels: {
                    format: 'd MMM',
                }
            },
            tooltip: {
                x: {format: 'yyyy-MM-dd'},
                y: [
                {
                    formatter: function(value, { series, seriesIndex, dataPointIndex, w }) {
                        var bp = chartData.baseprice[dataPointIndex];
                        var ep = value;
                        var rtn = chartData.rtn[dataPointIndex];
                        return `
                        Start ▶ ${bp}<br/>
                        End ▶ ${ep}<br/>
                        Return ▶ ${rtn}%`;
                    },
                    title: {
                        formatter: function (val) {
                            return ''
                        }
                    }
                },
                ]
            },
            colors: ['#625FFF']
        }
    };

    return (
        <div>
          <div id="chart">
            <ReactApexChart options={state.options} series={state.series} type="line" height={250} />
          </div>
        </div>
    );
};


