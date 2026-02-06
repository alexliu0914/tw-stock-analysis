// 股票分析核心邏輯

// ==================== 後端 API 配置 ====================
const USE_BACKEND_API = true; // 設為 true 使用後端 API，false 使用 CORS 代理
const BACKEND_API_URL = 'https://tw-stock-api.vercel.app'; // 您的後端 API 網址
// ======================================================


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
 * 延遲函數（用於重試機制）
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 重試機制包裝函數
 * @param {Function} fn - 要執行的異步函數
 * @param {number} maxRetries - 最大重試次數（預設 5 次）
 * @param {number} delayMs - 重試間隔時間（預設 5000 毫秒）
 * @param {string} stockCode - 股票代號（用於日誌）
 */
async function retryWithDelay(fn, maxRetries = 5, delayMs = 5000, stockCode = '') {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[${stockCode}] 嘗試第 ${attempt}/${maxRetries} 次...`);
            const result = await fn();
            console.log(`[${stockCode}] ✅ 成功獲取數據`);
            return result;
        } catch (error) {
            lastError = error;
            console.warn(`[${stockCode}] ❌ 第 ${attempt} 次嘗試失敗:`, error.message);

            // 如果還有重試機會，等待後重試
            if (attempt < maxRetries) {
                console.log(`[${stockCode}] ⏳ 等待 ${delayMs / 1000} 秒後重試...`);
                await delay(delayMs);
            }
        }
    }

    // 所有重試都失敗
    console.error(`[${stockCode}] ❌ 已嘗試 ${maxRetries} 次，全部失敗`);
    throw lastError;
}

/**
 * 本地快取管理員 (Local Caching)
 */
const CacheManager = {
    PREFIX: 'tw_stock_cache_',
    save(stockCode, data) {
        try {
            localStorage.setItem(this.PREFIX + stockCode, JSON.stringify({ timestamp: Date.now(), data: data }));
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                this.clearAll();
                try { localStorage.setItem(this.PREFIX + stockCode, JSON.stringify({ timestamp: Date.now(), data: data })); } catch (e2) { }
            }
        }
    },
    get(stockCode) {
        const item = localStorage.getItem(this.PREFIX + stockCode);
        if (!item) return null;
        try {
            const entry = JSON.parse(item);
            if (this.isValid(entry.timestamp)) return entry.data;
            localStorage.removeItem(this.PREFIX + stockCode);
        } catch (e) { return null; }
        return null;
    },
    isValid(timestamp) {
        const now = new Date();
        const cached = new Date(timestamp);
        const today0900 = new Date(now); today0900.setHours(9, 0, 0, 0);
        const today1400 = new Date(now); today1400.setHours(14, 0, 0, 0);
        if (now >= today0900) {
            if (cached < today0900) return false;
            if (now < today1400) return (now - cached) < 60 * 60 * 1000;
            return cached >= today1400;
        } else {
            const yesterday1400 = new Date(today1400); yesterday1400.setDate(yesterday1400.getDate() - 1);
            return cached >= yesterday1400;
        }
    },
    clearAll() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.PREFIX)) keys.push(key);
        }
        keys.forEach(key => localStorage.removeItem(key));
    }
};

/**
 * 獲取股票歷史數據的核心邏輯（內部函數，不直接調用）
 */
async function fetchStockDataCore(stockCode) {
    // 如果啟用後端 API，優先使用後端
    if (USE_BACKEND_API) {
        try {
            console.log(`[${stockCode}] 🚀 使用後端 API...`);
            const url = `${BACKEND_API_URL}/api/stock/${stockCode}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`後端 API HTTP ${response.status}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || '後端 API 返回錯誤');
            }

            const data = result.data;
            const chartResult = data.chart.result[0];
            const quote = chartResult.indicators.quote[0];
            const meta = chartResult.meta || {};

            console.log(`[${stockCode}] ✅ 後端 API 成功${result.cached ? '（快取）' : ''}`);

            return {
                timestamps: chartResult.timestamp,
                opens: quote.open,
                highs: quote.high,
                lows: quote.low,
                closes: quote.close,
                volumes: quote.volume,
                companyName: meta.longName || meta.shortName || null
            };
        } catch (error) {
            console.warn(`[${stockCode}] ⚠️ 後端 API 失敗，切換到 CORS 代理:`, error.message);
            // 繼續使用 CORS 代理作為備用方案
        }
    }

    // 備用方案：使用 CORS 代理
    console.log(`[${stockCode}] 🔄 使用 CORS 代理...`);

    // CORS 代理列表（按優先順序）
    const corsProxies = [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?',
        'https://cors-anywhere.herokuapp.com/',
        '' // 最後嘗試直接訪問
    ];

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
    const meta = result.meta || {};

    return {
        timestamps: result.timestamp,
        opens: quote.open,
        highs: quote.high,
        lows: quote.low,
        closes: quote.close,
        volumes: quote.volume,
        // 從 API 提取公司名稱（如果有的話）
        companyName: meta.longName || meta.shortName || null
    };
}

/**
 * 獲取股票歷史數據 (優先使用快取)
 */
async function fetchStockData(stockCode) {
    const cachedData = CacheManager.get(stockCode);
    if (cachedData) {
        console.log(`[${stockCode}] ⚡ 使用本地快取數據`);
        return cachedData;
    }
    try {
        const data = await retryWithDelay(() => fetchStockDataCore(stockCode), 5, 5000, stockCode);
        CacheManager.save(stockCode, data);
        return data;
    } catch (error) {
        console.error(`[${stockCode}] 最終失敗:`, error);
        throw new Error(`無法連接到股票數據服務，請稍後再試 (${error.message})`);
    }
}

/**
 * 清理股票名稱
 */
function cleanStockName(name, code) {
    if (!name) return null;
    let clean = name.replace(/\s*\(.*\)/, '').replace(/\.TW.*/, '').replace(/\.TWO.*/, '').trim();
    if (clean === code) return null;
    return clean;
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

        // 名稱獲取策略：中文優先
        // 1. 先查中文對照表 (本地字典 + 動態同步)
        let stockName = getStockName(stockCode);

        // 2. 如果查不到中文 (返回 '-')，才使用 API 回傳的名稱
        if (stockName === '-') {
            const cleanedApiName = cleanStockName(stockData.companyName, stockCode);
            if (cleanedApiName) {
                stockName = cleanedApiName;
            }
        }

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

        // ==================== AI 評分系統（單一股票） ====================
        const aiScore = calculateAIScore(analysis, strategy);

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

        // ==================== AI 回測系統（新增） ====================
        const backtestResult = runBacktest(
            closes, highs, lows,
            { ma5, ma13, ma21, ma34, ma55, ma144 },
            kd
        );

        return {
            ...analysis,
            ...strategy,
            ...aiScore,  // 加入 AI 評分
            backtestResult, // 加入回測結果
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
 * 計算 AI 評分（用於單一股票分析）
 */
function calculateAIScore(analysis, strategy) {
    let score = 0;
    const reasons = [];
    const maxScore = 20;

    // === 1. KD 指標評分 (最高 5 分) ===
    if (analysis.kd.k < 20) {
        score += 3;
        reasons.push(`🔵 KD超賣區(K=${analysis.kd.k.toFixed(1)})`);
    } else if (analysis.kd.k < 30) {
        score += 2;
        reasons.push(`🔵 KD偏低(K=${analysis.kd.k.toFixed(1)})`);
    }

    // KD 黃金交叉
    if (strategy.kdTrend.includes("黃金交叉")) {
        score += 2;
        reasons.push("⭐ KD黃金交叉");
    }

    // === 2. 均線排列評分 (最高 5 分) ===
    let maScore = 0;
    if (analysis.ma.ma5 > analysis.ma.ma13) maScore++;
    if (analysis.ma.ma13 > analysis.ma.ma21) maScore++;
    if (analysis.ma.ma21 > analysis.ma.ma34) maScore++;
    if (analysis.ma.ma34 > analysis.ma.ma55) maScore++;
    if (analysis.price > analysis.ma.ma144) maScore++;

    score += maScore;
    if (maScore >= 4) {
        reasons.push(`🟢 均線多頭排列(${maScore}/5)`);
    } else if (maScore >= 2) {
        reasons.push(`🟡 均線部分多頭(${maScore}/5)`);
    } else if (maScore === 0) {
        reasons.push(`🔴 均線空頭排列`);
    }

    // === 3. 價格位置評分 (最高 3 分) ===
    let priceScore = 0;
    if (analysis.price > analysis.ma.ma5) {
        priceScore++;
        reasons.push("📈 價在MA5上");
    }
    if (analysis.price > analysis.ma.ma13) priceScore++;
    if (analysis.price > analysis.ma.ma21) priceScore++;
    score += priceScore;

    // === 4. 趨勢強度評分 (最高 4 分) ===
    if (strategy.bias.includes("主升段")) {
        score += 4;
        reasons.push("🚀 主升段強勢");
    } else if (strategy.bias.includes("短多")) {
        score += 3;
        reasons.push("📊 短多啟動");
    } else if (strategy.bias.includes("多頭回檔")) {
        score += 2;
        reasons.push("🔄 多頭回檔");
    } else if (strategy.isBullMarket) {
        score += 1;
        reasons.push("✅ 多頭市場");
    } else {
        reasons.push("⚠️ 空頭市場");
    }

    // === 5. 進場機會評分 (最高 3 分) ===
    if (strategy.entryPrice > 0) {
        score += 1;
        reasons.push("💰 有進場價位");

        // 計算潛在報酬
        if (strategy.exitPrice > strategy.entryPrice) {
            const potentialReturn = ((strategy.exitPrice - strategy.entryPrice) / strategy.entryPrice * 100).toFixed(1);
            if (potentialReturn > 15) {
                score += 2;
                reasons.push(`💎 高報酬空間(${potentialReturn}%)`);
            } else if (potentialReturn > 8) {
                score += 1;
                reasons.push(`💵 中等報酬(${potentialReturn}%)`);
            } else if (potentialReturn > 0) {
                reasons.push(`💰 報酬空間(${potentialReturn}%)`);
            }
        }
    }

    // === 計算信心度和星級 ===
    const confidence = Math.min(100, (score / maxScore * 100)).toFixed(0);
    let stars = '';
    let rating = '';
    if (score >= 15) {
        stars = '⭐⭐⭐⭐⭐';
        rating = '強烈推薦';
    } else if (score >= 12) {
        stars = '⭐⭐⭐⭐';
        rating = '推薦';
    } else if (score >= 9) {
        stars = '⭐⭐⭐';
        rating = '可考慮';
    } else if (score >= 6) {
        stars = '⭐⭐';
        rating = '觀察';
    } else if (score >= 3) {
        stars = '⭐';
        rating = '謹慎';
    } else {
        stars = '';
        rating = '不建議';
    }

    // === 風險評估 ===
    let riskLevel = '中等';
    if (!strategy.isBullMarket) {
        riskLevel = '高';
    } else if (analysis.kd.k > 80) {
        riskLevel = '中高';
    } else if (score >= 12) {
        riskLevel = '中低';
    }

    return {
        aiScore: score,
        aiMaxScore: maxScore,
        aiConfidence: confidence,
        aiStars: stars,
        aiRating: rating,
        aiRiskLevel: riskLevel,
        aiReasons: reasons,
        indicators: {
            k: analysis.kd.k, d: analysis.kd.d,
            maScore: maScore, isBull: strategy.isBullMarket
        }
    };
}

/**
 * AI 歷史勝率回測
 */
function runBacktest(closes, highs, lows, maData, kdData) {
    const signals = [];
    const testPeriod = 120;
    const signalThreshold = 12;
    for (let i = Math.max(1, closes.length - testPeriod); i < closes.length - 10; i++) {
        const mockAnalysis = {
            price: closes[i],
            ma: {
                ma5: maData.ma5[i], ma13: maData.ma13[i], ma21: maData.ma21[i],
                ma34: maData.ma34[i], ma55: maData.ma55[i], ma144: maData.ma144[i]
            },
            kd: { k: kdData.k[i], d: kdData.d[i] },
            prevKD: { k: kdData.k[i - 1], d: kdData.d[i - 1] }
        };
        const mockStrategy = analyzeStrategy(mockAnalysis, highs.slice(0, i + 1), closes.slice(0, i + 1));
        const aiResult = calculateAIScore(mockAnalysis, mockStrategy);
        if (aiResult.aiScore >= signalThreshold) {
            signals.push({ index: i, entryPrice: closes[i], price5: closes[i + 5], price10: closes[i + 10] });
        }
    }
    if (signals.length === 0) return null;
    const win5 = signals.filter(s => s.price5 > s.entryPrice).length;
    const win10 = signals.filter(s => s.price10 > s.entryPrice).length;
    const avgProfit = signals.reduce((acc, s) => acc + ((s.price10 - s.entryPrice) / s.entryPrice), 0) / signals.length;
    return {
        signalCount: signals.length,
        winRate5: (win5 / signals.length * 100).toFixed(1),
        winRate10: (win10 / signals.length * 100).toFixed(1),
        avgProfit10: (avgProfit * 100).toFixed(1)
    };
}

/**
 * 批量分析股票 (用於板塊分析)
 * 添加請求間延遲以避免 API 限流
 */
async function analyzeSector(stockCodes, onProgress) {
    const results = [];
    const total = stockCodes.length;
    const DELAY_BETWEEN_REQUESTS = 1000; // 每個請求間隔 1 秒

    for (let i = 0; i < stockCodes.length; i++) {
        try {
            const result = await analyzeStock(stockCodes[i]);
            results.push(result);

            if (onProgress) {
                onProgress(i + 1, total);
            }

            // 在請求之間添加延遲（除了最後一個）
            if (i < stockCodes.length - 1) {
                await delay(DELAY_BETWEEN_REQUESTS);
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
 * 添加請求間延遲以避免 API 限流
 */
async function scanUndervaluedStocks(onProgress) {
    const allStocks = Object.keys(STOCK_NAMES);
    const results = [];
    const total = allStocks.length;

    for (let i = 0; i < allStocks.length; i++) {
        try {
            const stockCode = allStocks[i];
            const analysis = await analyzeStock(stockCode);

            // ==================== 增強版 AI 評分系統 ====================
            let score = 0;
            const reasons = [];
            const maxScore = 20; // 總分 20 分

            // === 1. KD 指標評分 (最高 5 分) ===
            if (analysis.kd.k < 20) {
                score += 3;
                reasons.push(`🔵 KD超賣區(K=${analysis.kd.k.toFixed(1)})`);
            } else if (analysis.kd.k < 30) {
                score += 2;
                reasons.push(`🔵 KD偏低(K=${analysis.kd.k.toFixed(1)})`);
            }

            // KD 黃金交叉
            if (analysis.kdTrend.includes("黃金交叉")) {
                score += 2;
                reasons.push("⭐ KD黃金交叉");
            }

            // === 2. 均線排列評分 (最高 5 分) ===
            let maScore = 0;
            if (analysis.ma.ma5 > analysis.ma.ma13) maScore++;
            if (analysis.ma.ma13 > analysis.ma.ma21) maScore++;
            if (analysis.ma.ma21 > analysis.ma.ma34) maScore++;
            if (analysis.ma.ma34 > analysis.ma.ma55) maScore++;
            if (analysis.price > analysis.ma.ma144) maScore++;

            score += maScore;
            if (maScore >= 4) {
                reasons.push(`🟢 均線多頭排列(${maScore}/5)`);
            } else if (maScore >= 2) {
                reasons.push(`🟡 均線部分多頭(${maScore}/5)`);
            }

            // === 3. 價格位置評分 (最高 3 分) ===
            if (analysis.price > analysis.ma.ma5) {
                score += 1;
                reasons.push("📈 價在MA5上");
            }
            if (analysis.price > analysis.ma.ma13) {
                score += 1;
            }
            if (analysis.price > analysis.ma.ma21) {
                score += 1;
            }

            // === 4. 趨勢強度評分 (最高 4 分) ===
            if (analysis.bias.includes("主升段")) {
                score += 4;
                reasons.push("🚀 主升段強勢");
            } else if (analysis.bias.includes("短多")) {
                score += 3;
                reasons.push("📊 短多啟動");
            } else if (analysis.bias.includes("多頭回檔")) {
                score += 2;
                reasons.push("🔄 多頭回檔");
            } else if (analysis.isBullMarket) {
                score += 1;
                reasons.push("✅ 多頭市場");
            }

            // === 5. 進場機會評分 (最高 3 分) ===
            if (analysis.entryPrice > 0) {
                score += 1;
                reasons.push("💰 有進場價位");

                // 計算潛在報酬
                if (analysis.exitPrice > analysis.entryPrice) {
                    const potentialReturn = ((analysis.exitPrice - analysis.entryPrice) / analysis.entryPrice * 100).toFixed(1);
                    if (potentialReturn > 15) {
                        score += 2;
                        reasons.push(`💎 高報酬空間(${potentialReturn}%)`);
                    } else if (potentialReturn > 8) {
                        score += 1;
                        reasons.push(`💵 中等報酬(${potentialReturn}%)`);
                    }
                }
            }

            // === 計算信心度和星級 ===
            const confidence = Math.min(100, (score / maxScore * 100)).toFixed(0);
            let stars = '';
            if (score >= 15) stars = '⭐⭐⭐⭐⭐';
            else if (score >= 12) stars = '⭐⭐⭐⭐';
            else if (score >= 9) stars = '⭐⭐⭐';
            else if (score >= 6) stars = '⭐⭐';
            else if (score >= 3) stars = '⭐';

            // === 風險評估 ===
            let riskLevel = '中等';
            if (!analysis.isBullMarket) {
                riskLevel = '高';
            } else if (analysis.kd.k > 80) {
                riskLevel = '中高';
            } else if (score >= 12) {
                riskLevel = '中低';
            }

            // 只保留評分 >= 6 的股票 (提高門檻，篩選更優質標的)
            if (score >= 6) {
                results.push({
                    ...analysis,
                    score,
                    maxScore,
                    confidence,
                    stars,
                    riskLevel,
                    reasons
                });
            }

            if (onProgress) {
                onProgress(i + 1, total);
            }

            // 在請求之間添加延遲（除了最後一個）
            if (i < allStocks.length - 1) {
                await delay(1000); // 每個請求間隔 1 秒
            }
        } catch (error) {
            console.error(`掃描 ${allStocks[i]} 失敗:`, error);
        }
    }

    // 按評分排序
    results.sort((a, b) => b.score - a.score);

    return results;
}
