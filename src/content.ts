// メインスクリプト
import { html, render } from "lit-html";
import "./public/style.css";

import Darkmode from "darkmode-js";
import { scheduleDB } from "./scheduleDB";

function normalizeUrl(url: string | null): string {
	if (!url) return "";
	const trimmedUrl = url.trim();
	if (/^https?:\/\//i.test(trimmedUrl) || trimmedUrl.startsWith("//")) {
		return trimmedUrl;
	}
	if (
		!trimmedUrl.startsWith("/") &&
		!trimmedUrl.startsWith("./") &&
		!trimmedUrl.startsWith("../") &&
		trimmedUrl.includes(".")
	) {
		return "https://" + trimmedUrl;
	}
	return trimmedUrl;
}

type Options = {
	sideMenu: boolean;
	pdfDialog: boolean;
	timetableButton: boolean;
	headerName: boolean;
	themeButton: boolean;
	noticeFold: boolean;
	taskList: boolean;
	taskListSubmitted: boolean;
	addSchedule: boolean;
	deleteWorkRule: boolean;
	autoLogin: boolean;
};

type OptionsStorage = {
	[K in keyof Options]: "0" | "1"; // 0: false, 1: true
};

function storageToOptions(storage: Partial<OptionsStorage>): Partial<Options> {
	const result: Partial<Options> = {};
	for (const key in storage) {
		if (Object.hasOwn(storage, key)) {
			result[key as keyof Options] =
				storage[key as keyof OptionsStorage] === "1";
		}
	}
	return result;
}

function optionsToStorage(options: Options): OptionsStorage {
	const result: Partial<OptionsStorage> = {};
	for (const key in options) {
		if (Object.hasOwn(options, key)) {
			result[key as keyof Options] = options[key as keyof Options] ? "1" : "0";
		}
	}
	return result as OptionsStorage;
}

