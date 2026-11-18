// ==UserScript==
// @name         TUT 琴房空堂批次查詢
// @namespace    https://booking.tut.edu.tw/
// @version      3.1.0
// @description  批次查詢所有琴房的可預約時段，不會自動預約
// @match        https://booking.tut.edu.tw/msc/Booking/Booking.aspx
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(() => {
  "use strict";

  const ROOM_TYPE_ID = "ctl00_ContentPlaceHolder1_DropDownList_RoomType";

  const ROOM_ID = "ctl00_ContentPlaceHolder1_DropDownList_Room";

  const UPDATE_PANEL_ID = "ctl00_ContentPlaceHolder1_UpdatePanel1";

  const SEARCH_TARGET = "ctl00$ContentPlaceHolder1$LinkButton_Search";

  const SCRIPT_MANAGER = "ctl00$ContentPlaceHolder1$ScriptManager1";

  const PANEL_ID = "tut-piano-room-search-panel";

  let searching = false;

  // --------------------------------------------------
  // 基本工具
  // --------------------------------------------------

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const cleanText = (element) =>
    (element?.textContent || "").replace(/\s+/g, " ").trim();

  function getRoomSelect(doc = document) {
    return doc.getElementById(ROOM_ID);
  }

  function getRoomTypeSelect(doc = document) {
    return doc.getElementById(ROOM_TYPE_ID);
  }

  function getRooms(doc = document) {
    const select = getRoomSelect(doc);

    if (!select) return [];

    return Array.from(select.options)
      .filter((option) => option.value && option.textContent.includes("琴房"))
      .map((option) => ({
        value: option.value,
        name: cleanText(option),
      }));
  }

  // --------------------------------------------------
  // 找出課表
  // --------------------------------------------------

  function getScheduleTable(doc) {
    return Array.from(doc.querySelectorAll("table")).find((table) => {
      const rows = Array.from(table.rows);

      if (rows.length < 2) return false;

      const header = rows[0];

      const hasDate = Array.from(header.cells).some((cell) =>
        /\d{4}\/\d{1,2}\/\d{1,2}/.test(cleanText(cell)),
      );

      const hasPeriod = rows.some((row) =>
        /第\s*1\s*節/.test(cleanText(row.cells[0])),
      );

      return hasDate && hasPeriod;
    });
  }

  function getScheduleInfo(doc) {
    const table = getScheduleTable(doc);

    if (!table) {
      throw new Error("找不到琴房課表");
    }

    const header = table.rows[0];

    const dates = [];

    Array.from(header.cells).forEach((cell, index) => {
      const match = cleanText(cell).match(/\d{4}\/\d{1,2}\/\d{1,2}/);

      if (match) {
        dates.push({
          date: match[0],
          index,
        });
      }
    });

    const periods = [];

    Array.from(table.rows).forEach((row, index) => {
      const firstCell = row.cells[0];

      if (!firstCell) return;

      const text = cleanText(firstCell);

      const match = text.match(/第\s*(\d+)\s*節/);

      if (match) {
        periods.push({
          number: Number(match[1]),
          label: `第${match[1]}節`,
          description: text,
          rowIndex: index,
        });
      }
    });

    return {
      table,
      dates,
      periods,
    };
  }

  // --------------------------------------------------
  // ASP.NET AJAX Delta Response 解析
  // --------------------------------------------------

  function parseDeltaResponse(responseText) {
    const text = responseText.replace(/^\uFEFF/, "");

    const records = [];

    let position = 0;

    while (position < text.length) {
      const lengthEnd = text.indexOf("|", position);

      if (lengthEnd === -1) break;

      const lengthText = text.slice(position, lengthEnd);

      if (!/^\d+$/.test(lengthText)) {
        break;
      }

      const contentLength = Number(lengthText);

      position = lengthEnd + 1;

      const typeEnd = text.indexOf("|", position);

      if (typeEnd === -1) break;

      const type = text.slice(position, typeEnd);

      position = typeEnd + 1;

      const idEnd = text.indexOf("|", position);

      if (idEnd === -1) break;

      const id = text.slice(position, idEnd);

      position = idEnd + 1;

      if (
        !Number.isSafeInteger(contentLength) ||
        contentLength < 0 ||
        position + contentLength > text.length
      ) {
        break;
      }

      const content = text.slice(position, position + contentLength);

      position += contentLength;

      if (text[position] === "|") {
        position++;
      }

      records.push({
        type,
        id,
        content,
      });
    }

    return records;
  }

  // --------------------------------------------------
  // 建立 AJAX 請求狀態
  // --------------------------------------------------

  function createInitialParams() {
    const form = document.querySelector("form");

    if (!form) {
      throw new Error("找不到網站表單");
    }

    const params = new URLSearchParams();

    const formData = new FormData(form);

    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") {
        params.append(key, value);
      }
    }

    return params;
  }

  function updateHiddenFields(params, records) {
    for (const record of records) {
      if (record.type === "hiddenField") {
        params.set(record.id, record.content);
      }
    }
  }

  // --------------------------------------------------
  // 單一琴房 AJAX 查詢
  // --------------------------------------------------

  async function queryRoom(params, room) {
    const requestParams = new URLSearchParams(params);

    // 設定琴房類型
    requestParams.set(
      "ctl00$ContentPlaceHolder1$DropDownList_RoomType",
      "琴房",
    );

    // 設定實際琴房代碼
    requestParams.set(
      "ctl00$ContentPlaceHolder1$DropDownList_Room",
      room.value,
    );

    // ASP.NET AJAX UpdatePanel 設定
    requestParams.set(SCRIPT_MANAGER, `${UPDATE_PANEL_ID}|${SEARCH_TARGET}`);

    // 真正觸發查詢的按鈕
    requestParams.set("__EVENTTARGET", SEARCH_TARGET);
    requestParams.set("__EVENTARGUMENT", "");
    requestParams.set("__ASYNCPOST", "true");

    const response = await fetch(
      document.querySelector("form").action || location.href,
      {
        method: "POST",
        credentials: "same-origin",

        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",

          "X-MicrosoftAjax": "Delta=true",
          "X-Requested-With": "XMLHttpRequest",
          Accept: "*/*",
        },

        body: requestParams.toString(),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const responseText = await response.text();

    const records = parseDeltaResponse(responseText);

    if (!records.length) {
      throw new Error("無法解析 AJAX 回應：" + responseText.slice(0, 100));
    }

    const serverError = records.find((record) => record.type === "error");

    if (serverError) {
      throw new Error(serverError.content);
    }

    // 更新 ASP.NET 隱藏欄位狀態
    updateHiddenFields(params, records);

    // 找出真正的 UpdatePanel HTML
    const panelRecord = records.find(
      (record) =>
        record.type === "updatePanel" && record.id === UPDATE_PANEL_ID,
    );

    if (!panelRecord) {
      throw new Error(
        "回應中找不到 UpdatePanel：" + records.map((r) => r.type).join(", "),
      );
    }

    const doc = new DOMParser().parseFromString(
      panelRecord.content,
      "text/html",
    );

    // --------------------------------------------------
    // 確認伺服器真的切換到目標琴房
    // --------------------------------------------------

    const returnedRoomSelect = getRoomSelect(doc);

    const returnedRoomValue = returnedRoomSelect?.value;

    const roomTitle = cleanText(
      doc.getElementById("ctl00_ContentPlaceHolder1_Label_AtomInfo"),
    );

    const roomConfirmed =
      returnedRoomValue === room.value || roomTitle.includes(room.name);

    if (!roomConfirmed) {
      throw new Error(
        `房間切換驗證失敗。預期：${room.name}，` +
          `實際代碼：${returnedRoomValue || "未知"}，` +
          `標題：${roomTitle || "未知"}`,
      );
    }

    // 確認課表存在
    const schedule = getScheduleInfo(doc);

    return {
      doc,
      schedule,
      room,
    };
  }

  // --------------------------------------------------
  // 讀取指定日期及節次
  // --------------------------------------------------

  function getAvailability(result, selectedDate, selectedPeriod) {
    const { schedule, room } = result;

    const dateEntry = schedule.dates.find((item) => item.date === selectedDate);

    if (!dateEntry) {
      throw new Error(`找不到日期 ${selectedDate}`);
    }

    const periodEntry = schedule.periods.find(
      (item) => item.number === Number(selectedPeriod),
    );

    if (!periodEntry) {
      throw new Error(`找不到第 ${selectedPeriod} 節`);
    }

    const row = schedule.table.rows[periodEntry.rowIndex];

    const cell = row.cells[dateEntry.index];

    if (!cell) {
      throw new Error("找不到對應課表儲存格");
    }

    const bookingLink = Array.from(cell.querySelectorAll("a[href]")).find(
      (anchor) =>
        /Apply\.aspx/i.test(anchor.href) &&
        cleanText(anchor).includes("可預約"),
    );

    if (!bookingLink) {
      return null;
    }

    return {
      roomName: room.name,
      roomValue: room.value,
      date: selectedDate,
      period: periodEntry.label,
      href: new URL(bookingLink.getAttribute("href"), location.href).href,
    };
  }

  // --------------------------------------------------
  // UI 樣式
  // --------------------------------------------------

  function addStyles() {
    if (document.getElementById("tut-piano-room-search-style")) return;

    const style = document.createElement("style");

    style.id = "tut-piano-room-search-style";

    style.textContent = `
            #${PANEL_ID} {
                position: fixed !important;

                /* 固定在左側 */
                left: 15px !important;
                right: auto !important;
                bottom: 20px !important;

                /* 自動適應手機寬度 */
                width: 360px;
                max-width: calc(100vw - 30px);

                /* 限制高度，允許內部捲動 */
                max-height: 75vh;
                overflow-y: auto;
                overflow-x: hidden;

                /* 確保不被網站其他元素遮住 */
                z-index: 2147483647 !important;

                background: #fff;
                color: #252525;
                border: 1px solid #ccc;
                border-radius: 12px;
                padding: 16px;
                box-shadow: 0 5px 25px rgba(0,0,0,.25);
                font-family: sans-serif;
                font-size: 14px;

                box-sizing: border-box;
            }



            #${PANEL_ID} * {
                box-sizing: border-box;
            }

            #${PANEL_ID} .tut-title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 12px;
            }

            #${PANEL_ID} label {
                display: block;
                margin: 10px 0 5px;
                font-weight: bold;
            }

            #${PANEL_ID} select,
            #${PANEL_ID} button {
                width: 100%;
                padding: 9px;
                border-radius: 6px;
                border: 1px solid #bbb;
                font-size: 14px;
            }

            #${PANEL_ID} button {
                margin-top: 12px;
                background: #563d7c;
                color: white;
                border: none;
                cursor: pointer;
                font-weight: bold;
            }

            #${PANEL_ID} button:disabled {
                opacity: .5;
                cursor: wait;
            }

            #${PANEL_ID} .tut-status {
                margin-top: 12px;
                line-height: 1.6;
                overflow-wrap: anywhere;
            }

            #${PANEL_ID} .tut-result {
                padding: 10px;
                margin-top: 8px;
                border: 1px solid #ddd;
                border-radius: 7px;
                line-height: 1.6;
            }

            #${PANEL_ID} .tut-result a {
                color: #563d7c;
                font-weight: bold;
            }

            #${PANEL_ID} .tut-error {
                color: #b42318;
            }

            #${PANEL_ID} .tut-success {
                color: #18794e;
            }

            #${PANEL_ID} .tut-muted {
                color: #777;
                font-size: 12px;
            }

            #${PANEL_ID} .tut-close {
                float: right;
                width: auto;
                padding: 3px 8px;
                margin: 0;
                background: #777;
            }
        `;

    document.head.appendChild(style);
  }

  // --------------------------------------------------
  // 建立查詢面板
  // --------------------------------------------------

  function createPanel() {
    const roomType = getRoomTypeSelect();

    const roomSelect = getRoomSelect();

    if (!roomType || roomType.value !== "琴房" || !roomSelect) {
      return;
    }

    let schedule;

    try {
      schedule = getScheduleInfo(document);
    } catch {
      return;
    }

    if (!schedule.dates.length || !schedule.periods.length) {
      return;
    }

    // 建立目前課表的識別碼
    const scheduleKey = JSON.stringify({
      dates: schedule.dates.map((item) => item.date),
      periods: schedule.periods.map((item) => item.number),
    });

    // 檢查舊面板
    const oldPanel = document.getElementById(PANEL_ID);

    // 如果課表沒有變化，就不必重新建立
    if (oldPanel && oldPanel.dataset.scheduleKey === scheduleKey) {
      return;
    }

    // 保存原本選擇的節次
    const previousPeriod = oldPanel?.querySelector(".tut-period-select")?.value;

    // 課表已經改變，移除舊面板
    if (oldPanel) {
      oldPanel.remove();
    }

    addStyles();

    const panel = document.createElement("div");

    panel.id = PANEL_ID;
    panel.dataset.scheduleKey = scheduleKey;

    const title = document.createElement("div");
    title.className = "tut-title";
    title.textContent = "🎹 琴房空堂批次查詢";

    const close = document.createElement("button");
    close.className = "tut-close";
    close.textContent = "×";

    close.addEventListener("click", () => {
      panel.remove();
    });

    title.appendChild(close);
    panel.appendChild(title);

    const dateLabel = document.createElement("label");
    dateLabel.textContent = "選擇日期";

    const dateSelect = document.createElement("select");

    schedule.dates.forEach((item) => {
      const option = document.createElement("option");

      option.value = item.date;
      option.textContent = item.date;

      dateSelect.appendChild(option);
    });

    const periodLabel = document.createElement("label");
    periodLabel.textContent = "選擇節次";

    const periodSelect = document.createElement("select");
    periodSelect.className = "tut-period-select";

    schedule.periods.forEach((item) => {
      const option = document.createElement("option");

      option.value = item.number;
      option.textContent = item.description;

      periodSelect.appendChild(option);
    });

    // 如果新的一週仍有原本的節次，就保留選擇
    if (
      previousPeriod &&
      schedule.periods.some((item) => String(item.number) === previousPeriod)
    ) {
      periodSelect.value = previousPeriod;
    }

    const searchButton = document.createElement("button");
    searchButton.textContent = "搜尋所有琴房";

    const status = document.createElement("div");
    status.className = "tut-status";
    status.textContent = `已讀取 ${getRooms().length} 間琴房，等待查詢。`;

    const results = document.createElement("div");

    dateLabel.appendChild(dateSelect);
    periodLabel.appendChild(periodSelect);

    panel.appendChild(dateLabel);
    panel.appendChild(periodLabel);
    panel.appendChild(searchButton);
    panel.appendChild(status);
    panel.appendChild(results);

    document.body.appendChild(panel);

    searchButton.addEventListener("click", async () => {
      if (searching) return;

      const selectedDate = dateSelect.value;
      const selectedPeriod = periodSelect.value;

      await startSearch({
        searchButton,
        status,
        results,
        selectedDate,
        selectedPeriod,
      });
    });
  }

  // --------------------------------------------------
  // 批次搜尋
  // --------------------------------------------------

  async function startSearch({
    searchButton,
    status,
    results,
    selectedDate,
    selectedPeriod,
  }) {
    if (searching) return;

    searching = true;

    searchButton.disabled = true;
    searchButton.textContent = "查詢中……";

    results.replaceChildren();

    const rooms = getRooms();

    if (!rooms.length) {
      status.textContent = "找不到琴房選項。";
      searching = false;
      searchButton.disabled = false;
      searchButton.textContent = "搜尋所有琴房";
      return;
    }

    let params;

    try {
      params = createInitialParams();
    } catch (error) {
      status.textContent = error.message;
      searching = false;
      searchButton.disabled = false;
      searchButton.textContent = "搜尋所有琴房";
      return;
    }

    const available = [];
    const errors = [];

    status.textContent = `準備查詢 ${rooms.length} 間琴房……`;

    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i];

      status.textContent =
        `查詢進度：${i + 1} / ${rooms.length}\n` + `目前琴房：${room.name}`;

      try {
        const result = await queryRoom(params, room);

        const availability = getAvailability(
          result,
          selectedDate,
          selectedPeriod,
        );

        if (availability) {
          available.push(availability);
        }
      } catch (error) {
        console.error(`[琴房查詢失敗] ${room.name}`, error);

        errors.push({
          room: room.name,
          message: error.message,
        });
      }

      // 稍微間隔，避免連續請求過快
      await sleep(250);
    }

    // --------------------------------------------------
    // 顯示結果
    // --------------------------------------------------

    status.textContent =
      `查詢完成！\n` +
      `日期：${selectedDate}\n` +
      `節次：第 ${selectedPeriod} 節\n` +
      `總琴房數：${rooms.length}\n` +
      `可預約：${available.length} 間\n` +
      `查詢失敗：${errors.length} 間`;

    if (available.length > 0) {
      const heading = document.createElement("h4");

      heading.textContent = `找到 ${available.length} 間可預約琴房`;

      results.appendChild(heading);

      available.forEach((item) => {
        const box = document.createElement("div");

        box.className = "tut-result";

        const name = document.createElement("strong");
        name.textContent = item.roomName;

        const br = document.createElement("br");

        const period = document.createElement("span");
        period.textContent = `${item.date}｜${item.period}`;

        const link = document.createElement("a");
        link.href = item.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "前往預約頁面";

        box.appendChild(name);
        box.appendChild(br);
        box.appendChild(period);
        box.appendChild(document.createElement("br"));
        box.appendChild(link);

        results.appendChild(box);
      });
    } else {
      const empty = document.createElement("div");

      empty.className = "tut-result";
      empty.textContent =
        errors.length === 0
          ? "目前沒有找到可預約的琴房。"
          : "沒有找到可預約琴房，但部分查詢失敗，請先檢查錯誤。";

      results.appendChild(empty);
    }

    // 顯示失敗房間，方便除錯
    if (errors.length > 0) {
      const errorHeading = document.createElement("h4");

      errorHeading.className = "tut-error";
      errorHeading.textContent = `查詢失敗的琴房（${errors.length}）`;

      results.appendChild(errorHeading);

      errors.forEach((item) => {
        const box = document.createElement("div");

        box.className = "tut-result tut-error";

        const name = document.createElement("strong");
        name.textContent = item.room;

        const message = document.createElement("div");
        message.className = "tut-muted";
        message.textContent = item.message;

        box.appendChild(name);
        box.appendChild(message);

        results.appendChild(box);
      });
    }

    searchButton.disabled = false;
    searchButton.textContent = "重新搜尋";

    searching = false;
  }

  // --------------------------------------------------
  // 等待使用者選擇琴房及課表載入
  // --------------------------------------------------

  function initialize() {
    createPanel();
  }

  const observer = new MutationObserver(() => {
    initialize();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  initialize();
})();