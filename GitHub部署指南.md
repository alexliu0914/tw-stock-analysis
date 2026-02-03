# 🚀 GitHub Pages 部署指南

## ✨ 為什麼選擇 GitHub Pages？

- ✅ **完全免費** - 無需付費
- ✅ **自動 HTTPS** - 安全連線
- ✅ **解決 CORS** - 完美支援 API 請求
- ✅ **全球 CDN** - 快速訪問
- ✅ **自動部署** - 推送即部署

## 📝 部署步驟

### 步驟 1: 創建 GitHub 倉庫

1. 登入 [GitHub](https://github.com)
2. 點擊右上角 `+` → `New repository`
3. 填寫倉庫資訊：
   - **Repository name**: `tw-stock-analysis` (或任何你喜歡的名稱)
   - **Description**: `台股分析工具 - Fibonacci MA Analysis`
   - **Public** (必須是公開倉庫才能使用免費的 GitHub Pages)
4. 點擊 `Create repository`

### 步驟 2: 上傳專案檔案

#### 方法 A: 使用 Git 命令列（推薦）

```powershell
# 在專案目錄下執行
cd "d:\Zyxel\python練習\Irene_tw_stock"

# 初始化 Git 倉庫
git init

# 添加所有檔案
git add index.html styles.css app.js analysis.js stockData.js .github/

# 提交
git commit -m "Initial commit: 台股分析工具"

# 連接到 GitHub 倉庫（替換成你的用戶名和倉庫名）
git remote add origin https://github.com/你的用戶名/tw-stock-analysis.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

#### 方法 B: 使用 GitHub 網頁上傳

1. 在倉庫頁面點擊 `uploading an existing file`
2. 拖放以下檔案：
   - `index.html`
   - `styles.css`
   - `app.js`
   - `analysis.js`
   - `stockData.js`
   - `.github/workflows/deploy.yml`
3. 點擊 `Commit changes`

### 步驟 3: 啟用 GitHub Pages

1. 進入倉庫的 `Settings` 頁面
2. 在左側選單找到 `Pages`
3. 在 `Source` 下拉選單選擇：
   - **Source**: `GitHub Actions`
4. 等待幾分鐘，部署完成後會顯示網址

### 步驟 4: 訪問你的應用

部署完成後，你的應用將可以通過以下網址訪問：

```
https://你的用戶名.github.io/tw-stock-analysis/
```

例如：
```
https://irene-tw.github.io/tw-stock-analysis/
```

## 🔄 自動部署

每次你推送新的程式碼到 GitHub，應用會自動重新部署！

```powershell
# 修改檔案後
git add .
git commit -m "更新功能"
git push
```

## 📱 在手機上使用

1. 在手機瀏覽器開啟你的 GitHub Pages 網址
2. 點擊瀏覽器選單
3. 選擇「加入主畫面」或「加入書籤」
4. 現在可以像 App 一樣使用了！

## ✅ 驗證部署

部署完成後，檢查以下項目：

- [ ] 網頁可以正常開啟
- [ ] 樣式顯示正確
- [ ] 可以輸入股票代號
- [ ] 可以獲取股票數據（測試 2330）
- [ ] 板塊分析功能正常
- [ ] 圖表顯示正常

## 🐛 常見問題

### 問題 1: 404 錯誤

**原因**: 檔案路徑不正確

**解決方案**:
- 確保 `index.html` 在倉庫根目錄
- 檢查所有檔案都已上傳

### 問題 2: 樣式沒有載入

**原因**: CSS/JS 路徑錯誤

**解決方案**:
- 確保 `index.html` 中的路徑是相對路徑：
  ```html
  <link rel="stylesheet" href="styles.css">
  <script src="app.js"></script>
  ```

### 問題 3: 部署失敗

**原因**: GitHub Actions 權限問題

**解決方案**:
1. 進入 `Settings` → `Actions` → `General`
2. 在 `Workflow permissions` 選擇 `Read and write permissions`
3. 點擊 `Save`
4. 重新推送程式碼

### 問題 4: CORS 錯誤

**好消息**: GitHub Pages 完美支援 CORS，不會有這個問題！

## 🎉 完成！

恭喜！你的台股分析工具現在已經部署到網路上了！

可以在任何裝置（電腦、手機、平板）上使用，並且：
- ✅ 沒有 CORS 限制
- ✅ 支援 HTTPS
- ✅ 全球快速訪問
- ✅ 自動更新

## 📊 下一步

現在你可以：
1. 分享網址給朋友
2. 在手機上加入主畫面
3. 繼續開發新功能
4. 查看圖表視覺化效果

---

**部署時間**: 約 5-10 分鐘  
**費用**: 完全免費  
**難度**: ⭐⭐☆☆☆
