# Windows / Linux 安裝與使用指南

本指南適用於 Windows 與 Linux 桌面使用者，包含 Chrome、Edge、Firefox、Brave 等瀏覽器。

## 1. 安裝必要工具

### 瀏覽器

可使用以下任一瀏覽器：

- [Google Chrome](https://www.google.com/chrome/)
- [Microsoft Edge](https://www.microsoft.com/edge)
- [Mozilla Firefox](https://www.mozilla.org/firefox/)
- [Brave](https://brave.com/)

### Userscript 管理器

建議使用 Tampermonkey 或 Violentmonkey。

- [Tampermonkey](https://www.tampermonkey.net/)
- [Violentmonkey](https://violentmonkey.github.io/)

安裝完成後，確認瀏覽器工具列出現 Userscript 管理器圖示。

---

## 2. 安裝琴房查詢腳本

有兩種安裝方式，建議優先使用方式 A。

### 方式 A：使用 `.user.js` 直接安裝（推薦）

1. 開啟 [GitHub 專案](https://github.com/yeh0315/TUT-Piano-Room-Loan-System)。
2. 找到名稱以 `.user.js` 結尾的腳本檔案。
3. 點進檔案，點選 **Raw**。
4. 瀏覽器應該會交由 Tampermonkey 或 Violentmonkey 處理。
5. 確認腳本名稱、版本與程式碼。
6. 點選「安裝」。
7. 確認腳本已出現在管理器的已安裝腳本清單中。

如果 Raw 只顯示程式碼，請改用方式 B。

### 方式 B：使用 `.txt` 複製貼上

1. 開啟 [GitHub 專案](https://github.com/yeh0315/TUT-Piano-Room-Loan-System)。
2. 找到 `.txt` 結尾的腳本檔案。
3. 點選 **Raw**。
4. 使用 `Ctrl + A` 全選程式碼。
5. 使用 `Ctrl + C` 複製。
6. 開啟 Tampermonkey 或 Violentmonkey 管理面板。
7. 選擇「新增腳本」。
8. 刪除編輯器內原本的範例程式碼。
9. 使用 `Ctrl + V` 貼上完整程式碼。
10. 使用 `Ctrl + S` 儲存。
11. 確認腳本已啟用。

---

## 3. Chrome / Edge 額外設定

新版 Chrome 與 Edge 可能需要額外允許 Userscript 執行。

### Google Chrome

1. 在網址列輸入 `chrome://extensions`。
2. 找到 Tampermonkey。
3. 點選「詳細資料」。
4. 開啟「允許使用者指令碼」（Allow user scripts）。

### Microsoft Edge

1. 在網址列輸入 `edge://extensions`。
2. 找到 Tampermonkey。
3. 點選「詳細資料」。
4. 開啟「允許使用者指令碼」（Allow user scripts）。

如果你的瀏覽器版本沒有這個選項，請依照該版本 Tampermonkey 的提示啟用必要的擴充功能開發者設定。

Firefox 通常不需要這項額外設定。

---

## 4. 開始使用

1. 開啟[台南應用科技大學琴房借用系統](https://booking.tut.edu.tw/msc/Booking/Booking.aspx)。
2. 在網站中選擇「琴房」類別。
3. 等待琴房課表載入。
4. 確認畫面左側出現琴房空堂批次查詢面板。
5. 選擇日期與節次。
6. 點選「搜尋所有琴房」。
7. 等待查詢完成。
8. 從結果中選擇想使用的琴房，前往學校原本的預約頁面。

---

## 5. 常見問題

### 查詢面板沒有出現

請依序確認：

- Userscript 管理器已啟用。
- 腳本已啟用。
- 瀏覽器允許 Userscript 執行。
- 目前網址是學校的琴房借用系統。
- 已選擇「琴房」類別。
- 課表已經載入完成。

完成後重新整理頁面。

### Raw 沒有跳出安裝畫面

請改用方式 B，手動複製 `.txt` 內容並新增腳本。

### 查詢結果不正確或部分琴房查詢失敗

可能原因：

- 學校網站暫時無法連線。
- 登入狀態逾時。
- 學校網站更新了查詢機制。
- 網路連線不穩定。

可以重新整理頁面並再次查詢。

---

## 注意事項

- 本腳本只負責批次查詢琴房空堂。
- 不會自動送出預約。
- 使用者仍須自行確認預約資訊並完成學校系統的預約流程。
