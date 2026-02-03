# 🚀 後端 API 建立規劃

## 📋 目錄

1. [為什麼需要後端 API](#為什麼需要後端-api)
2. [架構概念](#架構概念)
3. [技術選擇](#技術選擇)
4. [實作步驟](#實作步驟)
5. [部署方案](#部署方案)
6. [成本分析](#成本分析)

---

## 🎯 為什麼需要後端 API

### 目前的問題

#### 1. CORS 限制
```
❌ 瀏覽器 → Yahoo Finance API (被 CORS 封鎖)
✅ 瀏覽器 → CORS 代理 → Yahoo Finance API (可以，但不穩定)
```

#### 2. CORS 代理的問題
- ⚠️ 免費代理不穩定
- ⚠️ 有請求限制（429 錯誤）
- ⚠️ 可能隨時停止服務
- ⚠️ 速度慢

#### 3. 前端直接呼叫的問題
- ⚠️ API Key 暴露（如果使用付費 API）
- ⚠️ 無法快取數據
- ⚠️ 無法做進階處理

### 使用後端 API 的優勢

#### 1. 解決 CORS 問題
```
✅ 瀏覽器 → 你的後端 API → Yahoo Finance API
   (無 CORS)    (無 CORS)
```

#### 2. 更穩定
- ✅ 自己控制的服務
- ✅ 可以快取數據
- ✅ 可以重試邏輯
- ✅ 可以限流保護

#### 3. 更安全
- ✅ API Key 不暴露
- ✅ 可以加入驗證
- ✅ 可以記錄使用情況

#### 4. 更快速
- ✅ 伺服器端快取
- ✅ 批量處理
- ✅ 數據預處理

---

## 🏗️ 架構概念

### 目前架構（前端直接呼叫）

```
┌─────────────┐
│  瀏覽器      │
│  (前端)      │
└──────┬──────┘
       │
       ↓ (CORS 問題)
┌─────────────┐
│ CORS 代理    │
│ (不穩定)     │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Yahoo       │
│ Finance API │
└─────────────┘
```

### 建議架構（使用後端 API）

```
┌─────────────┐
│  瀏覽器      │
│  (前端)      │
└──────┬──────┘
       │
       ↓ (無 CORS)
┌─────────────┐
│  你的後端    │
│  API Server │
│  ┌────────┐ │
│  │ 快取   │ │
│  └────────┘ │
└──────┬──────┘
       │
       ↓ (伺服器端請求)
┌─────────────┐
│ Yahoo       │
│ Finance API │
└─────────────┘
```

### 進階架構（含數據庫）

```
┌─────────────┐
│  瀏覽器      │
│  (前端)      │
└──────┬──────┘
       │
       ↓
┌─────────────────────────┐
│  你的後端 API Server     │
│  ┌────────┐  ┌────────┐ │
│  │ Redis  │  │ 數據庫 │ │
│  │ 快取   │  │ (歷史) │ │
│  └────────┘  └────────┘ │
└──────┬──────────────────┘
       │
       ↓
┌─────────────┐
│ Yahoo       │
│ Finance API │
└─────────────┘
```

---

## 🛠️ 技術選擇

### 方案 1: Node.js + Express（推薦新手）

**優點**：
- ✅ JavaScript，與前端相同語言
- ✅ 生態系統豐富
- ✅ 部署簡單
- ✅ 學習曲線平緩

**缺點**：
- ⚠️ 單線程（但對這個應用足夠）

**技術棧**：
```
- Node.js (運行環境)
- Express (Web 框架)
- Axios (HTTP 請求)
- node-cache (記憶體快取)
```

### 方案 2: Python + Flask（推薦已有 Python 經驗）

**優點**：
- ✅ 你已經有 Python 程式碼
- ✅ 可以重用現有邏輯
- ✅ 數據處理強大
- ✅ 部署簡單

**缺點**：
- ⚠️ 需要學習 Web 框架

**技術棧**：
```
- Python 3.x
- Flask (輕量級 Web 框架)
- Requests (HTTP 請求)
- Flask-Caching (快取)
```

### 方案 3: Python + FastAPI（推薦進階）

**優點**：
- ✅ 現代化框架
- ✅ 自動生成 API 文檔
- ✅ 類型檢查
- ✅ 非常快速

**缺點**：
- ⚠️ 學習曲線較陡

**技術棧**：
```
- Python 3.x
- FastAPI (現代 Web 框架)
- Uvicorn (ASGI 伺服器)
- Redis (快取，可選)
```

---

## 📝 實作步驟

### 階段 1: 基礎後端 API（1-2 天）

#### 使用 Node.js + Express 範例

**1. 初始化專案**

```bash
mkdir tw-stock-api
cd tw-stock-api
npm init -y
npm install express axios cors node-cache
```

**2. 創建基本 API (`server.js`)**

```javascript
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const NodeCache = require('node-cache');

const app = express();
const cache = new NodeCache({ stdTTL: 300 }); // 快取 5 分鐘

// 允許前端跨域請求
app.use(cors());
app.use(express.json());

// API 端點：獲取股票數據
app.get('/api/stock/:code', async (req, res) => {
    const { code } = req.params;
    
    try {
        // 檢查快取
        const cached = cache.get(code);
        if (cached) {
            console.log(`從快取返回: ${code}`);
            return res.json(cached);
        }
        
        // 呼叫 Yahoo Finance API
        const ticker = `${code}.TW`;
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1y`;
        
        const response = await axios.get(url);
        const data = response.data;
        
        // 儲存到快取
        cache.set(code, data);
        
        res.json(data);
    } catch (error) {
        console.error(`獲取 ${code} 失敗:`, error.message);
        res.status(500).json({ error: '無法獲取股票數據' });
    }
});

// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API 伺服器運行在 http://localhost:${PORT}`);
});
```

**3. 啟動伺服器**

```bash
node server.js
```

**4. 測試 API**

```bash
# 瀏覽器訪問
http://localhost:3000/api/stock/2330

# 或使用 curl
curl http://localhost:3000/api/stock/2330
```

**5. 修改前端程式碼**

修改 `analysis.js` 中的 `fetchStockDataCore` 函數：

```javascript
async function fetchStockDataCore(stockCode) {
    // 呼叫你的後端 API（無 CORS 問題）
    const url = `https://your-api.com/api/stock/${stockCode}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // 處理數據...
    return {
        timestamps: data.chart.result[0].timestamp,
        opens: data.chart.result[0].indicators.quote[0].open,
        // ...
    };
}
```

---

### 階段 2: 添加快取和優化（2-3 天）

#### 1. Redis 快取（更好的效能）

```javascript
const redis = require('redis');
const client = redis.createClient();

// 獲取股票數據（使用 Redis）
app.get('/api/stock/:code', async (req, res) => {
    const { code } = req.params;
    
    // 檢查 Redis 快取
    const cached = await client.get(`stock:${code}`);
    if (cached) {
        return res.json(JSON.parse(cached));
    }
    
    // 獲取數據
    const data = await fetchFromYahoo(code);
    
    // 儲存到 Redis（5 分鐘過期）
    await client.setEx(`stock:${code}`, 300, JSON.stringify(data));
    
    res.json(data);
});
```

#### 2. 批量請求端點

```javascript
// 批量獲取股票數據
app.post('/api/stocks/batch', async (req, res) => {
    const { codes } = req.body; // ['2330', '2317', '2454']
    
    const results = await Promise.all(
        codes.map(code => fetchStockData(code))
    );
    
    res.json(results);
});
```

#### 3. 限流保護

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分鐘
    max: 100 // 最多 100 個請求
});

