// 股票分析核心邏輯

/**
 * 計算簡單移動平均線 (SMA)
 */
function calculateSMA(data, period) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            result.push(null);
        } else {
            const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            result.push(sum / period);
        }
    }
    return result;
}

/**
 * 計算 KD 指標 (9, 3, 3)
 */
function calculateKD(highs, lows, closes, period = 9) {
    const rsv = [];
    const k = [50]; // 初始值
    const d = [50]; // 初始值

    for (let i = 0; i < closes.length; i++) {
        if (i < period - 1) {
            rsv.push(50);
        } else {
            const periodHigh = Math.max(...highs.slice(i - period + 1, i + 1));
            const periodLow = Math.min(...lows.slice(i - period + 1, i + 1));
            const rsvValue = periodHigh === periodLow ? 50 :
                100 * (closes[i] - periodLow) / (periodHigh - periodLow);
            rsv.push(rsvValue);
        }

        if (i > 0) {
            const kValue = (2 / 3) * k[k.length - 1] + (1 / 3) * rsv[i];
            const dValue = (2 / 3) * d[d.length - 1] + (1 / 3) * kValue;
            k.push(kValue);
            d.push(dValue);
        }
    }

    return { k, d, rsv };
}

/**
 * 獲取股票歷史數據 (使用 Yahoo Finance API + CORS 代理)
 */
async function fetchStockData(stockCode) {
    // CORS 代理列表（按優先順序）
    const corsProxies = [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?',
        'https://cors-anywhere.herokuapp.com/',
        '' // 最後嘗試直接訪問
    ];

    try {
        // 嘗試 .TW (上市)
        let ticker = `${stockCode}.TW`;
        let baseUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1y`;

        let data = null;
        let lastError = null;

        // 嘗試所有代理
        for (const proxy of corsProxies) {
            try {
                const url = proxy ? `${proxy}${encodeURIComponent(baseUrl)}` : baseUrl;
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const text = await response.text();
                data = JSON.parse(text);

                // 檢查數據有效性
                if (data.chart && data.chart.result && data.chart.result[0] &&
                    data.chart.result[0].indicators.quote[0].close.length > 0) {
                    break; // 成功獲取數據
                }
            } catch (error) {
                lastError = error;
                console.warn(`代理 ${proxy || '直接訪問'} 失敗:`, error.message);
                continue; // 嘗試下一個代理
            }
        }

        // 如果 .TW 沒有數據，嘗試 .TWO (上櫃)
        if (!data || !data.chart.result || data.chart.result[0].indicators.quote[0].close.length === 0) {
            ticker = `${stockCode}.TWO`;
            baseUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1y`;

            for (const proxy of corsProxies) {
                try {
                    const url = proxy ? `${proxy}${encodeURIComponent(baseUrl)}` : baseUrl;
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const text = await response.text();
                    data = JSON.parse(text);

                    if (data.chart && data.chart.result && data.chart.result[0] &&
                        data.chart.result[0].indicators.quote[0].close.length > 0) {
                        break;
                    }
                } catch (error) {
                    lastError = error;
                    console.warn(`代理 ${proxy || '直接訪問'} 失敗:`, error.message);
                    continue;
                }
            }
        }

        if (!data || !data.chart.result || data.chart.result[0].indicators.quote[0].close.length === 0) {
            throw new Error('找不到股票數據，請檢查股票代號是否正確');
        }

        const result = data.chart.result[0];
        const quote = result.indicators.quote[0];

        return {
            timestamps: result.timestamp,
            opens: quote.open,
            highs: quote.high,
            lows: quote.low,
            closes: quote.close,
            volumes: quote.volume
        };
    } catch (error) {
        console.error('獲取股票數據失敗:', error);
        throw new Error(`Failed to fetch: 無法連接到股票數據服務，請稍後再試`);
    }
}

/**
 * 分析單一股票
 */
