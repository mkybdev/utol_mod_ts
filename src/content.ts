// メインスクリプト
import "./public/style.css";

import Darkmode from "darkmode-js";

chrome.storage.local.get("options", (raw) => {
  let options = raw.options;
  if (options === undefined) {
    options = {
      sideMenu: "0",
      timetableButton: "0",
      headerName: "0",
      themeButton: "0",
      noticeFold: "0",
      taskList: "0",
      taskListSubmitted: "0",
      addSchedule: "0",
      deleteWorkRule: "0",
      autoLogin: "1",
    };
    chrome.storage.local.set({ options: options });
  }
  console.log(options);

  if (options.autoLogin == "0" && window.location.pathname.includes("login")) {
    window.location.href =
      "https://utol.ecc.u-tokyo.ac.jp/saml/login?disco=true";
  }

  const sideMenuInitCheckTimer = setInterval(sideMenuLoaded, 1);
  const emgHeaderInitCheckTimer = setInterval(emgHeaderLoaded, 1);
  const impHeaderInitCheckTimer = setInterval(impHeaderLoaded, 1);
  const headerInitCheckTimer = setInterval(headerLoaded, 1);
  const otherCourseInitCheckTimer = setInterval(otherCourseLoaded, 1);
  const selectTimetableInitCheckTimer = setInterval(selectTimetableLoaded, 1);
  const timetableBarInitCheckTimer = setInterval(timetableBarLoaded, 1);
  const timetableContentsInitCheckTimer = setInterval(showSchedule, 1);
  const pageTopButtonInitCheckTimer = setInterval(pageTopButtonLoaded, 1);
  const headerNameInitCheckTimer = setInterval(headerNameLoaded, 1);

  const currentPath = window.location.pathname;
  const isTimetable = currentPath.includes("timetable");

  let sideMenuFlag = false;
  let headerFlag = false;
  let selectTimetableFlag = false;
  let showScheduleFlag = false;
  let timetableBarFlag = false;
  let otherCourseFlag = false;
  let emgHeaderFlag = false;
  let impHeaderFlag = false;
  let pageTopButtonFlag = false;
  let headerNameFlag = false;

  document.onreadystatechange = () => {
    if (document.readyState === "complete") {
      if (options.themeButton == "0") {
        const options = {
          time: "0s",
          mixColor: "#fff",
          backgroundColor: "#fff",
          buttonColorDark: "#100f2c",
          buttonColorLight: "#fff",
          label: "&#x262f;",
        };
        new Darkmode(options).showWidget();
      }
      clearAll();
      if (!sideMenuFlag) sideMenuLoaded();
      if (!headerFlag) headerLoaded();
      if (!selectTimetableFlag) selectTimetableLoaded();
      if (!showScheduleFlag) showSchedule();
      if (!timetableBarFlag) timetableBarLoaded();
      if (!otherCourseFlag) otherCourseLoaded();
      if (!emgHeaderFlag) emgHeaderLoaded();
      if (!impHeaderFlag) impHeaderLoaded();
      if (!pageTopButtonFlag) pageTopButtonLoaded();
      if (!headerNameFlag) headerNameLoaded();
      // const allElems = document.querySelectorAll("*");
      // allElems.forEach((el) => {
      //   const style = window.getComputedStyle(el);
      //   const color = style.getPropertyValue("color");
      //   const bgColor = style.getPropertyValue("background-color");
      //   if (color != "") {
      //     // console.log(`color: ${color}`);
      //     (el as HTMLElement).classList.add("nodark");
      //   }
      //   if (bgColor != "") {
      //     // console.log(`bgColor: ${bgColor}`);
      //     (el as HTMLElement).classList.add("nodark");
      //   }
      // });
    }
  };

  function clearAll() {
    clearInterval(sideMenuInitCheckTimer);
    clearInterval(headerInitCheckTimer);
    clearInterval(emgHeaderInitCheckTimer);
    clearInterval(impHeaderInitCheckTimer);
    clearInterval(otherCourseInitCheckTimer);
    clearInterval(selectTimetableInitCheckTimer);
    clearInterval(timetableBarInitCheckTimer);
    clearInterval(timetableContentsInitCheckTimer);
    clearInterval(pageTopButtonInitCheckTimer);
    clearInterval(headerNameInitCheckTimer);
  }

  function showSchedule() {
    // 変更を加える要素
    const timetableContents = document.querySelector(
      ".div-table.contents-detail"
    );

    if (!isTimetable || (isTimetable && timetableContents != null)) {
      clearInterval(timetableContentsInitCheckTimer);
      showScheduleFlag = true;
      // 登録されているスケジュールを表示
      if (timetableContents != null && options.addSchedule == "0") {
        const semester = [
          "A2",
          "W",
          "W",
          "S1",
          "S1",
          "S2",
          "S2",
          "S2",
          "S2",
          "A1",
          "A1",
          "A2",
        ];
        // const toSemester = (str: string) => {
        //   switch (str) {
        //     case "0A":
        //       return "S1";
        //     case "0B":
        //       return "S2";
        //     case "0C":
        //       return "A1";
        //     case "0D":
        //       return "A2";
        //     case "0E":
        //       return "W";
        //     default:
        //       return str;
        //   }
        // };
        const getSearchParams = (param: string) => {
          const searchParams = new URLSearchParams(window.location.search);
          return searchParams.get(param);
        };
        // 時間割の表示タイプ
        const displayMode = getSearchParams("selectDisplayMode") ?? "";
        // const calendarMode = getSearchParams("selectCalendarMode") ?? "";
        const isTimetableDisplay = displayMode == "" || displayMode == "0";
        const weekMonthToggle = document.querySelector(
          ".timetable-today-btn-area a"
        )?.textContent;
        const isWeeklyDisplay =
          displayMode == "1" && weekMonthToggle == "月表示";
        const isMonthlyDisplay =
          displayMode == "1" && weekMonthToggle == "週表示";
        // 時間割の対象期間
        const today = new Date();
        const selectedYear = (
          isTimetableDisplay
            ? (document.querySelector(
                "#nendo option[selected]"
              ) as HTMLSelectElement)
            : (document
                .getElementsByName("selectNendo")[0]
                .querySelector("option[selected]") as HTMLOptionElement)
        ).value;
        const selectedSemester = isTimetableDisplay
          ? (
              document.querySelector(
                "#kikanCd option[selected]"
              ) as HTMLSelectElement
            ).textContent
          : semester[
              parseInt(
                (
                  document
                    .getElementsByName("selectMonth")[0]
                    .querySelector("option[selected]") as HTMLOptionElement
                ).value
              ) - 1
            ];
        const targetPeriod = {
          year: selectedYear == "" ? today.getFullYear() : selectedYear,
          semester:
            selectedSemester == ""
              ? semester[today.getMonth()]
              : selectedSemester!,
        };
        console.log(
          `Target Period: ${targetPeriod.year} ${targetPeriod.semester}`
        );
        chrome.storage.local.get(null, (schedule: object) => {
          Object.values(schedule).forEach((s: { [key: string]: any }) => {
            if (
              s.year != targetPeriod.year ||
              (!targetPeriod.semester.includes(s.period) && s.period != "X")
            )
              return;
            console.log(s);
            let target, addDOM;
            if (isTimetableDisplay) {
              target =
                timetableContents.children[parseInt(s.time)].children[
                  parseInt(s.day)
                ];
              addDOM = document.createElement("div");
              addDOM.dataset.day = s.day;
              addDOM.dataset.time = s.time;
              addDOM.classList.add("clearfix");
              const title = document.createElement("div");
              title.classList.add("schedule-title");
              title.innerHTML = s.title;
              const content = document.createElement("div");
              content.classList.add("schedule-detail");
              content.innerHTML = s.content;
              addDOM.appendChild(title);
              addDOM.appendChild(content);
            } else if (isWeeklyDisplay) {
              if (
                timetableContents
                  .querySelectorAll(".div-table-data-row")[0]
                  .querySelector(`div:nth-child(${s.day + 2}):has(span)`) ==
                null
              )
                return;
              target =
                timetableContents.children[s.time + 1].children[s.day + 1];
              addDOM = document.createElement("div");
              addDOM.dataset.day = s.day;
              addDOM.dataset.time = s.time;
              addDOM.classList.add("clearfix");
              const title = document.createElement("div");
              title.classList.add("calendar-course-list", "bold-txt", "break");
              const toFullWidth = (str: string) => {
                return str.replace(/[A-Za-z0-9]/g, function (s) {
                  return String.fromCharCode(s.charCodeAt(0) + 0xfee0);
                });
              };
              title.innerHTML = `<div class="bold-txt" style="cursor: pointer;">${toFullWidth(
                String(s.time)
              )}時限 ${s.title}</div>`;
              addDOM.appendChild(title);
            } else if (isMonthlyDisplay) {
              const targets = timetableContents.querySelectorAll(
                `.div-table-data-row div:nth-child(${s.day + 1}):has(span)`
              );
              targets.forEach((target) => {
                addDOM = document.createElement("div");
                addDOM.dataset.day = s.day;
                addDOM.dataset.time = s.time;
                addDOM.classList.add("clearfix");
                const title = document.createElement("div");
                title.classList.add(
                  "calendar-course-list",
                  "bold-txt",
                  "break"
                );
                const toFullWidth = (str: string) => {
                  return str.replace(/[A-Za-z0-9]/g, function (s) {
                    return String.fromCharCode(s.charCodeAt(0) + 0xfee0);
                  });
                };
                title.innerHTML = `<div class="bold-txt" style="cursor: pointer;">${toFullWidth(
                  String(s.time)
                )}時限 ${s.title}</div>`;
                addDOM.appendChild(title);
                addDOM!.addEventListener("click", (e) => {
                  showScheduleDialog(
                    (e.currentTarget as HTMLElement).dataset.day!,
                    (e.currentTarget as HTMLElement).dataset.time!
                  );
                });
                target!.appendChild(addDOM!);
              });
              return;
            } else return;
            addDOM!.addEventListener("click", (e) => {
              showScheduleDialog(
                (e.currentTarget as HTMLElement).dataset.day!,
                (e.currentTarget as HTMLElement).dataset.time!
              );
            });
            target!.appendChild(addDOM!);
          });
        });
      }
    }
  }

  function showScheduleDeleteDialog(key: string, title: string) {
    const el = document.createElement("div");
    el.tabIndex = -1;
    el.role = "dialog";
    el.classList.add(
      "ui-dialog",
      "ui-corner-all",
      "ui-widget",
      "ui-widget-content",
      "ui-front",
      "schedule-dialog"
    );
    el.setAttribute("aria-describedby", "progress_dialog");
    el.setAttribute("aria-labelledby", "ui-id-1");
    const titleBar = document.createElement("div");
    titleBar.setAttribute(
      "style",
      "margin: 7.5px 15px; padding: 7.5px 0; font-size: 15px; text-align: center; font-weight: bold; background-color: #96c1ea;"
    );
    titleBar.innerHTML = "予定を削除";
    const content = document.createElement("div");
    content.classList.add("schedule-dialog-content");
    content.innerHTML = `<span style="font-weight: bold; margin-top: 15px;">${title}</span><span>を削除してもよろしいですか？</span>`;
    const buttons = document.createElement("div");
    buttons.setAttribute(
      "style",
      "display: flex; justify-content: center; margin-top: 15px;"
    );
    const cancelButton = document.createElement("input");
    cancelButton.type = "button";
    cancelButton.classList.add("schedule-dialog-btn");
    cancelButton.value = "キャンセル";
    cancelButton.addEventListener("click", () => {
      document.querySelector(".schedule-dialog")!.remove();
      document.querySelector(".schedule-dialog-overlay")!.remove();
    });
    buttons.appendChild(cancelButton);
    const deleteButton = document.createElement("input");
    deleteButton.type = "button";
    deleteButton.classList.add("schedule-dialog-btn");
    deleteButton.value = "削除する";
    deleteButton.addEventListener("click", () => {
      chrome.storage.local.remove(key).then(() => {
        document.querySelector(".schedule-dialog")!.remove();
        document.querySelector(".schedule-dialog-overlay")!.remove();
        window.location.reload();
      });
    });
    buttons.appendChild(deleteButton);
    content.appendChild(buttons);
    el.appendChild(titleBar);
    el.appendChild(content);
    document.body.appendChild(el);
    const el2 = document.createElement("div");
    el2.classList.add(
      "ui-widget-overlay",
      "ui-front",
      "schedule-dialog-overlay"
    );
    el2.style.zIndex = "100";
    document.body.appendChild(el2);
  }

  function showScheduleDialog(day: string, time: string) {
    const el = document.createElement("div");
    el.tabIndex = -1;
    el.role = "dialog";
    el.classList.add(
      "ui-dialog",
      "ui-corner-all",
      "ui-widget",
      "ui-widget-content",
      "ui-front",
      "schedule-dialog"
    );
    el.setAttribute("aria-describedby", "progress_dialog");
    el.setAttribute("aria-labelledby", "ui-id-1");
    const titleBar = document.createElement("div");
    titleBar.classList.add("schedule-dialog-title");
    titleBar.setAttribute(
      "style",
      "margin: 7.5px 15px; padding: 7.5px 0; font-size: 15px; text-align: center; font-weight: bold; background-color: #96c1ea;"
    );
    titleBar.innerHTML = "予定詳細";
    const key = `schedule_${day}_${time}`;
    chrome.storage.local.get(key).then((data) => {
      let scheduleData = data[key];
      const content = document.createElement("div");
      content.classList.add("schedule-dialog-content");
      content.innerHTML = ` \
    <div class="schedule-item-list"> \
      <div class="schedule-item"> \
        <div class="schedule-item-title">タイトル</div> \
        <div class="schedule-item-content">${scheduleData.title}</div> \
      </div> \
      <div class="schedule-item"> \
        <div class="schedule-item-title">内容</div> \
        <div class="schedule-item-content">${scheduleData.content}</div> \
      </div> \
    </div> \
  `;
      const buttons = document.createElement("div");
      buttons.setAttribute(
        "style",
        "display: flex; justify-content: center; margin-top: 15px;"
      );
      const deleteButton = document.createElement("input");
      deleteButton.type = "button";
      deleteButton.classList.add("schedule-dialog-btn");
      deleteButton.value = "この予定を削除";
      deleteButton.addEventListener("click", () => {
        document.querySelector(".schedule-dialog")!.remove();
        document.querySelector(".schedule-dialog-overlay")!.remove();
        showScheduleDeleteDialog(key, scheduleData.title);
      });
      buttons.appendChild(deleteButton);
      const closeButton = document.createElement("input");
      closeButton.type = "button";
      closeButton.classList.add("schedule-dialog-btn");
      closeButton.value = "閉じる";
      closeButton.addEventListener("click", () => {
        document.querySelector(".schedule-dialog")!.remove();
        document.querySelector(".schedule-dialog-overlay")!.remove();
      });
      buttons.appendChild(closeButton);
      content.appendChild(buttons);
      el.appendChild(titleBar);
      el.appendChild(content);
      document.body.appendChild(el);
      const el2 = document.createElement("div");
      el2.classList.add(
        "ui-widget-overlay",
        "ui-front",
        "schedule-dialog-overlay"
      );
      el2.style.zIndex = "100";
      document.body.appendChild(el2);
    });
  }

  function sideMenuLoaded() {
    // 変更を加える要素
    const sideMenu = document.querySelector("#sidemenu");
    const pageMain = document.querySelector("#pageMain");

    if (sideMenu != null && pageMain != null) {
      clearInterval(sideMenuInitCheckTimer);
      sideMenuFlag = true;

      // サイドメニューを隠す
      if (options.sideMenu == "0") {
        sideMenu.classList.add("sidemenu-close");
        document.querySelector("#pageMain")!.classList.add("sidemenu-hide");
        document
          .querySelector("#sidemenuOpen")!
          .classList.remove("sidemenu-open");
        document
          .querySelector("#sidemenuOpen")!
          .setAttribute("aria-expanded", "false");
      }
    }
  }

  function emgHeaderLoaded() {
    // 変更を加える要素
    const emgHeader = document.querySelector(".emgHeader");

    if (!isTimetable || (isTimetable && emgHeader != null)) {
      clearInterval(emgHeaderInitCheckTimer);
      emgHeaderFlag = true;
      // 「緊急のお知らせ」をたたむ
      if (emgHeader != null && options.noticeFold == "0") {
        emgHeaderFlag = true;
        emgHeader.classList.add("noticeFold");
        document.querySelector("#emgInformation")!.classList.add("noticeFold");
        emgHeader.addEventListener("click", () => {
          const emgInformation = document.querySelector("#emgInformation");
          emgInformation!.classList.toggle("emgActive");
          emgHeader.classList.toggle("emgActive");
        });
      }
    }
  }

  function impHeaderLoaded() {
    // 変更を加える要素
    const impHeader = document.querySelector(".impHeader");

    if (!isTimetable || (isTimetable && impHeader != null)) {
      clearInterval(impHeaderInitCheckTimer);
      impHeaderFlag = true;
      // 「重要なお知らせ」をたたむ
      if (impHeader != null && options.noticeFold == "0") {
        impHeaderFlag = true;
        impHeader.classList.add("noticeFold");
        document.querySelector("#impInformation")!.classList.add("noticeFold");
        impHeader.addEventListener("click", () => {
          const impInformation = document.querySelector("#impInformation");
          impInformation!.classList.toggle("impActive");
          impHeader.classList.toggle("impActive");
        });
      }
    }
  }

  function headerLoaded() {
    // 変更を加える要素
    const header = document.querySelector(".page-head-notification-area");
    const header2 = document.querySelector(
      "#page_head.page-head .page-head-navi"
    );

    if (header != null || header2 != null) {
      clearInterval(headerInitCheckTimer);
      headerFlag = true;

      // 「時間割」ボタンの追加
      if (options.timetableButton == "0") {
        const timetableIconURL = chrome.runtime.getURL(
          "images/head_icon_timetable.png"
        );
        const timetableButton = document.createElement(
          header != null ? "li" : "div"
        );
        timetableButton.classList.add(
          header != null ? "header-timetable" : "header-timetable2"
        );
        timetableButton.innerHTML = `<a href="https://utol.ecc.u-tokyo.ac.jp/lms/timetable?selectDisplayMode=0" class="btn-header-timetable"><img class="header-img" src="${timetableIconURL}" alt="時間割"></a>`;
        header != null
          ? header.appendChild(timetableButton)
          : header2!.before(timetableButton);
      }
    }
  }

  function otherCourseLoaded() {
    // 変更を加える要素
    const otherCourse = document.querySelector(".timetable-other-course");

    if (!isTimetable || (isTimetable && otherCourse != null)) {
      clearInterval(otherCourseInitCheckTimer);
      otherCourseFlag = true;
      // 「ワークルール〜」を非表示
      if (otherCourse != null && options.deleteWorkRule == "0") {
        const otherCourses = otherCourse.querySelectorAll(
          ".div-table-cell-row"
        );
        otherCourses.forEach((course) => {
          const courseName = course.querySelector(".timetable-course-top-btn");
          if (courseName!.textContent!.includes("ワークルール")) {
            (course as HTMLElement).style.display = "none";
          }
        });
      }
    }
  }

  function timetableBarLoaded() {
    // 変更を加える要素
    const timetableBar = document.querySelector(
      "#selectTimetable .timetable-color"
    );

    if (!isTimetable || (isTimetable && timetableBar != null)) {
      clearInterval(timetableBarInitCheckTimer);
      timetableBarFlag = true;
      if (timetableBar != null && options.addSchedule == "0") {
        const timetableIcon = timetableBar.querySelector(".timetable-icon");
        // アイコンを非表示
        if (timetableIcon != null)
          timetableIcon.classList.add("timetable-icon-hide");
        // 「予定を追加」ボタンを表示
        const addButton = document.createElement("input");
        addButton.type = "button";
        addButton.value = "予定を追加";
        addButton.classList.add("mode-btn", "false", "add-schedule-btn");
        addButton.addEventListener("click", () => {
          let width = window.screen.availWidth * 0.6;
          let height = window.screen.availHeight * 0.6;
          let option = "width=" + width + ", height=" + height;
          if (typeof window.screenX != "undefined") {
            option +=
              ", screenX=" +
              (window.screenX + (window.screen.availWidth - width) / 2) +
              ", screenY=" +
              (window.screenY + (window.screen.availHeight - height) / 2);
          } else if (typeof window.screenLeft != "undefined") {
            option +=
              ", left=" +
              (window.screenLeft + (window.screen.availWidth - width) / 2) +
              ", top=" +
              (window.screenTop + (window.screen.availHeight - height) / 2);
          }
          window.open(
            chrome.runtime.getURL("add_schedule/add_schedule.html"),
            "予定の追加",
            option
          );
          window.addEventListener("message", (event) => {
            const data = event.data;
            const key = `schedule_${data.day}_${data.time}`;
            const obj = { [key]: data };
            chrome.storage.local.set(obj).then(() => {
              chrome.storage.local.get(null, (data) => {
                console.log(data);
              });
              window.location.reload();
            });
          });
        });
        const timetableTitle = timetableBar.querySelector(".timetable-title");
        timetableTitle!.classList.add("addSchedule");
        timetableTitle!.appendChild(addButton);
      }
    }
  }

  async function selectTimetableLoaded() {
    // 変更を加える要素
    const selectTimetable = document.querySelector("#selectTimetable");

    if (isTimetable && selectTimetable != null) {
      clearInterval(selectTimetableInitCheckTimer);
      selectTimetableFlag = true;

      if (options.taskList == "0") {
        fetch("https://utol.ecc.u-tokyo.ac.jp/lms/task")
          .then((response) => response.text())
          .then((data) => {
            const taskDOM = new DOMParser().parseFromString(data, "text/html");
            const taskTable = taskDOM.querySelector(".block.clearfix");
            taskTable!
              .querySelectorAll(
                ".contents-display-flex.contents-display-flex-exchange-sp.sortBlock.result_list_line"
              )
              .forEach((task) => {
                if (
                  task.querySelector(".contents-hidden.status")!.textContent ==
                    "1" &&
                  options.taskListSubmitted == "0"
                )
                  task.classList.add("tasklist-submitted");
              });
            const taskTableWrapper = document.createElement("div");
            taskTableWrapper.classList.add("task-table-wrapper");
            taskTableWrapper.appendChild(taskTable!);
            selectTimetable.before(taskTableWrapper);
          });
      }
    }
  }

  function pageTopButtonLoaded() {
    // 変更を加える要素
    const pageTopButton = document.querySelector(".page-top-btn");

    if (pageTopButton != null) {
      clearInterval(pageTopButtonInitCheckTimer);
      pageTopButtonFlag = true;

      // ページトップボタンを削除
      if (options.timetableButton == "0") {
        pageTopButton.classList.add("page-top-btn-hide");
      }
    }
  }

  function headerNameLoaded() {
    // 変更を加える要素
    const headerName = document.querySelector(
      ".page-head-navi-list .page-head-userinfo"
    );
    const headerName2 = document.querySelector(
      ".page-head-navi-list .header-user-name"
    );

    if (headerName != null || headerName2 != null) {
      clearInterval(headerNameInitCheckTimer);
      headerNameFlag = true;

      // ヘッダーの名前を削除
      if (options.headerName == "0") {
        (headerName ?? headerName2!).classList.add("page-head-userinfo-hide");
      }
    }
  }
});
