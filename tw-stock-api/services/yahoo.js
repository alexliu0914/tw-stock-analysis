const axios = require('axios');

/**
 * 延遲函數
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 獲取單一股票數據
 */
async function fetchStock(code, maxRetries = 3) {
    let lastError;

    // 嘗試 .TW (上市)
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const ticker = `${code}.TW`;
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1y`;

            console.log(`  [${code}] 嘗試 ${attempt}/${maxRetries} (.TW)...`);

            const response = await axios.get(url, {
                timeout: 10000, // 10 秒超時
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const data = response.data;

            // 檢查數據有效性
            if (data.chart && data.chart.result && data.chart.result[0] &&
                data.chart.result[0].indicators.quote[0].close.length > 0) {
                console.log(`  [${code}] ✅ 成功 (.TW)`);
                return data;
            }

        } catch (error) {
            lastError = error;
            console.log(`  [${code}] ❌ 失敗 (.TW): ${error.message}`);

            if (attempt < maxRetries) {
                await delay(1000); // 等待 1 秒後重試
            }
        }
    }

    // 嘗試 .TWO (上櫃)
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const ticker = `${code}.TWO`;
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1y`;

            console.log(`  [${code}] 嘗試 ${attempt}/${maxRetries} (.TWO)...`);

            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const data = response.data;

            if (data.chart && data.chart.result && data.chart.result[0] &&
                data.chart.result[0].indicators.quote[0].close.length > 0) {
                console.log(`  [${code}] ✅ 成功 (.TWO)`);
                return data;
            }

        } catch (error) {
            lastError = error;
            console.log(`  [${code}] ❌ 失敗 (.TWO): ${error.message}`);

            if (attempt < maxRetries) {
                await delay(1000);
            }
        }
    }

    throw new Error(`找不到股票 ${code} 的數據`);
}

/**
 * 批量獲取股票數據
 */
async function fetchBatch(codes) {
    const results = [];
    const DELAY_BETWEEN_REQUESTS = 500; // 每個請求間隔 0.5 秒

    for (let i = 0; i < codes.length; i++) {
        try {
            const data = await fetchStock(codes[i]);
            results.push({
                code: codes[i],
                success: true,
                data: data
            });
        } catch (error) {
            console.error(`批量獲取 ${codes[i]} 失敗:`, error.message);
            results.push({
                code: codes[i],
                success: false,
                error: error.message
            });
        }

        // 在請求之間添加延遲（除了最後一個）
        if (i < codes.length - 1) {
            await delay(DELAY_BETWEEN_REQUESTS);
        }
    }

    return results;
}

module.exports = {
    fetchStock,
    fetchBatch
};
