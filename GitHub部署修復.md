# GitHub Pages 部署修復腳本

## 問題：部署失敗 "HttpError: Not Found"

## 解決步驟：

### 1. 設定 Actions 權限

1. 進入：https://github.com/alexliu0914/tw-stock-analysis/settings/actions
2. 在 "Workflow permissions" 選擇：
   - ✅ Read and write permissions
3. 勾選：
   - ✅ Allow GitHub Actions to create and approve pull requests
4. 點擊 Save

### 2. 重新觸發部署

在專案目錄執行：

```powershell
cd "d:\Zyxel\python練習\Irene_tw_stock"

# 觸發新的部署
git commit --allow-empty -m "Fix: Enable GitHub Pages deployment"
git push
```

### 3. 等待部署完成

1. 查看 Actions 狀態：
   https://github.com/alexliu0914/tw-stock-analysis/actions

2. 等待綠色勾勾 ✅（約 1-2 分鐘）

### 4. 訪問網站

正確的網址：
```
https://alexliu0914.github.io/tw-stock-analysis/
```

注意：結尾是 `/` 不是 `.html`

---

## 如果還是失敗

### 檢查 deploy.yml 檔案

確認 `.github/workflows/deploy.yml` 的權限設定：

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

### 檢查倉庫中的檔案

確認這些檔案存在：
- ✅ index.html
- ✅ styles.css
- ✅ app.js
- ✅ analysis.js
- ✅ stockData.js
- ✅ charts.js

---

## 常見問題

**Q: 為什麼第一次部署會失敗？**
A: GitHub Pages 環境需要先被創建，第一次推送可能會失敗。

**Q: 需要等多久？**
A: 通常 1-2 分鐘，最多 5 分鐘。

**Q: 如何確認部署成功？**
A: Actions 頁面顯示綠色勾勾 ✅

---

**更新時間**: 2026-02-03
**狀態**: 等待修復
