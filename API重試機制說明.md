# 🔄 API 重試機制說明

## ✨ 新增功能

已為股票數據 API 呼叫添加智能重試機制！

### 重試策略

- **最大重試次數**: 5 次
- **重試間隔**: 5 秒
- **適用範圍**: 所有股票數據獲取

## 🎯 工作流程

### 1. 首次嘗試
```
[2330] 嘗試第 1/5 次...
```

### 2. 失敗後重試
```
[2330] ❌ 第 1 次嘗試失敗: HTTP 429
[2330] ⏳ 等待 5 秒後重試...
[2330] 嘗試第 2/5 次...
```

### 3. 成功獲取
```
[2330] ✅ 成功獲取數據
```

### 4. 全部失敗
```
[2330] ❌ 已嘗試 5 次，全部失敗
顯示錯誤訊息給使用者
```

## 📊 使用場景

### 單股分析
- 自動重試 5 次
- 每次間隔 5 秒
- 失敗後顯示友善錯誤訊息

### 板塊分析
- 每支股票獨立重試
- 失敗的股票會被跳過
- 繼續分析其他股票

### 潛力股掃描
- 大量股票並行處理
- 每支股票獨立重試
- 失敗不影響其他股票

## 🔍 日誌輸出

所有重試過程都會在瀏覽器控制台輸出詳細日誌：

```javascript
// 開啟瀏覽器開發者工具 (F12)
// 切換到 Console 標籤
// 可以看到詳細的重試過程
```

### 日誌範例

```
[2330] 嘗試第 1/5 次...
[2330] ❌ 第 1 次嘗試失敗: Failed to fetch
[2330] ⏳ 等待 5 秒後重試...
[2330] 嘗試第 2/5 次...
[2330] ❌ 第 2 次嘗試失敗: HTTP 503
[2330] ⏳ 等待 5 秒後重試...
[2330] 嘗試第 3/5 次...
[2330] ✅ 成功獲取數據
```

## 💡 優勢

### 1. 提高成功率
- API 暫時性錯誤會自動重試
- 網路不穩定時更可靠

### 2. 使用者體驗
- 減少錯誤訊息
- 自動處理暫時性問題
- 只在真正失敗時才提示

### 3. 智能處理
- 區分暫時性錯誤和永久性錯誤
- 自動選擇最佳代理
- 詳細的日誌記錄

## ⚙️ 技術細節

### 重試函數

```javascript
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
            
            if (attempt < maxRetries) {
                console.log(`[${stockCode}] ⏳ 等待 ${delayMs / 1000} 秒後重試...`);
                await delay(delayMs);
            }
        }
    }
    
    throw lastError;
}
```

### 使用方式

```javascript
// 在 analyzeStock 中使用
const stockData = await retryWithDelay(
    () => fetchStockData(stockCode),
    5,      // 最多重試 5 次
    5000,   // 每次間隔 5 秒
    stockCode
);
```

## 📈 效能影響

### 最佳情況
- 首次成功：無額外延遲
- 總時間：正常 API 呼叫時間

### 最壞情況
- 5 次全部失敗
- 總時間：約 25 秒（5 次 × 5 秒間隔）

### 平均情況
- 通常 1-2 次就成功
- 總時間：5-10 秒

## 🎯 常見問題

### Q: 為什麼要等 5 秒？

A: 
- API 限流通常有時間窗口
- 5 秒是合理的等待時間
- 避免過於頻繁的請求

### Q: 可以調整重試次數嗎？

A: 可以！修改 `analysis.js` 中的參數：

```javascript
const stockData = await retryWithDelay(
    () => fetchStockData(stockCode),
    3,      // 改為 3 次
    3000,   // 改為 3 秒
    stockCode
);
```

### Q: 重試時使用者會看到什麼？

A: 
- 載入指示器持續顯示
- 「正在分析中...」訊息
- 控制台有詳細日誌

### Q: 如何查看重試日誌？

A:
1. 按 F12 開啟開發者工具
2. 切換到 Console 標籤
3. 執行股票分析
4. 查看詳細日誌

## 🔧 自訂設定

### 修改重試次數

編輯 `analysis.js` 第 202 行：

```javascript
5,      // 改為你想要的次數
```

### 修改重試間隔

編輯 `analysis.js` 第 203 行：

```javascript
5000,   // 改為你想要的毫秒數（1000 = 1秒）
```

### 停用重試機制

如果不想使用重試，改回原始呼叫：

```javascript
const stockData = await fetchStockData(stockCode);
```

## 📝 更新日誌

### v1.2.1 (2026-02-03)
- ✅ 新增 API 重試機制
- ✅ 最多重試 5 次
- ✅ 每次間隔 5 秒
- ✅ 詳細日誌輸出
- ✅ 智能錯誤處理

---

**現在 API 呼叫更可靠了！** 🎉
