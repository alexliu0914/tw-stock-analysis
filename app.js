// 主應用程式邏輯

// DOM 元素
const stockInput = document.getElementById('stockInput');
const searchBtn = document.getElementById('searchBtn');
const sectorBtn = document.getElementById('sectorBtn');
const scanBtn = document.getElementById('scanBtn');
const sectorModal = document.getElementById('sectorModal');
const closeSectorModal = document.getElementById('closeSectorModal');
const sectorGrid = document.getElementById('sectorGrid');
const loadingIndicator = document.getElementById('loadingIndicator');
const resultsSection = document.getElementById('resultsSection');
const singleStockResult = document.getElementById('singleStockResult');
const multiStockResult = document.getElementById('multiStockResult');
const errorMessage = document.getElementById('errorMessage');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeSectorGrid();
    setupEventListeners();
});

/**
 * 初始化板塊選擇網格
 */
function initializeSectorGrid() {
    const sectors = getSectorList();
    sectorGrid.innerHTML = '';

    sectors.forEach(sector => {
        const btn = document.createElement('button');
        btn.className = 'sector-btn';
        btn.textContent = sector.name;
        btn.onclick = () => handleSectorSelect(sector.id);
        sectorGrid.appendChild(btn);
    });
}

/**
 * 設置事件監聽器
 */
function setupEventListeners() {
    // 搜尋按鈕
    searchBtn.addEventListener('click', handleSearch);

    // Enter 鍵搜尋
    stockInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // 板塊按鈕
    sectorBtn.addEventListener('click', () => {
        sectorModal.classList.add('active');
    });

    // 關閉板塊選擇
    closeSectorModal.addEventListener('click', () => {
        sectorModal.classList.remove('active');
    });

    // 點擊背景關閉
    sectorModal.addEventListener('click', (e) => {
        if (e.target === sectorModal) {
            sectorModal.classList.remove('active');
        }
    });

    // 掃描按鈕
    scanBtn.addEventListener('click', handleScan);
}

/**
 * 處理搜尋
 */
async function handleSearch() {
    const stockCode = stockInput.value.trim();

    if (!stockCode) {
        showError('請輸入股票代號');
        return;
    }

    hideError();
    showLoading();
    hideResults();

    try {
        const result = await analyzeStock(stockCode);
        displaySingleStock(result);
    } catch (error) {
        showError(`分析失敗: ${error.message}`);
    } finally {
        hideLoading();
    }
}

/**
 * 處理板塊選擇
 */
async function handleSectorSelect(sectorId) {
    sectorModal.classList.remove('active');

    const stocks = getSectorStocks(sectorId);
    const sectorName = SECTORS[sectorId].name;

    hideError();
    showLoading();
    hideResults();

    try {
        const results = await analyzeSector(stocks, (current, total) => {
            updateLoadingProgress(current, total);
        });

        displayMultipleStocks(results, `${sectorName} 板塊分析`);
    } catch (error) {
        showError(`板塊分析失敗: ${error.message}`);
    } finally {
        hideLoading();
    }
}

/**
 * 處理掃描潛力股
 */
async function handleScan() {
    hideError();
    showLoading();
    hideResults();

    try {
        const results = await scanUndervaluedStocks((current, total) => {
            updateLoadingProgress(current, total);
        });

        // 只顯示前 20 名
        const topResults = results.slice(0, 20);
        displayScanResults(topResults);
    } catch (error) {
        showError(`掃描失敗: ${error.message}`);
    } finally {
        hideLoading();
    }
}

/**
 * 顯示單一股票結果
 */
