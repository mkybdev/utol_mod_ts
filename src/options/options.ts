// オプション画面のスクリプト
import "./options.css";

window.addEventListener("load", () => {
  chrome.storage.local.get("options", (raw) => {
    const initialOptions = {
      sideMenu: "0",
      pdfDialog: "0",
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
    const options = { ...initialOptions, ...(raw.options ?? {}) };
    chrome.storage.local.set({ options: options });
    console.log(options);

    const width = screen.width;
    (document.body as HTMLElement).style.maxWidth = width / 3 + "px";
    const height = document.querySelector(".block-contents")!.clientHeight;
    (document.querySelector(".block-title") as HTMLElement).style.height =
      height + "px";

    document.querySelectorAll(".input").forEach((element) => {
      const name = (element as HTMLSelectElement).name;
      (
        element.querySelector(
          `option[value="${options[name]}"]`
        ) as HTMLOptionElement
      ).selected = true;
    });

    document.querySelector(".cancel-btn")!.addEventListener("click", () => {
      window.close();
    });

    document.querySelector(".save-btn")!.addEventListener("click", () => {
      document.querySelectorAll(".input").forEach((element) => {
        const name = (element as HTMLSelectElement).name;
        options[name] = (element as HTMLSelectElement).value;
        chrome.storage.local.set({ options: options });
      });
      window.close();
    });
  });
});
