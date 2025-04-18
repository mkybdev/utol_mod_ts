import "./options.css";
import { getOptions } from "../model/options";

window.addEventListener("load", async () => {
	const options = await getOptions();
	(document.body as HTMLElement).style.maxWidth = `${screen.width / 3}px`;
	const contentBlock = document.querySelector(".block-contents");
	const titleBlock = document.querySelector(".block-title");
	if (contentBlock && titleBlock) {
		const height = contentBlock.clientHeight;
		(titleBlock as HTMLElement).style.height = `${height}px`;
	}

	for (const element of document.querySelectorAll(".input")) {
		const name = (element as HTMLSelectElement).name;
		(
			element.querySelector(
				`option[value="${options[name]}"]`,
			) as HTMLOptionElement
		).selected = true;
	}

	const cancelButton = document.querySelector(".cancel-btn");
	if (cancelButton) {
		cancelButton.addEventListener("click", () => {
			window.close();
		});
	}

	const saveButton = document.querySelector(".save-btn");
	if (saveButton) {
		saveButton.addEventListener("click", () => {
			for (const element of document.querySelectorAll(".input")) {
				const name = (element as HTMLSelectElement).name;
				options[name] = (element as HTMLSelectElement).value;
				chrome.storage.local.set({ options: options });
			}
			window.close();
		});
	}
});