function displaySingleStock(data) {
    // 設置標題
    document.getElementById('stockTitle').textContent = `${data.code} ${data.name}`;
    document.getElementById('stockPrice').textContent = `NT$ ${data.price.toFixed(2)}`;

    // 設置 OHLC 資訊
    document.getElementById('priceInfo').innerHTML = `
        <div class="price-item">
            <div class="price-label">開盤</div>
            <div class="price-value">${data.open.toFixed(2)}</div>
        </div>
        <div class="price-item">
            <div class="price-label">最高</div>
            <div class="price-value" style="color: var(--success-color)">${data.high.toFixed(2)}</div>
        </div>
        <div class="price-item">
            <div class="price-label">最低</div>
            <div class="price-value" style="color: var(--danger-color)">${data.low.toFixed(2)}</div>
        </div>
        <div class="price-item">
            <div class="price-label">收盤</div>
            <div class="price-value">${data.close.toFixed(2)}</div>
        </div>
    `;

    // 設置均線資訊
    document.getElementById('maGrid').innerHTML = `
        <div class="ma-item">
            <div class="ma-label">MA5 (情緒)</div>
            <div class="ma-value">${data.ma.ma5.toFixed(2)}</div>
        </div>
        <div class="ma-item">
            <div class="ma-label">MA13 (方向)</div>
            <div class="ma-value">${data.ma.ma13.toFixed(2)}</div>
        </div>
        <div class="ma-item">
            <div class="ma-label">MA21 (態度)</div>
            <div class="ma-value">${data.ma.ma21.toFixed(2)}</div>
        </div>
        <div class="ma-item">
            <div class="ma-label">MA34 (趨勢)</div>
            <div class="ma-value">${data.ma.ma34.toFixed(2)}</div>
        </div>
        <div class="ma-item">
            <div class="ma-label">MA55 (生命)</div>
            <div class="ma-value">${data.ma.ma55.toFixed(2)}</div>
        </div>
        <div class="ma-item">
            <div class="ma-label">MA144 (生死)</div>
            <div class="ma-value">${data.ma.ma144.toFixed(2)}</div>
        </div>
    `;

    // 設置 KD 資訊
    const kColor = data.kd.k > data.kd.d ? 'var(--success-color)' : 'var(--danger-color)';
    const dColor = data.kd.d > data.kd.k ? 'var(--success-color)' : 'var(--danger-color)';

    document.getElementById('kdValues').innerHTML = `
        <div class="kd-item">
            <div class="kd-label">K值</div>
            <div class="kd-value" style="color: ${kColor}">${data.kd.k.toFixed(2)}</div>
        </div>
        <div class="kd-item">
            <div class="kd-label">D值</div>
            <div class="kd-value" style="color: ${dColor}">${data.kd.d.toFixed(2)}</div>
        </div>
        <div class="kd-item">
            <div class="kd-label">訊號</div>
            <div class="kd-value" style="font-size: 0.9rem; color: var(--text-secondary)">${data.kdTrend}</div>
        </div>
    `;

    // 設置分析建議
    const trendClass = data.isBullMarket ? 'trend-bullish' : 'trend-bearish';

    document.getElementById('analysisContent').innerHTML = `
        <div class="analysis-item">
            <div class="analysis-label">目前趨勢</div>
            <div class="analysis-value ${trendClass}">${data.bias}</div>
        </div>
        <div class="analysis-item">
            <div class="analysis-label">操作建議</div>
            <div class="analysis-value">${data.suggestion}</div>
        </div>
        <div class="analysis-item">
            <div class="analysis-label">建議進場</div>
            <div class="analysis-value">
                ${data.entryPrice > 0 ? `NT$ ${data.entryPrice.toFixed(2)} (${data.priceType})` : `--- (${data.priceType})`}
            </div>
        </div>
        <div class="analysis-item">
            <div class="analysis-label">建議出場</div>
            <div class="analysis-value">
                ${data.exitPrice > 0 ? `NT$ ${data.exitPrice.toFixed(2)} (壓力/目標)` : '---'}
            </div>
        </div>
    `;

    // 顯示結果
    singleStockResult.style.display = 'block';
    multiStockResult.style.display = 'none';
    resultsSection.style.display = 'block';

    // 渲染圖表
    if (data.chartData) {
        updatePriceChart(data.chartData);
        updateKDChart(data.chartData);
    }
}

