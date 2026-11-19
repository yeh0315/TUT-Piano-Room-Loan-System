# iOS / iPadOS 安裝與使用指南

本指南說明如何在 iPhone 或 iPad 上，透過 Safari 使用 **TUT 琴房空堂批次查詢**。

iOS 無法直接安裝桌面版 Tampermonkey，因此本指南使用開源 Safari 擴充功能 **Userscripts**。

## 1. 安裝必要工具

### 安裝 Userscripts

- [App Store：Userscripts](https://apps.apple.com/app/userscripts/id1463298887)
- [Userscripts 官方 GitHub](https://github.com/quoid/userscripts)

安裝完成後：

1. 開啟 Userscripts App。
2. 確認已設定 Scripts Directory（腳本儲存資料夾）。
3. 開啟 iPhone／iPad 的「設定」。
4. 進入「Safari」→「擴充功能」。
5. 啟用 Userscripts。
6. 允許 Userscripts 存取學校借用系統網站。

部分 iOS 版本的設定路徑可能是「設定」→「App」→「Safari」→「擴充功能」。

---

## 2. 安裝琴房查詢腳本

有兩種安裝方式，建議優先使用方式 A。

### 方式 A：使用 `.user.js` 直接安裝（推薦）

1. 使用 Safari 開啟 [GitHub 專案](https://github.com/yeh0315/TUT-Piano-Room-Loan-System)。
2. 找到名稱以 `.user.js` 結尾的腳本檔案。
3. 點進檔案，點選 **Raw**。[或者點選這裡直接跳轉](https://raw.githubusercontent.com/yeh0315/TUT-Piano-Room-Loan-System/main/TUT-Piano-Room-Loan-System.user.js)。
4. Safari 開啟腳本網址後，點選 Safari 的擴充功能按鈕。
5. 開啟 Userscripts 擴充功能。
6. 確認出現腳本安裝提示。
7. 選擇安裝並完成操作。

如果沒有出現安裝提示，請確認網址路徑本身以 `.user.js` 結尾，並確認 Userscripts 已啟用。

### 方式 B：使用 `.txt` 複製貼上

iOS 版 Userscripts 沒有 macOS 版內建的腳本編輯器，因此需要透過檔案 App 或支援文字編輯的 App 操作。

1. 使用 Safari 開啟 [GitHub 專案](https://github.com/yeh0315/TUT-Piano-Room-Loan-System)。
2. 找到 `.txt` 結尾的腳本檔案。
3. 點選 **Raw**。
4. 長按程式碼並選擇「全選」。
5. 複製完整程式碼。
6. 開啟「檔案」App，進入 Userscripts 設定的 Scripts Directory。
7. 建立新的文字檔案，將副檔名設定為 `.user.js`。
8. 將複製的程式碼貼入檔案並儲存。
9. 重新開啟 Userscripts 擴充功能，確認腳本已載入。

---

## 3. 開始使用

1. 使用 Safari 開啟[台南應用科技大學琴房借用系統](https://booking.tut.edu.tw/msc/Booking/Booking.aspx)。
2. 確認 Userscripts 擴充功能已允許在此網站執行。
3. 在網站中選擇「琴房」類別。
4. 等待課表載入。
5. 確認畫面左側出現琴房空堂批次查詢面板。
6. 選擇日期與節次。
7. 點選「搜尋所有琴房」。

---

## 4. 常見問題

### 查詢面板沒有出現

- 確認 Safari 已啟用 Userscripts。
- 確認 Userscripts 有網站存取權限。
- 確認腳本位於正確的 Scripts Directory。
- 確認檔案副檔名是 `.user.js`。
- 重新整理借用系統頁面。

### `.user.js` 沒有出現安裝提示

請確認使用 Safari 開啟 Raw 網址，並從 Safari 擴充功能按鈕開啟 Userscripts。

### iPad 可以使用嗎？

原則上可以使用相同的安裝方式，但實際介面與顯示效果可能因 iPadOS 版本及螢幕尺寸而不同。

---

## 注意事項

- 本腳本只負責查詢琴房空堂。
- 不會自動送出預約。
- 實際預約仍須由使用者自行確認並操作。
