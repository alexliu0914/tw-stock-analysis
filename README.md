# 台股分析工具 - Android 手機版

## 📱 簡介

這是一個專為 Android 手機設計的台股分析工具，使用 Web 技術開發，可在任何手機瀏覽器上運行。

原始 Python 程式已備份為 `ST_test_backup_*.py`

## ✨ 功能特色

- 📊 **單股分析**: 輸入股票代號即可獲得完整技術分析
- 🎯 **板塊分析**: 快速查看整個板塊的股票表現
- 🔍 **潛力股掃描**: 自動掃描並評分潛力股票
- 📈 **費波那契均線**: 支援 MA5/13/21/34/55/144 分析
- 📉 **KD 指標**: 提供 KD(9,3,3) 技術指標
- 💡 **智能建議**: 根據技術面給予操作建議
- 📊 **圖表視覺化**: 使用 Chart.js 呈現價格走勢和技術指標（新增）
- 🎨 **互動式圖表**: 支援懸停提示、圖例控制等互動功能（新增）

## 🚀 使用方法

### 方法一：手機直接開啟（推薦！✨）

**好消息：大部分手機瀏覽器支援直接開啟本地 HTML 檔案並訪問外部 API！**

#### 步驟：
1. 將所有檔案複製到手機（可透過 USB、雲端硬碟、或 Email）
2. **先測試**：用手機瀏覽器開啟 `test_mobile.html`
   - 點擊「測試 Yahoo Finance API」按鈕
   - 如果顯示 ✅ 成功，代表您的手機支援！
3. **開始使用**：用手機瀏覽器開啟 `index.html`
4. **加入書籤**：將頁面加入書籤或主畫面，方便下次使用

#### 支援的手機瀏覽器：
- ✅ Chrome (Android)
- ✅ Safari (iOS)  
- ✅ Firefox (Android)
- ✅ Samsung Internet
- ✅ Edge (Android)

### 方法二：部署到網路空間（最穩定）

將所有檔案上傳到任何支援靜態網頁的主機服務：

#### GitHub Pages（推薦！⭐⭐⭐）
1. 在 GitHub 創建新倉庫
2. 上傳所有檔案（包括 `.github/workflows/deploy.yml`）
3. 在 Settings > Pages 選擇 `GitHub Actions`
4. 自動部署完成，獲得網址：`https://你的用戶名.github.io/倉庫名稱`

📖 **詳細步驟請參考**: `GitHub部署指南.md`

#### Firebase Hosting（備選）
1. 安裝 Firebase CLI：`npm install -g firebase-tools`
2. 登入 Firebase：`firebase login`
3. 執行部署腳本：`.\deploy.ps1`
4. 獲得網址：`https://your-project-id.web.app`

📖 **詳細步驟請參考**: `Firebase部署指南.md`

#### GitHub Pages
1. 在 GitHub 創建新倉庫
2. 上傳所有 HTML/CSS/JS 檔案
3. 在 Settings > Pages 啟用
4. 獲得網址：`https://你的用戶名.github.io/倉庫名稱`

#### Netlify
1. 註冊 Netlify 帳號
2. 拖放整個資料夾
3. 自動獲得 HTTPS 網址

#### Vercel
1. 註冊 Vercel 帳號
2. 連接 GitHub 或直接上傳
3. 自動部署

### 方法三：本地伺服器測試（會有 CORS 限制）

在電腦上執行以下命令啟動本地伺服器：

```powershell
# 使用 Python 啟動伺服器
python -m http.server 8000
```

然後在瀏覽器輸入：`http://localhost:8000`

⚠️ **注意**：使用本地伺服器會遇到 CORS 限制，無法獲取股票數據。請參考 `CORS_解決方案.md`。

## 📂 檔案結構