/**
 * 顯示多支股票結果
 */
function displayMultipleStocks(results, title) {
    document.getElementById('multiStockTitle').textContent = title;

    const table = document.getElementById('stockTable');
    table.innerHTML = `
        <thead>
            <tr>
                <th>代號</th>
                <th>名稱</th>
                <th>股價</th>
                <th>趨勢</th>
                <th>建議</th>
                <th>進場</th>
                <th>出場</th>
            </tr>
        </thead>
        <tbody>
            ${results.map(stock => `
                <tr>
                    <td>${stock.code}</td>
                    <td>${stock.name}</td>
                    <td>NT$ ${stock.price.toFixed(2)}</td>
                    <td class="${stock.isBullMarket ? 'trend-bullish' : 'trend-bearish'}">
                        ${stock.bias}
                    </td>
                    <td>${simplifysuggestion(stock.suggestion)}</td>
                    <td>${stock.entryPrice > 0 ? stock.entryPrice.toFixed(2) : '---'}</td>
                    <td>${stock.exitPrice > 0 ? stock.exitPrice.toFixed(2) : '---'}</td>
                </tr>
            `).join('')}
        </tbody>
    `;

    singleStockResult.style.display = 'none';
    multiStockResult.style.display = 'block';
    resultsSection.style.display = 'block';
}

/**
 * 顯示掃描結果
 */
function displayScanResults(results) {
    document.getElementById('multiStockTitle').textContent = `🎯 潛力股掃描結果 (前 ${results.length} 名)`;

    const table = document.getElementById('stockTable');
    table.innerHTML = `
        <thead>
            <tr>
                <th>排名</th>
                <th>代號</th>
                <th>名稱</th>
                <th>評分</th>
                <th>目前價</th>
                <th>進場價</th>
                <th>主要原因</th>
            </tr>
        </thead>
        <tbody>
            ${results.map((stock, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${stock.code}</td>
                    <td>${stock.name}</td>
                    <td><strong>${stock.score}</strong></td>
                    <td>NT$ ${stock.price.toFixed(2)}</td>
                    <td>${stock.entryPrice > 0 ? 'NT$ ' + stock.entryPrice.toFixed(2) : '---'}</td>
                    <td>${stock.reasons.slice(0, 2).join('、')}</td>
                </tr>
            `).join('')}
        </tbody>
    `;

    singleStockResult.style.display = 'none';
    multiStockResult.style.display = 'block';
    resultsSection.style.display = 'block';
}

/**
 * 簡化建議文字
 */
function simplifysuggestion(suggestion) {
    if (suggestion.includes("主升段")) return "抱緊";
    if (suggestion.includes("短多")) return "拉回買";
    if (suggestion.includes("故事變了")) return "保守";
    if (suggestion.includes("守 34")) return "守34";
    if (suggestion.includes("反彈")) return "快跑";
    if (suggestion.includes("空頭排列嚴重")) return "不建議";
    return suggestion.length > 10 ? suggestion.substring(0, 10) + '...' : suggestion;
}

/**
 * 顯示載入中
 */
function showLoading() {
    loadingIndicator.style.display = 'block';
}

/**
 * 隱藏載入中
 */
function hideLoading() {
    loadingIndicator.style.display = 'none';
}

/**
 * 更新載入進度
 */
function updateLoadingProgress(current, total) {
    const percentage = ((current / total) * 100).toFixed(1);
    loadingIndicator.querySelector('p').textContent = `正在分析中... ${current}/${total} (${percentage}%)`;
}

/**
 * 顯示錯誤訊息
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';

    // 3秒後自動隱藏
    setTimeout(() => {
        hideError();
    }, 3000);
}

/**
 * 隱藏錯誤訊息
 */
function hideError() {
    errorMessage.style.display = 'none';
}

/**
 * 隱藏結果區域
 */
function hideResults() {
    resultsSection.style.display = 'none';
    clearCharts();
}
