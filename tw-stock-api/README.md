# 台股分析工具 - 後端 API

## 📋 簡介

這是台股分析工具的後端 API 服務，用於：
- 解決前端 CORS 問題
- 提供穩定的股票數據獲取
- 實現數據快取，提高效能
- 支援批量查詢

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 本地運行

```bash
npm start
```

伺服器將運行在 `http://localhost:3000`

### 3. 開發模式（自動重啟）

```bash
npm run dev
```

## 📡 API 端點

### 健康檢查

```
GET /health
```

**回應**：
```json
{
  "status": "ok",
  "timestamp": "2026-02-03T08:00:00.000Z",
  "uptime": 123.456
}
```

### 獲取單一股票

```
GET /api/stock/:code
```

**參數**：
- `code`: 股票代號（例如：2330）

**回應**：
```json
{
  "success": true,
  "data": {
    "chart": {
      "result": [...]
    }
  },
  "cached": false
}
```

### 批量獲取股票

```
POST /api/stock/batch
Content-Type: application/json
```

**請求 Body**：
```json
{
  "codes": ["2330", "2317", "2454"]
}
```

**回應**：
```json
{
  "success": true,
  "data": [
    {
      "code": "2330",
      "success": true,
      "data": {...}
    },
    ...
  ],
  "total": 3,
  "success_count": 3
}
```

### 清除快取

```
DELETE /api/stock/cache/:code
```

清除特定股票的快取

```
DELETE /api/stock/cache
```

清除所有快取

### 快取統計

```
GET /api/stock/cache/stats
```

**回應**：
```json
{
  "success": true,
  "stats": {
    "keys": 10,
    "hits": 50,
    "misses": 10,
    "ksize": 10,
    "vsize": 1024
  }
}
```

## 🌐 部署到 Vercel

### 1. 安裝 Vercel CLI

```bash
npm install -g vercel
```

### 2. 登入 Vercel

```bash
vercel login
```

### 3. 部署

```bash
vercel
```

首次部署會詢問一些問題：
- Project name: `tw-stock-api`
- Directory: `./`
- Settings: 使用預設值

### 4. 生產環境部署

```bash
vercel --prod
```

### 5. 獲得網址

部署完成後，您會獲得一個網址，例如：
```
https://tw-stock-api.vercel.app
```

## 📁 專案結構

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
├── vercel.json         # Vercel 配置
└── README.md
```

## 🔧 配置

### 環境變數

可以創建 `.env` 檔案：

```env
PORT=3000
CACHE_TTL=300
```

### 快取設定

在 `utils/cache.js` 中修改：

```javascript
const cache = new NodeCache({ 
    stdTTL: 300,      // 預設 5 分鐘
    checkperiod: 60   // 每 60 秒檢查一次
});
```

## 📊 效能

- **快取命中率**: 通常 > 80%
- **回應時間**: 
  - 快取命中: < 50ms
  - 快取未命中: 1-2 秒
- **併發處理**: 支援大量並發請求

## 🔒 安全性

- CORS 已啟用，允許所有來源
- 無需 API Key
- 無使用者認證（公開 API）

## 🐛 除錯

### 查看日誌

本地運行時，所有請求都會在終端機顯示：

```
2026-02-03T08:00:00.000Z - GET /api/stock/2330
📊 請求股票: 2330
  [2330] 嘗試 1/3 (.TW)...
  [2330] ✅ 成功 (.TW)
💾 快取設置: 2330
✅ 成功獲取: 2330
```

### Vercel 日誌

部署後，在 Vercel Dashboard 查看日誌：
```
https://vercel.com/dashboard
```

## 📝 更新日誌

### v1.0.0 (2026-02-03)
- ✅ 初始版本
- ✅ 單一股票查詢
- ✅ 批量查詢
- ✅ 快取機制
- ✅ 重試邏輯
- ✅ Vercel 部署支援

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

MIT License