app.use('/api/', limiter);
```

---

### 階段 3: 數據庫儲存（3-5 天）

#### 使用 MongoDB 儲存歷史數據

```javascript
const mongoose = require('mongoose');

// 股票數據模型
const StockSchema = new mongoose.Schema({
    code: String,
    date: Date,
    open: Number,
    high: Number,
    low: Number,
    close: Number,
    volume: Number
});

const Stock = mongoose.model('Stock', StockSchema);

// 儲存歷史數據
async function saveStockData(code, data) {
    const records = data.timestamps.map((timestamp, i) => ({
        code,
        date: new Date(timestamp * 1000),
        open: data.opens[i],
        high: data.highs[i],
        low: data.lows[i],
        close: data.closes[i],
        volume: data.volumes[i]
    }));
    
    await Stock.insertMany(records);
}
```

---

## 🌐 部署方案

### 方案 1: Vercel（推薦，免費）

**優點**：
- ✅ 完全免費
- ✅ 自動 HTTPS
- ✅ 全球 CDN
- ✅ 自動部署

**步驟**：

1. **安裝 Vercel CLI**
```bash
npm install -g vercel
```

2. **創建 `vercel.json`**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

3. **部署**
```bash
vercel
```

4. **獲得網址**
```
https://tw-stock-api.vercel.app
```

### 方案 2: Railway（推薦，免費額度）

**優點**：
- ✅ 支援數據庫
- ✅ 簡單部署
- ✅ 免費額度 $5/月

**步驟**：

1. 到 [Railway.app](https://railway.app)
2. 連接 GitHub 倉庫
3. 自動部署

### 方案 3: Render（免費）

**優點**：
- ✅ 免費方案
- ✅ 支援數據庫
- ✅ 自動 HTTPS

**限制**：
- ⚠️ 閒置會休眠（需要喚醒）

### 方案 4: Heroku（付費，但穩定）

**優點**：
- ✅ 非常穩定
- ✅ 豐富的附加元件

**缺點**：
- ⚠️ 免費方案已取消
- ⚠️ 最低 $7/月

---

## 💰 成本分析

### 免費方案

| 服務 | 限制 | 適用場景 |
|------|------|---------|
| **Vercel** | 100GB 流量/月 | ✅ 個人使用 |
| **Railway** | $5 免費額度/月 | ✅ 小型專案 |
| **Render** | 750 小時/月 | ✅ 測試開發 |

### 付費方案（如果需要）

| 服務 | 價格 | 適用場景 |
|------|------|---------|
| **Railway** | $5-20/月 | 中小型應用 |
| **Heroku** | $7-25/月 | 商業應用 |
| **AWS/GCP** | 依使用量 | 大型應用 |

---

## 📊 完整範例：Node.js 後端

### 專案結構

```
tw-stock-api/
├── server.js           # 主伺服器
├── routes/
│   └── stock.js        # 股票路由
├── services/
│   └── yahoo.js        # Yahoo Finance 服務
├── utils/
│   └── cache.js        # 快取工具
├── package.json
└── vercel.json         # Vercel 配置
```

### `server.js`

```javascript
const express = require('express');
const cors = require('cors');
const stockRoutes = require('./routes/stock');

