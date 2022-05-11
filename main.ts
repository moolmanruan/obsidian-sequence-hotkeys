import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import { SetShortcutModal } from "src/new-shortcut-dialog";

interface Settings {
	disableDefaultShortcuts: boolean;
}

const DEFAULT_SETTINGS: Settings = {
	disableDefaultShortcuts: false,
};

export default class SequenceShortcutsPlugin extends Plugin {
	settings: Settings;

	async onload() {
		await this.loadSettings();

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// TODO: Show the currently pressed shortcut.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText("*");

		// This adds a simple command that can be triggered anywhere
		// TODO: Implement the add shortcut functionality
		// this.addCommand({
		// 	id: "add-shortcut-sequence",
		// 	name: "Add Shortcut",
		// 	callback: () => {
		// 		new NewShortcutModal(this.app).open();
		// 	},
		// });

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this));
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
}

class SettingTab extends PluginSettingTab {
	plugin: SequenceShortcutsPlugin;

	constructor(app: App, plugin: SequenceShortcutsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", { text: "Sequence Shortcuts Settings" });
		// TODO: Add settings as the features get supported
		// new Setting(containerEl)
		// 	.setName("Disable all default shortcuts")
		// 	.setDesc("Only use the shortcuts defined in this plugin")
		// 	.addToggle((toggle) =>
		// 		toggle
		// 			.setValue(this.plugin.settings.disableDefaultShortcuts)
		// 			.onChange(async (value: boolean) => {
		// 				this.plugin.settings.disableDefaultShortcuts = value;
		// 				await this.plugin.saveSettings();
		// 			})
		// 	);
	}
}