chrome.storage.local.get("options", async (raw) => {
	const initialOptions: Options = {
		sideMenu: true,
		pdfDialog: true,
		timetableButton: true,
		headerName: true,
		themeButton: true,
		noticeFold: true,
		taskList: true,
		taskListSubmitted: true,
		addSchedule: true,
		deleteWorkRule: true,
		autoLogin: false,
	};
	const options: Options = {
		...initialOptions,
		...storageToOptions((raw.options as Partial<OptionsStorage>) ?? {}),
	};
	chrome.storage.local.set({ options: optionsToStorage(options) });
	console.log(options);

	// Initialize IndexedDB and migrate data
	try {
		await scheduleDB.init();
		await scheduleDB.migrateFromChromeStorage();
	} catch (error) {
		console.error("Failed to initialize scheduleDB:", error);
	}

	if (options.autoLogin && window.location.pathname.includes("login")) {
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
			if (options.themeButton) {
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
			if (options.pdfDialog) preventPdfDialog();
		}
	};

	function preventPdfDialog() {
		const files = document.querySelectorAll("*:has(> .link-txt.downloadFile)");
		if (files == null) return;
		files.forEach((file) => {
			const fileNameDiv = file.querySelector(".fileName");
			const objectNameDiv = file.querySelector(".objectName");
			if (fileNameDiv != null && objectNameDiv != null) {
				const fileName = fileNameDiv.textContent;
				if (!fileName.includes(".pdf")) return;
				const oldLink = file.querySelector(".link-txt.downloadFile");
				if (oldLink == null) return;
				const name = oldLink.textContent;
				const objectName = objectNameDiv.textContent;
				const reportId = (
					document.querySelector('[name="reportId"]') as HTMLInputElement
				).value;
				const idnumber = (
					document.querySelector('[name="idnumber"]') as HTMLInputElement
				).value;
				const newLink = document.createElement("a");
				newLink.href = `https://utol.ecc.u-tokyo.ac.jp/lms/course/report/submission_preview/${fileName}?reportId=${reportId}&idnumber=${idnumber}&downloadFileName=${name}&objectName=${objectName}&downloadMode=`;
				newLink.textContent = name;
				newLink.target = "_blank";
				newLink.classList.add("new-pdf-link");
				file
					.querySelector(".link-txt.downloadFile")
					?.classList.add("pdf-link-hide");
				file.prepend(newLink);
			}
		});
	}

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

	async function showSchedule() {
		// 変更を加える要素
		const timetableContents = document.querySelector(
			".div-table.contents-detail",
		);

		if (!isTimetable || (isTimetable && timetableContents != null)) {
			clearInterval(timetableContentsInitCheckTimer);
			showScheduleFlag = true;
			// 登録されているスケジュールを表示
			if (timetableContents != null && options.addSchedule) {
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
				const getSearchParams = (param: string) => {
					const searchParams = new URLSearchParams(window.location.search);
					return searchParams.get(param);
				};
				// 時間割の表示タイプ
				const displayMode = getSearchParams("selectDisplayMode") ?? "";
				const isTimetableDisplay = displayMode === "" || displayMode === "0";
				const weekMonthToggle = document.querySelector(
					".timetable-today-btn-area a",
				)?.textContent;
				const isWeeklyDisplay =
					displayMode === "1" && weekMonthToggle === "月表示";
				const isMonthlyDisplay =
					displayMode === "1" && weekMonthToggle === "週表示";
				// 時間割の対象期間
				const today = new Date();
				const selectedYear = (
					isTimetableDisplay
						? (document.querySelector(
								"#nendo option[selected]",
							) as HTMLSelectElement)
						: (document
								.getElementsByName("selectNendo")[0]
								.querySelector("option[selected]") as HTMLOptionElement)
				).value;
				const selectedSemester = isTimetableDisplay
					? (
							document.querySelector(
								"#kikanCd option[selected]",
							) as HTMLSelectElement
						).textContent
					: semester[
							Number(
								(
									document
										.getElementsByName("selectMonth")[0]
										.querySelector("option[selected]") as HTMLOptionElement
								).value,
							) - 1
						];
				const targetPeriod = {
					year:
						selectedYear === "" ? today.getFullYear() : Number(selectedYear),
					semester:
						selectedSemester === ""
							? semester[today.getMonth()]
							: selectedSemester,
				};

				try {
					const schedules = await scheduleDB.getAllSchedules();
					schedules.forEach((s) => {
						if (
							s.year !== targetPeriod.year ||
							(!targetPeriod.semester.includes(s.period) && s.period !== "X")
						)
							return;
						console.log(s);
						let target: Element, addDOM: HTMLDivElement;
						if (isTimetableDisplay) {
							const timeIndex = Number(s.time);
							const dayIndex = Number(s.day);

							// Verify the DOM element exists before accessing it
							const tbody = timetableContents.children[0];
							if (
								!tbody ||
								!tbody.children[timeIndex] ||
								!tbody.children[timeIndex].children[dayIndex]
							) {
								return;
							}

							target = tbody.children[timeIndex].children[dayIndex];
							addDOM = document.createElement("div");
							addDOM.dataset.day = String(s.day);
							addDOM.dataset.time = String(s.time);
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
								!timetableContents.querySelectorAll(".div-table-data-row")[0]
							) {
								return;
							}
							// For weekly display, use timetableContents directly (different structure)
							const tbody = timetableContents.children[0];
							if (
								!tbody ||
								!tbody.children[Number(s.time) + 1] ||
								!tbody.children[Number(s.time) + 1].children[Number(s.day) + 1]
							) {
								return;
							}
							target =
								tbody.children[Number(s.time) + 1].children[Number(s.day) + 1];
							addDOM = document.createElement("div");
							addDOM.dataset.day = String(s.day);
							addDOM.dataset.time = String(s.time);
							addDOM.classList.add("clearfix");
							const title = document.createElement("div");
							title.classList.add("calendar-course-list", "bold-txt", "break");
							const toFullWidth = (str: string) => {
								return str.replace(/[A-Za-z0-9]/g, function (s) {
									return String.fromCharCode(s.charCodeAt(0) + 0xfee0);
								});
							};
							title.innerHTML = `<div class="bold-txt" style="cursor: pointer;">${toFullWidth(
								String(s.time),
							)}時限 ${s.title}</div>`;
							addDOM.appendChild(title);
						} else if (isMonthlyDisplay) {
							// For monthly display, select date cells directly (TD elements, not DIV)
							// Use attribute selector because class names start with numbers (1-yobicol, 2-yobicol, etc.)
							const selector = `.div-table-data-row > td[class*="${Number(s.day)}-yobicol"]:has(> span)`;
							const targets = timetableContents.querySelectorAll(selector);
							targets.forEach((target) => {
								addDOM = document.createElement("div");
								addDOM.dataset.day = String(s.day);
								addDOM.dataset.time = String(s.time);
								addDOM.classList.add("clearfix");
								const title = document.createElement("div");
								title.classList.add(
									"calendar-course-list",
									"bold-txt",
									"break",
								);
								const toFullWidth = (str: string) => {
									return str.replace(/[A-Za-z0-9]/g, function (s) {
										return String.fromCharCode(s.charCodeAt(0) + 0xfee0);
									});
								};
								title.innerHTML = `<div class="bold-txt" style="cursor: pointer;">${toFullWidth(
									String(s.time),
								)}時限 ${s.title}</div>`;
								addDOM.appendChild(title);
								addDOM!.addEventListener("click", (e) => {
									showScheduleDialog(
										(e.currentTarget as HTMLElement).dataset.day!,
										(e.currentTarget as HTMLElement).dataset.time!,
									);
								});
								target!.appendChild(addDOM!);
							});
							return;
						} else return;
						addDOM!.addEventListener("click", (e) => {
							showScheduleDialog(
								(e.currentTarget as HTMLElement).dataset.day!,
								(e.currentTarget as HTMLElement).dataset.time!,
							);
						});
						target!.appendChild(addDOM!);
					});
				} catch (error) {
					console.error("Failed to load schedules:", error);
				}
			}
		}
	}

	function showScheduleDeleteDialog(day: number, time: number, title: string) {
		const el = document.createElement("div");
		el.tabIndex = -1;
		el.role = "dialog";
		el.classList.add(
			"ui-dialog",
			"ui-corner-all",
			"ui-widget",
			"ui-widget-content",
			"ui-front",
			"schedule-dialog",
		);
		el.setAttribute("aria-describedby", "progress_dialog");
		el.setAttribute("aria-labelledby", "ui-id-1");
		const titleBar = document.createElement("div");
		titleBar.setAttribute(
			"style",
			"margin: 7.5px 15px; padding: 7.5px 0; font-size: 15px; text-align: center; font-weight: bold; background-color: #96c1ea;",
		);
		titleBar.innerHTML = "予定を削除";
		const content = document.createElement("div");
		content.classList.add("schedule-dialog-content");
		content.innerHTML = `<span style="font-weight: bold; margin-top: 15px;">${title}</span><span>を削除してもよろしいですか？</span>`;
		const buttons = document.createElement("div");
		buttons.setAttribute(
			"style",
			"display: flex; justify-content: center; margin-top: 15px;",
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
		deleteButton.addEventListener("click", async () => {
			try {
				await scheduleDB.deleteSchedule(day, time);
				document.querySelector(".schedule-dialog")!.remove();
				document.querySelector(".schedule-dialog-overlay")!.remove();
				window.location.reload();
			} catch (error) {
				console.error("Failed to delete schedule:", error);
				alert("予定の削除に失敗しました");
			}
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
			"schedule-dialog-overlay",
		);
		el2.style.zIndex = "100";
		document.body.appendChild(el2);
	}

	async function showScheduleDialog(day: string, time: string) {
		const el = document.createElement("div");
		el.tabIndex = -1;
		el.role = "dialog";
		el.classList.add(
			"ui-dialog",
			"ui-corner-all",
			"ui-widget",
			"ui-widget-content",
			"ui-front",
			"schedule-dialog",
		);
		el.setAttribute("aria-describedby", "progress_dialog");
		el.setAttribute("aria-labelledby", "ui-id-1");
		const titleBar = document.createElement("div");
		titleBar.classList.add("schedule-dialog-title");
		titleBar.setAttribute(
			"style",
			"margin: 7.5px 15px; padding: 7.5px 0; font-size: 15px; text-align: center; font-weight: bold; background-color: #96c1ea;",
		);
		titleBar.innerHTML = "予定詳細";

		try {
			const scheduleData = await scheduleDB.getSchedule(
				parseInt(day),
				parseInt(time),
			);

			if (!scheduleData) {
				console.error("Schedule not found");
				return;
			}

			// URLが設定されている場合は直接リダイレクト
			const url = scheduleData.url;
			if (url) {
				window.open(url, "_blank") || window.location.replace(url);
				return;
			}

			const content = document.createElement("div");
			content.classList.add("schedule-dialog-content");
			render(
				html`
				<div class="schedule-item-list">
        <div class="schedule-item">
          <div class="schedule-item-title">タイトル</div>
          <div class="schedule-item-content">${scheduleData.title}</div>
        </div>
        <div class="schedule-item">
          <div class="schedule-item-title">内容</div>
          <div class="schedule-item-content">${scheduleData.content}</div>
        </div>
        ${
					scheduleData.url
						? `
          <div class="schedule-item">
            <div class="schedule-item-title">URL</div>
            <div class="schedule-item-content">
              <a href="${normalizeUrl(scheduleData.url)}" target="_blank">${scheduleData.url}</a>
            </div>
          </div>`
						: ""
				}
      </div>
		`,
				content,
			);
			const buttons = document.createElement("div");
			buttons.setAttribute(
				"style",
				"display: flex; justify-content: center; margin-top: 15px;",
			);
			const deleteButton = document.createElement("input");
			deleteButton.type = "button";
			deleteButton.classList.add("schedule-dialog-btn");
			deleteButton.value = "この予定を削除";
			deleteButton.addEventListener("click", () => {
				document.querySelector(".schedule-dialog")!.remove();
				document.querySelector(".schedule-dialog-overlay")!.remove();
				showScheduleDeleteDialog(
					parseInt(day),
					parseInt(time),
					scheduleData.title,
				);
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
				"schedule-dialog-overlay",
			);
			el2.style.zIndex = "100";
			document.body.appendChild(el2);
		} catch (error) {
			console.error("Failed to load schedule:", error);
		}
	}

	function showAddScheduleModal() {
		// Semester configuration
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
		const semesterId: { [key: string]: number } = {
			S: 1,
			S1: 2,
			S2: 3,
			A: 4,
			A1: 5,
			A2: 6,
			W: 7,
		};
		const today = new Date();
		const todayYear = today.getFullYear();
		const todayMonth = today.getMonth() + 1;
		const todaySemester = semester[todayMonth - 1];

		// Create modal overlay
		const overlay = document.createElement("div");
		overlay.classList.add(
			"ui-widget-overlay",
			"ui-front",
			"schedule-dialog-overlay",
		);
		overlay.style.zIndex = "100";

		// Create modal dialog
		const modal = document.createElement("div");
		modal.tabIndex = -1;
		modal.role = "dialog";
		modal.classList.add(
			"ui-dialog",
			"ui-corner-all",
			"ui-widget",
			"ui-widget-content",
			"ui-front",
			"schedule-dialog",
			"add-schedule-modal",
		);
		modal.setAttribute("aria-describedby", "add_schedule_dialog");
		modal.setAttribute("aria-labelledby", "ui-id-add-schedule");

		// Title bar
		const titleBar = document.createElement("div");
		titleBar.classList.add("schedule-dialog-title");
		titleBar.setAttribute(
			"style",
			"margin: 7.5px 15px; padding: 7.5px 0; font-size: 15px; text-align: center; font-weight: bold; background-color: #96c1ea;",
		);
		titleBar.innerHTML = "予定を登録";

		// Content area
		const content = document.createElement("div");
		content.classList.add("schedule-dialog-content", "add-schedule-form");
		render(
			html`
			<div class="schedule-form-row">
				<label class="schedule-form-label" for="modal-scheduleTitle">タイトル</label>
				<input type="text" id="modal-scheduleTitle" class="schedule-form-input" maxlength="50" />
			</div>
			<div class="schedule-form-row">
				<label class="schedule-form-label" for="modal-scheduleContent">内容</label>
				<textarea id="modal-scheduleContent" class="schedule-form-input" rows="5"></textarea>
			</div>
			<div class="schedule-form-row">
				<label class="schedule-form-label">年度・時期</label>
				<div class="schedule-form-inline">
					<select id="modal-scheduleYear" class="schedule-form-select"></select>
					<select id="modal-schedulePeriod" class="schedule-form-select">
						<option value="S">S</option>
						<option value="S1">S1</option>
						<option value="S2">S2</option>
						<option value="A">A</option>
						<option value="A1">A1</option>
						<option value="A2">A2</option>
						<option value="W">W</option>
						<option value="X">通年</option>
					</select>
				</div>
			</div>
			<div class="schedule-form-row">
				<label class="schedule-form-label">曜日・時限</label>
				<div class="schedule-form-inline">
					<select id="modal-scheduleDay" class="schedule-form-select">
						<option value="1">月曜日</option>
						<option value="2">火曜日</option>
						<option value="3">水曜日</option>
						<option value="4">木曜日</option>
						<option value="5">金曜日</option>
						<option value="6">土曜日</option>
					</select>
					<select id="modal-scheduleTime" class="schedule-form-select">
						<option value="1">１時限</option>
						<option value="2">２時限</option>
						<option value="3">３時限</option>
						<option value="4">４時限</option>
						<option value="5">５時限</option>
						<option value="6">６時限</option>
						<option value="7">７時限</option>
					</select>
				</div>
			</div>
			<div class="schedule-form-row">
				<label class="schedule-form-label" for="modal-scheduleUrl">URL (任意)</label>
				<input type="text" id="modal-scheduleUrl" class="schedule-form-input" placeholder="https://example.com" />
			</div>
		`,
			content,
		);

		// Populate year dropdown
		const yearSelect = content.querySelector(
			"#modal-scheduleYear",
		) as HTMLSelectElement;
		for (let i = 0; i < 4; i++) {
			const option = document.createElement("option");
			option.value = `${todayYear - i}`;
			option.textContent = `${todayYear - i}年度`;
			yearSelect.appendChild(option);
		}

		// Set default semester
		const periodSelect = content.querySelector(
			"#modal-schedulePeriod",
		) as HTMLSelectElement;
		periodSelect.selectedIndex = semesterId[todaySemester] - 1;

		// Buttons
		const buttons = document.createElement("div");
		buttons.setAttribute(
			"style",
			"display: flex; justify-content: center; margin-top: 15px; gap: 15px; align-self: flex-end;",
		);

		const cancelButton = document.createElement("input");
		cancelButton.type = "button";
		cancelButton.classList.add("schedule-dialog-btn");
		cancelButton.value = "キャンセル";
		cancelButton.addEventListener("click", () => {
			modal.remove();
			overlay.remove();
		});

		const addButton = document.createElement("input");
		addButton.type = "button";
		addButton.classList.add("schedule-dialog-btn");
		addButton.value = "追加";
		addButton.addEventListener("click", async () => {
			const title = (
				document.querySelector("#modal-scheduleTitle") as HTMLInputElement
			).value;
			const content = (
				document.querySelector("#modal-scheduleContent") as HTMLTextAreaElement
			).value;
			const year = Number(
				(document.querySelector("#modal-scheduleYear") as HTMLSelectElement)
					.value,
			);
			const period = (
				document.querySelector("#modal-schedulePeriod") as HTMLSelectElement
			).value;
			const day = Number(
				(document.querySelector("#modal-scheduleDay") as HTMLSelectElement)
					.value,
			);
			const time = Number(
				(document.querySelector("#modal-scheduleTime") as HTMLSelectElement)
					.value,
			);
			const urlInput = (
				document.querySelector("#modal-scheduleUrl") as HTMLInputElement
			).value;
			const url = normalizeUrl(urlInput);

			if (!title.trim()) {
				alert("タイトルを入力してください");
				return;
			}

			const data = {
				title,
				content,
				year,
				period,
				day,
				time,
				url: normalizeUrl(url) || null,
			};

			try {
				await scheduleDB.saveSchedule(day, time, data);
				modal.remove();
				overlay.remove();
				window.location.reload();
			} catch (error) {
				console.error("Failed to save schedule:", error);
				alert("予定の保存に失敗しました");
			}
		});

		buttons.appendChild(cancelButton);
		buttons.appendChild(addButton);
		content.appendChild(buttons);

		modal.appendChild(titleBar);
		modal.appendChild(content);

		document.body.appendChild(overlay);
		document.body.appendChild(modal);
	}

	function showSettingsModal() {
		// Create modal overlay
		const overlay = document.createElement("div");
		overlay.classList.add(
			"ui-widget-overlay",
			"ui-front",
			"settings-dialog-overlay",
		);
		overlay.style.zIndex = "100";

		// Create modal dialog
		const modal = document.createElement("div");
		modal.tabIndex = -1;
		modal.role = "dialog";
		modal.classList.add(
			"ui-dialog",
			"ui-corner-all",
			"ui-widget",
			"ui-widget-content",
			"ui-front",
			"settings-dialog",
			"settings-modal",
		);
		modal.setAttribute("aria-describedby", "settings_dialog");
		modal.setAttribute("aria-labelledby", "ui-id-settings");

		// Title bar
		const titleBar = document.createElement("div");
		titleBar.classList.add("settings-dialog-title");
		titleBar.setAttribute(
			"style",
			"margin: 7.5px 15px; padding: 7.5px 0; font-size: 15px; text-align: center; font-weight: bold; background-color: #96c1ea;",
		);
		titleBar.innerHTML = "設定";

		// Content area
		const content = document.createElement("div");
		content.classList.add("settings-dialog-content", "settings-form");
		const settingsItem = (name: string, label: string) => {
			return html`
				<div class="settings-item">
					<div class="settings-item-title">${label}</div>
					<div class="settings-item-content">
						<input type="checkbox" class="settings-checkbox" name="${name}">
					</div>
				</div>
			`;
		};

		render(
			html`
			<div class="settings-item-list">
				<div class="settings-item settings-section-header">
					基本機能
				</div>
				${settingsItem("sideMenu", "サイドメニューの非表示")}
				${settingsItem("pdfDialog", "PDFダイアログの非表示")}
				${settingsItem("timetableButton", "時間割ボタンの表示")}
				${settingsItem("headerName", "名前の非表示")}
				${settingsItem("themeButton", "テーマ切替ボタンの表示")}
				${settingsItem("noticeFold", "「お知らせ」を折りたたむ")}
				${settingsItem("taskList", "課題一覧を表示")}
				${settingsItem("taskListSubmitted", "課題一覧の提出済課題を非表示")}
				${settingsItem("addSchedule", "予定の追加機能")}
				${settingsItem("deleteWorkRule", "「ワークルール入門」の削除")}
				<div class="settings-item settings-section-header">
					試験的機能
				</div>
				${settingsItem("autoLogin", "自動ログイン")}
			</div>
		`,
			content,
		);
		// Load current settings
		chrome.storage.local.get("options", (raw) => {
			const storedOptions = (raw.options as Partial<OptionsStorage>) ?? {};
			content.querySelectorAll(".settings-checkbox").forEach((checkbox) => {
				const _checkbox = checkbox as HTMLInputElement;
				const name = _checkbox.name as keyof Options;
				const value = storedOptions[name]; // 0: false, 1: true
				_checkbox.checked = value === "1";
			});
		});

		// Buttons
		const buttons = document.createElement("div");
		buttons.setAttribute(
			"style",
			"display: flex; justify-content: center; margin-top: 15px; gap: 15px; align-self: flex-end;",
		);

		const cancelButton = document.createElement("input");
		cancelButton.type = "button";
		cancelButton.classList.add("settings-dialog-btn");
		cancelButton.value = "キャンセル";
		cancelButton.addEventListener("click", () => {
			modal.remove();
			overlay.remove();
		});

		const saveButton = document.createElement("input");
		saveButton.type = "button";
		saveButton.classList.add("settings-dialog-btn");
		saveButton.value = "保存";
		saveButton.addEventListener("click", () => {
			const updatedOptions: Partial<Options> = {};
			content.querySelectorAll(".settings-checkbox").forEach((checkbox) => {
				const _checkbox = checkbox as HTMLInputElement;
				const name = _checkbox.name as keyof Options;
				updatedOptions[name] = _checkbox.checked;
			});

			chrome.storage.local.get("options", (raw) => {
				const currentOptions: Options = {
					...initialOptions,
					...storageToOptions((raw.options as Partial<OptionsStorage>) ?? {}),
				};
				const mergedOptions: Options = {
					...currentOptions,
					...updatedOptions,
				};
				chrome.storage.local.set(
					{ options: optionsToStorage(mergedOptions) },
					() => {
						modal.remove();
						overlay.remove();
						window.location.reload();
					},
				);
			});
		});

		buttons.appendChild(cancelButton);
		buttons.appendChild(saveButton);
		content.appendChild(buttons);

		modal.appendChild(titleBar);
		modal.appendChild(content);

		document.body.appendChild(overlay);
		document.body.appendChild(modal);
	}

	function sideMenuLoaded() {
		// 変更を加える要素
		const sideMenu = document.querySelector("#sidemenu");
		const pageMain = document.querySelector("#pageMain");

		if (sideMenu != null && pageMain != null) {
			clearInterval(sideMenuInitCheckTimer);
			sideMenuFlag = true;

			// サイドメニューを隠す
			if (options.sideMenu) {
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
			if (emgHeader != null && options.noticeFold) {
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
			if (impHeader != null && options.noticeFold) {
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
			"#page_head.page-head .page-head-navi",
		);

		if (header != null || header2 != null) {
			clearInterval(headerInitCheckTimer);
			headerFlag = true;

			// 「時間割」ボタンの追加
			if (options.timetableButton) {
				const timetableIconURL = chrome.runtime.getURL(
					"images/head_icon_timetable.png",
				);
				const timetableButton = document.createElement(
					header != null ? "li" : "div",
				);
				timetableButton.classList.add(
					...(header == null ? ["header-timetable2"] : []),
					"header-timetable",
				);
				render(
					html`
						<a href="https://utol.ecc.u-tokyo.ac.jp/lms/timetable?selectDisplayMode=0" class="btn-header-info">
							<span class="header-new-icon" style="background-color: transparent; border-color: transparent;"></span>
							<img class="header-img" src="${timetableIconURL}" alt="時間割">
						</a>
					`,
					timetableButton,
				);
				header != null
					? header.appendChild(timetableButton)
					: header2!.before(timetableButton);
			}

			// 「設定」ボタンの追加
			const settingsButton = document.createElement(
				header != null ? "li" : "div",
			);
			settingsButton.classList.add(
				...(header == null ? ["header-timetable2"] : []),
				"header-timetable",
			);
			render(
				html`
					<a href="javascript:void(0)" class="btn-header-info btn-header-settings">
						<span class="header-new-icon" style="background-color: transparent; border-color: transparent;"></span>
						<img class="header-img" src="${chrome.runtime.getURL("images/utol_mod_logo.png")}" alt="設定">
					</a>
				`,
				settingsButton,
			);
			header != null
				? header.appendChild(settingsButton)
				: header2!.before(settingsButton);

			// 設定ボタンのクリックイベント
			document
				.querySelector(".btn-header-settings")
				?.addEventListener("click", (e) => {
					e.preventDefault();
					showSettingsModal();
				});
		}
	}

	function otherCourseLoaded() {
		// 変更を加える要素
		const otherCourse = document.querySelector(".timetable-other-course");

		if (!isTimetable || (isTimetable && otherCourse != null)) {
			clearInterval(otherCourseInitCheckTimer);
			otherCourseFlag = true;
			// 「ワークルール〜」を非表示
			if (otherCourse != null && options.deleteWorkRule) {
				const otherCourses = otherCourse.querySelectorAll(
					".div-table-cell-row",
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
			"#selectTimetable .timetable-color",
		);

		if (!isTimetable || (isTimetable && timetableBar != null)) {
			clearInterval(timetableBarInitCheckTimer);
			timetableBarFlag = true;
			if (timetableBar != null && options.addSchedule) {
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
					showAddScheduleModal();
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

			if (options.taskList) {
				fetch("https://utol.ecc.u-tokyo.ac.jp/lms/task")
					.then((response) => response.text())
					.then((data) => {
						const taskDOM = new DOMParser().parseFromString(data, "text/html");
						const taskTable = taskDOM.querySelector(".block.clearfix");
						taskTable!
							.querySelectorAll(
								".contents-display-flex.contents-display-flex-exchange-sp.sortBlock.result_list_line",
							)
							.forEach((task) => {
								if (
									task.querySelector(".contents-hidden.status")!.textContent ===
										"1" &&
									options.taskListSubmitted
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
			if (options.timetableButton) {
				pageTopButton.classList.add("page-top-btn-hide");
			}
		}
	}

	function headerNameLoaded() {
		// 変更を加える要素
		const headerName = document.querySelector(
			".page-head-navi-list .page-head-userinfo",
		);
		const headerName2 = document.querySelector(
			".page-head-navi-list .header-user-name",
		);

		if (headerName != null || headerName2 != null) {
			clearInterval(headerNameInitCheckTimer);
			headerNameFlag = true;

			// ヘッダーの名前を削除
			if (options.headerName) {
				(headerName ?? headerName2!).classList.add("page-head-userinfo-hide");
			}
		}
	}

	// Listen for messages from popup
	chrome.runtime.onMessage.addListener(
		(
			message: { action: string },
			_sender: chrome.runtime.MessageSender,
			sendResponse: (response?: unknown) => void,
		) => {
			if (message.action === "openSettings") {
				showSettingsModal();
				sendResponse({ success: true });
			}
			return true;
		},
	);
});