const app = express();

app.use(cors());
app.use(express.json());

// 路由
app.use('/api/stock', stockRoutes);

// 健康檢查
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
```

### `routes/stock.js`

```javascript
const express = require('express');
const router = express.Router();
const yahooService = require('../services/yahoo');
const cache = require('../utils/cache');

// 獲取單一股票
router.get('/:code', async (req, res) => {
    try {
        const { code } = req.params;
        
        // 檢查快取
        const cached = cache.get(code);
        if (cached) {
            return res.json(cached);
        }
        
        // 獲取數據
        const data = await yahooService.fetchStock(code);
        
        // 快取
        cache.set(code, data, 300); // 5 分鐘
        
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 批量獲取
router.post('/batch', async (req, res) => {
    try {
        const { codes } = req.body;
        const results = await yahooService.fetchBatch(codes);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
```

### `services/yahoo.js`

```javascript
const axios = require('axios');

async function fetchStock(code) {
    const ticker = `${code}.TW`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1y`;
    
    const response = await axios.get(url);
    return response.data;
}

async function fetchBatch(codes) {
    const promises = codes.map(code => fetchStock(code));
    return Promise.all(promises);
}

module.exports = {
    fetchStock,
    fetchBatch
};
```

---

## 🎯 實作建議

### 第一步：最小可行產品（MVP）

1. **只做單一股票查詢**
2. **使用記憶體快取**
3. **部署到 Vercel**
4. **測試前端整合**

**時間**：1-2 天

### 第二步：優化

1. **添加批量查詢**
2. **添加 Redis 快取**
3. **添加錯誤處理**
4. **添加日誌**

**時間**：2-3 天

### 第三步：進階功能

1. **添加數據庫**
2. **添加使用者認證**
3. **添加 API 文檔**
4. **添加監控**

**時間**：1-2 週

---

## ✅ 總結

### 推薦方案

**對於您的專案，我推薦**：

1. **技術**: Node.js + Express
   - 與前端相同語言
   - 簡單易學
   - 部署容易

2. **部署**: Vercel
   - 完全免費
   - 自動部署
   - 全球 CDN

3. **快取**: node-cache（初期）→ Redis（進階）
   - 初期用記憶體快取即可
   - 後期可升級到 Redis

### 預期效果

- ✅ **解決 CORS 問題**
- ✅ **提高穩定性** 95%+
- ✅ **加快速度** 2-3 倍（快取）
- ✅ **降低錯誤率** 90%+

### 下一步

1. 決定使用哪個技術棧
2. 我可以幫您建立完整的後端程式碼
3. 一步步指導部署

**需要我現在就開始建立後端 API 嗎？** 🚀