async function analyzeStock(stockCode) {
    try {
        // 獲取歷史數據
        const stockData = await fetchStockData(stockCode);

        if (!stockData.closes || stockData.closes.length < 144) {
            throw new Error('數據不足，無法計算指標');
        }

        // 過濾掉 null 值
        const validData = stockData.closes
            .map((close, i) => ({
                close,
                open: stockData.opens[i],
                high: stockData.highs[i],
                low: stockData.lows[i],
                volume: stockData.volumes[i],
                timestamp: stockData.timestamps[i]
            }))
            .filter(d => d.close !== null && d.high !== null && d.low !== null);

        const closes = validData.map(d => d.close);
        const highs = validData.map(d => d.high);
        const lows = validData.map(d => d.low);

        // 計算費波那契均線
        const ma5 = calculateSMA(closes, 5);
        const ma13 = calculateSMA(closes, 13);
        const ma21 = calculateSMA(closes, 21);
        const ma34 = calculateSMA(closes, 34);
        const ma55 = calculateSMA(closes, 55);
        const ma144 = calculateSMA(closes, 144);

        // 計算 KD
        const kd = calculateKD(highs, lows, closes);

        // 獲取最新數據
        const latest = validData[validData.length - 1];
        const prev = validData[validData.length - 2];
        const latestIndex = validData.length - 1;

        const currentPrice = latest.close;
        const stockName = getStockName(stockCode);

        // 分析結果
        const analysis = {
            code: stockCode,
            name: stockName,
            date: new Date(latest.timestamp * 1000).toLocaleDateString('zh-TW'),
            price: currentPrice,
            open: latest.open,
            high: latest.high,
            low: latest.low,
            close: latest.close,
            volume: latest.volume,
            ma: {
                ma5: ma5[latestIndex],
                ma13: ma13[latestIndex],
                ma21: ma21[latestIndex],
                ma34: ma34[latestIndex],
                ma55: ma55[latestIndex],
                ma144: ma144[latestIndex]
            },
            kd: {
                k: kd.k[latestIndex],
                d: kd.d[latestIndex]
            },
            prevKD: {
                k: kd.k[latestIndex - 1],
                d: kd.d[latestIndex - 1]
            }
        };

        // 策略分析
        const strategy = analyzeStrategy(analysis, highs, closes);

        // 準備圖表數據 (最近30天)
        const chartDays = Math.min(30, validData.length);
        const chartStartIndex = validData.length - chartDays;

        const chartData = {
            dates: validData.slice(chartStartIndex).map(d => {
                const date = new Date(d.timestamp * 1000);
                return `${date.getMonth() + 1}/${date.getDate()}`;
            }),
            prices: closes.slice(chartStartIndex),
            ma5Array: ma5.slice(chartStartIndex),
            ma13Array: ma13.slice(chartStartIndex),
            ma21Array: ma21.slice(chartStartIndex),
            ma34Array: ma34.slice(chartStartIndex),
            ma55Array: ma55.slice(chartStartIndex),
            ma144Array: ma144.slice(chartStartIndex),
            kValues: kd.k.slice(chartStartIndex),
            dValues: kd.d.slice(chartStartIndex)
        };

        return {
            ...analysis,
            ...strategy,
            chartData
        };

    } catch (error) {
        console.error(`分析股票 ${stockCode} 失敗:`, error);
        throw error;
    }
}

/**
 * 策略分析 (費波那契均線邏輯)
 */
