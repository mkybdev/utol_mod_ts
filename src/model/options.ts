enum OptionsEnum {
	OFF = 0,
	ON = 1,
}

export const OPTION_OFF = OptionsEnum.OFF;
export const OPTION_ON = OptionsEnum.ON;

export interface Options {
	sideMenu: OptionsEnum;
	pdfDialog: OptionsEnum;
	timetableButton: OptionsEnum;
	headerName: OptionsEnum;
	themeButton: OptionsEnum;
	noticeFold: OptionsEnum;
	taskList: OptionsEnum;
	taskListSubmitted: OptionsEnum;
	addSchedule: OptionsEnum;
	deleteWorkRule: OptionsEnum;
	autoLogin: OptionsEnum;
}

export const getDefaultOptions = (): Options => {
	return {
		sideMenu: OptionsEnum.ON,
		pdfDialog: OptionsEnum.OFF,
		timetableButton: OptionsEnum.ON,
		headerName: OptionsEnum.OFF,
		themeButton: OptionsEnum.OFF,
		noticeFold: OptionsEnum.ON,
		taskList: OptionsEnum.ON,
		taskListSubmitted: OptionsEnum.OFF,
		addSchedule: OptionsEnum.ON,
		deleteWorkRule: OptionsEnum.OFF,
		autoLogin: OptionsEnum.OFF,
	};
};

export const getOptions = async () => {
	const storage = chrome.storage;
	const defaultOptions = getDefaultOptions();
	if (storage) {
		const currentOption = await chrome.storage.local.get("options");
		const options = {
			...defaultOptions,
			...(currentOption.options ?? {}),
		} as Options;
		return options;
	}
	return defaultOptions;
};
