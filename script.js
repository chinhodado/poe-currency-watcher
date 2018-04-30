let Currency = {
    Alt: {
      id: 1,
      name: "Alt"
    },
    Fusing: {
        id: 2,
        name: "Fusing"
    },
    Alc: {
        id: 3,
        name: "Alc"
    },
    Chaos: {
        id: 4,
        name: "Chaos"
    },
    GCP: {
        id: 5,
        name: "GCP"
    },
    Exalted: {
        id: 6,
        name: "Exalted"
    },
    Jeweller: {
        id: 8,
        name: "Jeweller"
    },
    Chisel: {
        id: 10,
        name: "Chisel"
    },
    Regret: {
        id: 13,
        name: "Regret"
    },
    Regal: {
        id: 14,
        name: "Regal"
    },
    Vaal: {
        id: 16,
        name: "Vaal"
    },
    Silver: {
        id: 35,
        name: "Silver"
    }
};

let blacklist = [];
let usernameHighlight = '';

async function fetchData(want, have) {
    let html = await $.ajax({
        method: "GET",
        url: "http://currency.poe.trade/search?league=Bestiary&online=x&want=" + want.id + "&have=" + have.id
    });

    let el = document.createElement( 'html' );
    el.innerHTML = html;
    let offers = el.getElementsByClassName("displayoffer");
    let sellBuyRatios = [], buySellRatios = [], sellBuyRatiosData = [], buySellRatiosData = [];
    let sells = [], buys = [], users = [], stocks = [];
    let i = 0;
    let max = Math.min(15, offers.length);
    while (i < max) {
        let sell = offers[i].getAttribute("data-sellvalue");
        let buy = offers[i].getAttribute("data-buyvalue");
        let user = offers[i].getAttribute("data-ign");
        let stock = offers[i].getAttribute("data-stock");

        if (blacklist.indexOf(user) !== -1) {
            console.log("Blacklisted: " + user + ", want: " + want.name + ", have: " + have.name);
            i++;
            max++;
            continue;
        }

        let sellNum = Number.parseFloat(sell);
        let buyNum = Number.parseFloat(buy);
        sells.push(sellNum);
        buys.push(buyNum);
        users.push(user);
        stocks.push(stock);
        let sellBuyRatio = sellNum / buyNum;
        let buySellRatio = buyNum / sellNum;

        // pure ratios
        sellBuyRatios.push(sellBuyRatio);
        buySellRatios.push(buySellRatio);

        // for chart
        if (user === usernameHighlight) {
            sellBuyRatiosData.push({y: sellBuyRatio, color: '#BF0B23'});
            buySellRatiosData.push({y: buySellRatio, color: '#BF0B23'});
        }
        else {
            sellBuyRatiosData.push(sellBuyRatio);
            buySellRatiosData.push(buySellRatio);
        }

        i++;
    }

    return {
        sellCurrency: want,
        buyCurrency: have,
        sellBuyRatios: sellBuyRatios,
        buySellRatios: buySellRatios,
        sellBuyRatiosData: sellBuyRatiosData,
        buySellRatiosData: buySellRatiosData,
        sells: sells,
        buys: buys,
        users: users,
        stocks: stocks
    }
}

async function makeGraph(container, currency1, currency2) {
    let currency12 = await fetchData(currency1, currency2);
    let currency21 = await fetchData(currency2, currency1);
    let currency12Id = 0;
    let currency21Id = 1;
    let allData = {};
    allData[currency12Id] = currency12;
    allData[currency21Id] = currency21;

    Highcharts.chart(container, {
        title: {
            text: currency1.name + ' - ' + currency2.name
        },
        yAxis: {
            title: {
                text: 'Ratio'
            }
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle'
        },
        plotOptions: {
            series: {
                label: {
                    connectorAllowed: false
                },
            },
            line: {
                animation: false
            }
        },
        series: [{
            name: 'Sell ' + currency1.name + ': 1 ' + currency2.name + ' : x ' + currency1.name,
            data: currency12.sellBuyRatiosData
        }, {
            name: 'Sell ' + currency2.name + ': 1 ' + currency2.name + ' : x ' + currency1.name,
            data: currency21.buySellRatiosData
        }

        ],
        tooltip: {
            formatter: function() {
                let weakerAmounts;
                let strongerAmounts;
                let weakerCurrency;
                let strongerCurrency;
                let data = allData[this.series.index];

                if (data.sellBuyRatios[this.x] < 1) {
                    strongerCurrency = data.sellCurrency;
                    weakerCurrency = data.buyCurrency;
                    strongerAmounts = data.sells;
                    weakerAmounts = data.buys;
                }
                else {
                    strongerCurrency = data.buyCurrency;
                    weakerCurrency = data.sellCurrency;
                    strongerAmounts = data.buys;
                    weakerAmounts = data.sells;
                }

                let s;
                if (this.y > 1) {
                    s = '1 ' + strongerCurrency.name + ' : <b>' + this.y + '</b> ' + weakerCurrency.name +
                        ' (' + strongerAmounts[this.x] + ':' + weakerAmounts[this.x];
                }
                else {
                    s = '<b>' + this.y + '</b> ' + strongerCurrency.name + ' : 1 ' + weakerCurrency.name +
                        ' (' + strongerAmounts[this.x] + ':' + weakerAmounts[this.x];
                }
                s += '), user: ' + data.users[this.x];
                if (data.stocks[this.x]) {
                    s += ', stock: ' + data.stocks[this.x];
                }
                return s;
            }
        },
        responsive: {
            rules: [{
                condition: {
                    maxWidth: 500
                },
                chartOptions: {
                    legend: {
                        layout: 'horizontal',
                        align: 'center',
                        verticalAlign: 'bottom'
                    }
                }
            }]
        }
    });
}
