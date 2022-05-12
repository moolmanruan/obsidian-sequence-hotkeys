import {
	App,
	Command,
	Plugin,
	PluginSettingTab,
	SearchComponent,
	setIcon,
	Setting,
} from "obsidian";

import { chordString, eventToKeyChord, isModifier } from "keys";

interface Settings {
	disableDefaultHotkeys: boolean;
}

const DEFAULT_SETTINGS: Settings = {
	disableDefaultHotkeys: false,
};

export default class SequenceHotkeysPlugin extends Plugin {
	settings: Settings;
	statusBar: HTMLElement;

	async onload() {
		await this.loadSettings();

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		this.statusBar = this.addStatusBarItem();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this));

		this.registerDomEvent(document, "keydown", this.keyDownHandler);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	keyDownHandler = (event: KeyboardEvent) => {
		// event.preventDefault();
		// event.stopPropagation();
		if (isModifier(event.code)) {
			return;
		}
		const chord = eventToKeyChord(event);
		this.statusBar.setText(chordString(chord));
	};
}

function appCommands(app: any): Command[] {
	return Object.values((this.app as any).commands.commands);
}

interface CommandSetting {
	command: Command;
	setting: Setting;
}

class SettingTab extends PluginSettingTab {
	plugin: SequenceHotkeysPlugin;

	constructor(app: App, plugin: SequenceHotkeysPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	// Run every time the settings page is opened
	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		let searchEl: SearchComponent;

		new Setting(containerEl).addSearch((s: SearchComponent) => {
			s.setPlaceholder("Filter...");
			searchEl = s;
		});

		const commandsContainer = containerEl.createDiv();
		const commandSettings = new Array<CommandSetting>();

		appCommands(this.app).map((command: Command) => {
			// let s = new Setting(containerEl)
			// 	.setName(c.name)
			// 	// How do I set the background colour of the button?
			// 	.addButton((b: ButtonComponent) => {
			// 		b.setButtonText("Press any key...");
			// 	})
			// 	// This button can have a tooltip, but how do I make it look like the span in default Hotkeys settings?
			// 	.addExtraButton((b: ExtraButtonComponent) => {
			// 		b.setIcon("any-key");
			// 		b.setTooltip("Customize this command");
			// 	});

			const setting = new Setting(commandsContainer).setName(
				command.name
			);
			const hotkeyDiv = setting.controlEl.createDiv({
				cls: "setting-command-hotkeys",
			});
			const keyBtn = hotkeyDiv.createSpan({
				text: "Blank",
				cls: "setting-hotkey mod-empty",
			});
			// This button looks correct, but how do I add a tooltip?
			const resetBtn = setting.controlEl.createSpan({
				cls: "setting-add-hotkey-button",
			});
			setIcon(resetBtn, "reset", 22);
			// This button looks correct, but how do I add a tooltip?
			const addBtn = setting.controlEl.createSpan({
				cls: "setting-add-hotkey-button",
			});
			setIcon(addBtn, "any-key", 22);
			addBtn.onClickEvent(() => {
				if (keyBtn.hasClass("mod-empty")) {
					keyBtn.removeClass("mod-empty");
					keyBtn.addClass("mod-active");

					keyBtn.setText("Press hotkey...");
				} else {
					keyBtn.removeClass("mod-active");
					keyBtn.addClass("mod-empty");

					keyBtn.setText("Blank");
				}
			});

			commandSettings.push({ command, setting });
		});

		// Hide/show the command settings based on the filter value.
		searchEl.onChange((filterStr: string) => {
			const filterParts = filterStr.toLowerCase().split(" ");
			commandSettings.map((cs: CommandSetting) =>
				cs.setting.settingEl.toggle(
					filterParts.every((part) =>
						cs.command.name.toLowerCase().contains(part)
					)
				)
			);
		});
		// TODO: Add settings as the features get supported
		// new Setting(containerEl)
		// 	.setName("Disable all default hotkeys")
		// 	.setDesc("Only use the hotkeys defined in this plugin")
		// 	.addToggle((toggle) =>
		// 		toggle
		// 			.setValue(this.plugin.settings.disableDefaultHotkeys)
		// 			.onChange(async (value: boolean) => {
		// 				this.plugin.settings.disableDefaultHotkeys = value;
		// 				await this.plugin.saveSettings();
		// 			})
		// 	);
	}
}
