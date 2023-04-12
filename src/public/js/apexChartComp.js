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
                    format: 'MM/dd',
                }
            },
            tooltip: {
                x: {format: 'yyyy년 M월 dd일'},
                y: [
                {
                    formatter: function(value, { series, seriesIndex, dataPointIndex, w }) {
                        var bp = chartData.baseprice[dataPointIndex];
                        var ep = value;
                        var rtn = chartData.rtn[dataPointIndex];
                        return `
                        시초가 ▶ ${bp}<br/>
                        종가 ▶ ${ep}<br/>
                        수익률 ▶ ${rtn}%`;
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











/*
class _ApexChart extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
      
        series: [{
          data: series.monthDataSeries1.prices
        }],
        options: {
          chart: {
            height: 350,
            type: 'line',
            id: 'areachart-2'
          },
          annotations: {
            yaxis: [{
              y: 8200,
              borderColor: '#00E396',
              label: {
                borderColor: '#00E396',
                style: {
                  color: '#fff',
                  background: '#00E396',
                },
                text: 'Support',
              }
            }, {
              y: 8600,
              y2: 9000,
              borderColor: '#000',
              fillColor: '#FEB019',
              opacity: 0.2,
              label: {
                borderColor: '#333',
                style: {
                  fontSize: '10px',
                  color: '#333',
                  background: '#FEB019',
                },
                text: 'Y-axis range',
              }
            }],
            xaxis: [{
              x: new Date('23 Nov 2017').getTime(),
              strokeDashArray: 0,
              borderColor: '#775DD0',
              label: {
                borderColor: '#775DD0',
                style: {
                  color: '#fff',
                  background: '#775DD0',
                },
                text: 'Anno Test',
              }
            }, {
              x: new Date('26 Nov 2017').getTime(),
              x2: new Date('28 Nov 2017').getTime(),
              fillColor: '#B3F7CA',
              opacity: 0.4,
              label: {
                borderColor: '#B3F7CA',
                style: {
                  fontSize: '10px',
                  color: '#fff',
                  background: '#00E396',
                },
                offsetY: -10,
                text: 'X-axis range',
              }
            }],
            points: [{
              x: new Date('01 Dec 2017').getTime(),
              y: 8607.55,
              marker: {
                size: 8,
                fillColor: '#fff',
                strokeColor: 'red',
                radius: 2,
                cssClass: 'apexcharts-custom-class'
              },
              label: {
                borderColor: '#FF4560',
                offsetY: 0,
                style: {
                  color: '#fff',
                  background: '#FF4560',
                },
          
                text: 'Point Annotation',
              }
            }, {
              x: new Date('08 Dec 2017').getTime(),
              y: 9340.85,
              marker: {
                size: 0
              },
              image: {
                path: '../../assets/images/ico-instagram.png'
              }
            }]
          },
          dataLabels: {
            enabled: false
          },
          stroke: {
            curve: 'straight'
          },
          grid: {
            padding: {
              right: 30,
              left: 20
            }
          },
          title: {
            text: 'Daily ___ prices',
            align: 'left'
          },
          labels: series.monthDataSeries1.dates,
          xaxis: {
            type: 'datetime',
          },
        },
      
      
      };
    }

  

    render() {
      return (
        <div>
          <div id="chart">
            <ReactApexChart options={this.state.options} series={this.state.series} type="line" height={300} />
          </div>
        </div>
      );
    }
  }
  */