function analyzeStrategy(analysis, highs, closes) {
    const { price, ma, kd, prevKD } = analysis;

    let bias = "震盪整理";
    let suggestion = "觀望，等待節奏";
    let entryPrice = 0;
    let exitPrice = 0;
    let priceType = "支撐";
    let kdTrend = "";

    // KD 趨勢判斷
    if (kd.k > kd.d && prevKD.k <= prevKD.d) {
        kdTrend = "黃金交叉 (看漲)";
    } else if (kd.k < kd.d && prevKD.k >= prevKD.d) {
        kdTrend = "死亡交叉 (看跌)";
    } else if (kd.k > 80) {
        kdTrend = "超買區 (可能回檔)";
    } else if (kd.k < 20) {
        kdTrend = "超賣區 (可能反彈)";
    } else {
        kdTrend = "中性整理";
    }

    // 多空生死判斷 (144MA)
    const isBullMarket = price > ma.ma144;

    // 計算近期高點 (60日)
    const recentHigh = Math.max(...highs.slice(-60));

    if (isBullMarket) {
        // 多頭市場邏輯
        const ma34Up = ma.ma34 > ma.ma34; // 簡化判斷

        if (price > ma.ma55) {
            bias = "主升段 (強多)";
            suggestion = "主升段預備鐘聲響！抱緊處理 🍯";
            entryPrice = ma.ma34;
            priceType = "支撐(買)";
            exitPrice = Math.max(recentHigh, price * 1.1);
        } else if (price > ma.ma13 && price > ma.ma21) {
            bias = "短多啟動";
            suggestion = "短多活蹦亂跳，拉回偏買";
            entryPrice = ma.ma13;
            priceType = "支撐(買)";
            exitPrice = recentHigh;
        } else {
            bias = "多頭回檔";
            suggestion = "守 34 保波段，守 55 保趨勢";
            entryPrice = ma.ma55;
            priceType = "防守(買)";
            exitPrice = ma.ma21;
        }
    } else {
        // 空頭市場邏輯
        bias = "空頭 (小心)";
        suggestion = "故事變了，反彈偏賣，保守操作";
        entryPrice = 0;
        priceType = "觀望";
        exitPrice = ma.ma144;

        if (price > ma.ma5) {
            suggestion = "空頭反彈，搶短手腳要快";
            entryPrice = ma.ma5;
            priceType = "短撐(險)";
            exitPrice = ma.ma34;
        }
    }

    // 檢查出場目標是否合理
    if (entryPrice > 0 && exitPrice > 0 && exitPrice <= entryPrice) {
        if (!isBullMarket) {
            suggestion = "空頭排列嚴重，上方壓力重重，不建議進場";
            entryPrice = 0;
            priceType = "觀望";
        } else {
            exitPrice = Math.max(exitPrice, recentHigh);
            if (exitPrice <= entryPrice) {
                suggestion = "空間不足，建議觀望";
                entryPrice = 0;
                priceType = "觀望";
            }
        }
    }

    return {
        bias,
        suggestion,
        entryPrice,
        exitPrice,
        priceType,
        kdTrend,
        isBullMarket
    };
}

/**
 * 批量分析股票 (用於板塊分析)
 */
async function analyzeSector(stockCodes, onProgress) {
    const results = [];
    const total = stockCodes.length;

    for (let i = 0; i < stockCodes.length; i++) {
        try {
            const result = await analyzeStock(stockCodes[i]);
            results.push(result);

            if (onProgress) {
                onProgress(i + 1, total);
            }
        } catch (error) {
            console.error(`分析 ${stockCodes[i]} 失敗:`, error);
            // 繼續分析下一支
        }
    }

    return results;
}

/**
 * 掃描潛力股
 */
async function scanUndervaluedStocks(onProgress) {
    const allStocks = Object.keys(STOCK_NAMES);
    const results = [];
    const total = allStocks.length;

    for (let i = 0; i < allStocks.length; i++) {
        try {
            const stockCode = allStocks[i];
            const analysis = await analyzeStock(stockCode);

            // 評分系統
            let score = 0;
            const reasons = [];

            // 1. KD超賣
            if (analysis.kd.k < 20) {
                score += 3;
                reasons.push(`KD超賣(K=${analysis.kd.k.toFixed(1)})`);
            }

            // 2. 跌破均線
            if (analysis.price < analysis.ma.ma5) {
                score += 2;
                reasons.push("價跌破MA5");
            }
            if (analysis.price < analysis.ma.ma13) {
                score += 2;
                reasons.push("價跌破MA13");
            }
            if (analysis.price < analysis.ma.ma21) {
                score += 1;
                reasons.push("價跌破MA21");
            }

            // 3. 建議買點
            if (analysis.suggestion.includes("拉回買")) {
                score += 2;
                reasons.push("技術面拉回買");
            } else if (analysis.suggestion.includes("守34")) {
                score += 1;
                reasons.push("技術面守34");
            }

            // 4. 有進場價
            if (analysis.entryPrice > 0) {
                score += 1;
                reasons.push("系統給予進場價");
            }

            // 只保留評分 >= 3 的股票
            if (score >= 3) {
                results.push({
                    ...analysis,
                    score,
                    reasons
                });
            }

            if (onProgress) {
                onProgress(i + 1, total);
            }
        } catch (error) {
            console.error(`掃描 ${allStocks[i]} 失敗:`, error);
        }
    }

    // 按評分排序
    results.sort((a, b) => b.score - a.score);

    return results;
}