```
Irene_tw_stock/
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Actions 自動部署
├── index.html             # 主頁面
├── styles.css             # 樣式表
├── app.js                 # 主應用程式邏輯
├── analysis.js            # 股票分析核心
├── stockData.js           # 股票資料庫
├── charts.js              # 圖表管理模組（新增）
├── firebase.json          # Firebase 配置
├── .firebaserc            # Firebase 專案設定
├── deploy.ps1             # 快速部署腳本
├── test-local.ps1         # 本地測試腳本
├── GitHub部署指南.md       # GitHub Pages 部署指南（新增）
├── Firebase部署指南.md     # Firebase 部署完整指南
├── 圖表功能說明.md         # Chart.js 功能說明（新增）
├── public/                # Firebase 部署目錄
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── analysis.js
│   ├── stockData.js
│   └── charts.js          # 新增
├── ST_test.py             # 原始 Python 程式
└── ST_test_backup_*.py    # Python 程式備份
```

## 🎨 介面說明

### 主要功能區

1. **股票查詢**: 輸入股票代號（如 2330）進行分析
2. **板塊分析**: 選擇產業板塊查看整體表現
3. **掃描潛力股**: 自動掃描並評分所有股票

### 分析結果

- **價格資訊**: 顯示開高低收
- **技術指標**: 
  - 費波那契均線 (MA5/13/21/34/55/144)
  - KD 指標 (K值、D值、訊號)
- **圖表視覺化**:（新增）
  - 價格與均線走勢圖
  - KD 指標圖表
  - 互動式圖例和懸停提示
- **操作建議**:
  - 目前趨勢判斷
  - 操作建議
  - 建議進場價位
  - 建議出場價位

## 📊 支援板塊

- ABF載板
- 記憶體
- CPO光通訊
- CCL銅箔
- PCB電路板
- 銅箔基板
- 矽光子
- 玻纖布
- 封裝測試
- 金仁寶集團
- 華新集團
- 台鋼集團
- 明基友達
- 電子五哥

## ⚠️ 注意事項

1. **網路連線**: 需要網路連線以獲取即時股票數據
2. **API 限制**: 使用 Yahoo Finance API，可能有查詢頻率限制
3. **僅供參考**: 本工具僅供參考，投資前請詳閱財報並做好風險控管
4. **CORS 問題**: 如遇到 CORS 錯誤，請使用本地伺服器或部署到網路空間

## 🔧 技術說明

### 與 Python 版本的差異

| 功能 | Python 版本 | Web 版本 |
|------|------------|---------|
| 執行環境 | 需安裝 Python | 任何瀏覽器 |
| 資料來源 | yfinance 套件 | Yahoo Finance API |
| 介面 | 命令列 | 圖形化網頁 |
| 多執行緒 | concurrent.futures | async/await |
| 平台 | Windows/Mac/Linux | 跨平台（含手機） |

### 核心演算法

兩個版本使用相同的分析邏輯：

1. **費波那契均線**: 5, 13, 21, 34, 55, 144
2. **KD 指標**: 9日 RSV，K值和D值使用 2/3 權重
3. **策略判斷**: 
   - 144MA 判斷多空
   - 34/55MA 判斷波段
   - 5/13/21MA 判斷短線

## 🐛 疑難排解

### 問題：無法獲取股票數據

**解決方案**:
- 檢查網路連線
- 確認股票代號正確
- 稍後再試（可能是 API 限制）

### 問題：頁面顯示異常

**解決方案**:
- 清除瀏覽器快取
- 使用最新版本的 Chrome 或 Safari
- 確保所有檔案都在同一目錄

### 問題：掃描功能太慢

**解決方案**:
- 掃描所有股票需要較長時間
- 建議使用 WiFi 連線
- 可以先使用板塊分析功能

## 📝 更新日誌

### v1.1.0 (2026-02-03)
- ✅ 整合 Chart.js 圖表視覺化
- ✅ 新增價格與均線圖表
- ✅ 新增 KD 指標圖表
- ✅ 新增 GitHub Pages 自動部署
- ✅ 互動式圖表功能
- ✅ 深色主題圖表設計

### v1.0.0 (2026-01-21)
- ✅ 將 Python 程式改寫為 Web 應用
- ✅ 支援手機瀏覽器
- ✅ 現代化 UI 設計
- ✅ 響應式佈局
- ✅ 完整技術分析功能

## 📄 授權

本專案僅供個人學習和研究使用。

## 🙏 致謝

- 數據來源: Yahoo Finance
- 原始程式: ST_test.py
