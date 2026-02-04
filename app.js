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

// Custom Sector DOM 元素
const addCustomSectorBtn = document.getElementById('addCustomSectorBtn');
const manageSectorsBtn = document.getElementById('manageSectorsBtn');
const customSectorModal = document.getElementById('customSectorModal');
const closeCustomSectorModal = document.getElementById('closeCustomSectorModal');
const manageSectorsModal = document.getElementById('manageSectorsModal');
const closeManageSectorsModal = document.getElementById('closeManageSectorsModal');
const sectorName = document.getElementById('sectorName');
const sectorStocks = document.getElementById('sectorStocks');
const stockValidation = document.getElementById('stockValidation');
const saveCustomSector = document.getElementById('saveCustomSector');
const cancelCustomSector = document.getElementById('cancelCustomSector');
const customSectorsList = document.getElementById('customSectorsList');
const exportSectorsBtn = document.getElementById('exportSectorsBtn');
const importSectorsFile = document.getElementById('importSectorsFile');

// 當前編輯的板塊 ID
let currentEditingSectorId = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeSectorGrid();
    setupEventListeners();
    setupCustomSectorListeners();
});

/**
 * 初始化板塊選擇網格
 */
function initializeSectorGrid() {
    const sectors = getAllSectors();
    sectorGrid.innerHTML = '';

    sectors.forEach(sector => {
        const btn = document.createElement('button');
        btn.className = 'sector-btn';

        // 添加板塊名稱
        const nameSpan = document.createElement('span');
        nameSpan.textContent = sector.name;
        btn.appendChild(nameSpan);

        // 添加標籤
        const badge = document.createElement('span');
        badge.className = `sector-badge ${sector.isCustom ? 'custom' : 'default'}`;
        badge.textContent = sector.isCustom ? '自訂' : '預設';
        btn.appendChild(badge);

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

    const stocks = getSectorStocksById(sectorId);
    const allSectors = getAllSectors();
    const sector = allSectors.find(s => s.id === sectorId);
    const sectorName = sector ? sector.name : sectorId;

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

    // === 新增：AI 評分卡片 ===
    if (data.aiScore !== undefined) {
        // 根據評分設定顏色
        let scoreColor = '#3b82f6';
        if (data.aiScore >= 15) scoreColor = '#22c55e';
        else if (data.aiScore >= 12) scoreColor = '#10b981';
        else if (data.aiScore >= 9) scoreColor = '#3b82f6';
        else if (data.aiScore >= 6) scoreColor = '#6366f1';

        // 根據風險設定顏色
        let riskColor = '#6b7280';
        let riskBg = 'rgba(107, 114, 128, 0.1)';
        if (data.aiRiskLevel === '高') {
            riskColor = '#ef4444';
            riskBg = 'rgba(239, 68, 68, 0.1)';
        } else if (data.aiRiskLevel === '中高') {
            riskColor = '#f59e0b';
            riskBg = 'rgba(245, 158, 11, 0.1)';
        } else if (data.aiRiskLevel === '中低') {
            riskColor = '#10b981';
            riskBg = 'rgba(16, 185, 129, 0.1)';
        }

        document.getElementById('analysisContent').innerHTML += `
            <div class="ai-score-card" style="
                margin-top: 20px;
                padding: 20px;
                background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);
                border-radius: 12px;
                border: 1px solid rgba(59, 130, 246, 0.2);
            ">
                <h3 style="margin: 0 0 15px 0; color: ${scoreColor}; display: flex; align-items: center; gap: 8px;">
                    🤖 AI 綜合評分
                    <span style="font-size: 0.8em; color: var(--text-secondary);">(v1.1)</span>
                </h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 15px;">
                    <!-- 評分 -->
                    <div style="text-align: center;">
                        <div style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 5px;">評分</div>
                        <div style="font-size: 2em; font-weight: bold; color: ${scoreColor};">
                            ${data.aiScore}
                        </div>
                        <div style="font-size: 0.75em; color: var(--text-secondary);">/ ${data.aiMaxScore}</div>
                    </div>
                    
                    <!-- 星級 -->
                    <div style="text-align: center;">
                        <div style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 5px;">星級</div>
                        <div style="font-size: 1.5em; margin: 5px 0;">
                            ${data.aiStars || '無'}
                        </div>
                        <div style="font-size: 0.85em; color: ${scoreColor}; font-weight: 500;">
                            ${data.aiRating}
                        </div>
                    </div>
                    
                    <!-- 信心度 -->
                    <div style="text-align: center;">
                        <div style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 5px;">信心度</div>
                        <div style="margin: 10px auto; width: 80px;">
                            <div style="width: 100%; height: 8px; background: rgba(59, 130, 246, 0.2); border-radius: 4px; overflow: hidden;">
                                <div style="width: ${data.aiConfidence}%; height: 100%; background: ${scoreColor}; transition: width 0.3s;"></div>
                            </div>
                        </div>
                        <div style="font-size: 1.2em; font-weight: bold; color: ${scoreColor};">
                            ${data.aiConfidence}%
                        </div>
                    </div>
                    
                    <!-- 風險 -->
                    <div style="text-align: center;">
                        <div style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 5px;">風險等級</div>
                        <div style="margin: 10px 0;">
                            <span style="
                                padding: 6px 16px;
                                border-radius: 6px;
                                font-size: 1em;
                                background: ${riskBg};
                                color: ${riskColor};
                                font-weight: 600;
                                display: inline-block;
                            ">${data.aiRiskLevel}</span>
                        </div>
                    </div>
                </div>
                
                <!-- 評分原因 -->
                <div style="
                    margin-top: 15px;
                    padding-top: 15px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                ">
                    <div style="font-size: 0.9em; font-weight: 600; margin-bottom: 10px; color: var(--text-secondary);">
                        📋 評分依據：
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${data.aiReasons.map(reason => `
                            <span style="
                                padding: 4px 10px;
                                background: rgba(255, 255, 255, 0.05);
                                border-radius: 6px;
                                font-size: 0.85em;
                                border: 1px solid rgba(255, 255, 255, 0.1);
                            ">${reason}</span>
                        `).join('')}
                    </div>
                </div>
                
                <!-- 說明 -->
                <div style="
                    margin-top: 15px;
                    padding: 10px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 6px;
                    font-size: 0.8em;
                    color: var(--text-secondary);
                    line-height: 1.5;
                ">
                    💡 <strong>說明：</strong>AI 評分綜合考量 KD 指標、均線排列、價格位置、趨勢強度和進場機會等多個維度，提供客觀的技術面評估。評分僅供參考，投資前請做好風險控管。
                </div>
            </div>
        `;
    }

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
    document.getElementById('multiStockTitle').textContent = `🎯 AI 潛力股掃描結果 (前 ${results.length} 名)`;

    const table = document.getElementById('stockTable');
    table.innerHTML = `
        <thead>
            <tr>
                <th>排名</th>
                <th>代號</th>
                <th>名稱</th>
                <th>AI評分</th>
                <th>星級</th>
                <th>信心度</th>
                <th>風險</th>
                <th>目前價</th>
                <th>進場價</th>
                <th>主要原因</th>
            </tr>
        </thead>
        <tbody>
            ${results.map((stock, index) => {
        // 根據評分設定顏色
        let scoreColor = '#3b82f6'; // 預設藍色
        if (stock.score >= 15) scoreColor = '#22c55e'; // 綠色
        else if (stock.score >= 12) scoreColor = '#10b981'; // 淺綠
        else if (stock.score >= 9) scoreColor = '#3b82f6'; // 藍色
        else if (stock.score >= 6) scoreColor = '#6366f1'; // 紫色

        // 根據風險設定顏色
        let riskColor = '#6b7280'; // 預設灰色
        let riskBg = 'rgba(107, 114, 128, 0.1)';
        if (stock.riskLevel === '高') {
            riskColor = '#ef4444';
            riskBg = 'rgba(239, 68, 68, 0.1)';
        } else if (stock.riskLevel === '中高') {
            riskColor = '#f59e0b';
            riskBg = 'rgba(245, 158, 11, 0.1)';
        } else if (stock.riskLevel === '中低') {
            riskColor = '#10b981';
            riskBg = 'rgba(16, 185, 129, 0.1)';
        }

        return `
                <tr>
                    <td><strong>${index + 1}</strong></td>
                    <td>${stock.code}</td>
                    <td>${stock.name}</td>
                    <td>
                        <strong style="color: ${scoreColor}; font-size: 1.1em;">
                            ${stock.score}/${stock.maxScore}
                        </strong>
                    </td>
                    <td style="font-size: 1.1em;">${stock.stars}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <div style="width: 50px; height: 6px; background: rgba(59, 130, 246, 0.2); border-radius: 3px; overflow: hidden;">
                                <div style="width: ${stock.confidence}%; height: 100%; background: ${scoreColor}; transition: width 0.3s;"></div>
                            </div>
                            <span style="font-size: 0.85em; color: ${scoreColor};">${stock.confidence}%</span>
                        </div>
                    </td>
                    <td>
                        <span style="
                            padding: 2px 8px;
                            border-radius: 4px;
                            font-size: 0.85em;
                            background: ${riskBg};
                            color: ${riskColor};
                            font-weight: 500;
                        ">${stock.riskLevel}</span>
                    </td>
                    <td>NT$ ${stock.price.toFixed(2)}</td>
                    <td>${stock.entryPrice > 0 ? 'NT$ ' + stock.entryPrice.toFixed(2) : '---'}</td>
                    <td style="font-size: 0.9em;">
                        ${stock.reasons.slice(0, 3).join('<br>')}
                    </td>
                </tr>
                `;
    }).join('')}
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
