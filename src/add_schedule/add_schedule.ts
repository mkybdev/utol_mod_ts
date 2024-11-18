// 予定登録のスクリプト
import "./add_schedule.css";

window.addEventListener("load", () => {
  const height = document.querySelector(".block-contents")!.clientHeight;
  (document.querySelector(".block-title") as HTMLElement).style.height =
    height + "px";

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

  const scheduleDaySelect = document.getElementsByName("scheduleYear")[0];
  for (let i = 0; i < 4; i++) {
    const option = document.createElement("option");
    option.value = `${todayYear - i}`;
    option.textContent = todayYear - i + "年度";
    scheduleDaySelect.appendChild(option);
  }
  scheduleDaySelect.setAttribute("selectedIndex", "0");
  document
    .getElementsByName("schedulePeriod")[0]
    .setAttribute("selectedIndex", String(semesterId[todaySemester] - 1));

  document.querySelector(".cancel-btn")!.addEventListener("click", () => {
    window.close();
  });

  document.querySelector(".add-btn")!.addEventListener("click", () => {
    const title = (document.querySelector("#scheduleTitle") as HTMLInputElement).value;
    const content = (document.querySelector("#scheduleContent") as HTMLInputElement).value;
    const year = parseInt(
      (document.getElementsByName("scheduleYear")[0] as HTMLSelectElement).value
    );
    const period = (document.getElementsByName("schedulePeriod")[0] as HTMLSelectElement).value;
    const day = parseInt(
      (document.getElementsByName("scheduleDay")[0] as HTMLSelectElement).value
    );
    const time = parseInt(
      (document.getElementsByName("scheduleTime")[0] as HTMLSelectElement).value
    );
    const url = (document.querySelector("#scheduleUrl") as HTMLInputElement).value;
  
    window.opener.postMessage(
      {
        title,
        content,
        year,
        period,
        day,
        time,
        url: url || null, // URL が空なら null を送る
      },
      "*"
    );
    window.close();
  });  
});
