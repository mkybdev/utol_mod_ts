import "./popup.css";

document.addEventListener("DOMContentLoaded", () => {
	const openSettingsButton = document.getElementById("openSettings");

	openSettingsButton?.addEventListener("click", async () => {
		try {
			// Get the active tab
			const [tab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			});

			if (tab.id) {
				// Send message to content script to open settings modal
				await chrome.tabs.sendMessage(tab.id, { action: "openSettings" });
				// Close the popup
				window.close();
			}
		} catch (error) {
			console.error("Failed to send message:", error);
		}
	});
});
