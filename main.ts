import {
	App,
	Command,
	Plugin,
	PluginSettingTab,
	SearchComponent,
	setIcon,
	Setting,
} from "obsidian";

import { isModifier, KeyChord } from "keys";
import { HotkeyManager } from "hotkey-manager";

interface Hotkey {
	command: string;
	chords: KeyChord[];
}

interface Settings {
	hotkeys: Hotkey[];
}

const DEFAULT_SETTINGS: Settings = {
	hotkeys: Array<Hotkey>(),
};

interface HotkeyData {
	// The command id
	command: string;
	// The serialized chords
	chords: string[];
}
interface Data {
	hotkeys: HotkeyData[];
}

const SerializeSettings = (settings: Settings): Data => {
	return {
		hotkeys: settings.hotkeys.map((h) => ({
			command: h.command,
			chords: h.chords.map((c) => c.serialize()),
		})),
	};
};
const DeserializeSettings = (data: Data): Settings => {
	let settings = DEFAULT_SETTINGS;
	if (data?.hotkeys) {
		settings.hotkeys = data.hotkeys.map((h) => ({
			command: h.command,
			chords: h.chords.map((c) => new KeyChord(c)),
		}));
	}
	return settings;
};

function allCommands(app: any): Command[] {
	return Object.values((app as any).commands.commands);
}

export default class SequenceHotkeysPlugin extends Plugin {
	settings: Settings;
	statusBar: HTMLElement;
	saveListener: ((s: Settings) => void) | undefined;
	hotkeyManager: HotkeyManager;

	async onload() {
		this.hotkeyManager = new HotkeyManager((id: string) =>
			(this.app as any).commands.executeCommandById(id)
		);

		await this.loadSettings();

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		this.statusBar = this.addStatusBarItem();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this));

		this.registerDomEvent(document, "keydown", this.keyDownHandler);
	}

	onunload() {}

	_settingsUpdated = () => {
		this.saveSettings();

		this.hotkeyManager.reset();
		this.settings.hotkeys.map((h) =>
			this.hotkeyManager.addHotkey(h.command, h.chords)
		);
		this.saveListener?.(this.settings);
	};

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DeserializeSettings(await this.loadData())
		);
		this._settingsUpdated();
	}

	async saveSettings() {
		await this.saveData(SerializeSettings(this.settings));
	}

	setSaveListener = (fn: (s: Settings) => void) => {
		this.saveListener = fn;
	};

	keyDownHandler = (event: KeyboardEvent) => {
		if (isModifier(event.code)) {
			return;
		}
		const chord = new KeyChord(event);
		this.statusBar.setText(chord.toString());
		this.hotkeyManager.handleChordPress(chord);
	};

	_clearHotkey = (commandId: string) => {
		this.settings.hotkeys = this.settings.hotkeys.filter(
			(h: Hotkey) => h.command != commandId
		);
	};

	addHotkey = (commandId: string, chords: KeyChord[]) => {
		this._clearHotkey(commandId);
		this.settings.hotkeys = [
			...this.settings.hotkeys,
			{
				command: commandId,
				chords,
			},
		];
		this._settingsUpdated();
	};

	clearHotkey = (commandId: string) => {
		this._clearHotkey(commandId);
		this._settingsUpdated();
	};
}

class CommandSetting extends Setting {
	command: Command;
	onCreated: ((id: string, chords: KeyChord[]) => void) | undefined;
	onReset: ((id: string) => void) | undefined;

	constructor(
		containerEl: HTMLElement,
		command: Command,
		settings: Settings
	) {
		super(containerEl);
		this.command = command;
		this.render(settings);
	}

	getCommand = (): Command => this.command;

	addOnCreated = (
		fn: (id: string, chords: KeyChord[]) => void
	): CommandSetting => {
		this.onCreated = fn;
		return this;
	};

	addOnReset = (fn: (id: string) => void): CommandSetting => {
		this.onReset = fn;
		return this;
	};

	render = (settings: Settings) => {
		this.clear();

		const hotkey = settings.hotkeys.find(
			(h: Hotkey) => h.command === this.command.id
		);

		this.setName(this.command.name);
		const hotkeyDiv = this.controlEl.createDiv({
			cls: "setting-command-hotkeys",
		});

		const hotkeySpan = hotkeyDiv.createSpan({
			text: "Blank",
			cls: "setting-hotkey mod-empty",
		});

		if (hotkey) {
			hotkeySpan.setText(
				hotkey.chords.map((c) => c.toString()).join(" ")
			);
			// This button looks correct, but how do I add a tooltip?
			const resetBtn = this.controlEl.createSpan({
				cls: "setting-add-hotkey-button",
			});
			setIcon(resetBtn, "reset", 22);
			resetBtn.onClickEvent(() => {
				this.onReset?.(this.command.id);
			});
		}
		// This button looks correct, but how do I add a tooltip?
		const addBtn = this.controlEl.createSpan({
			cls: "setting-add-hotkey-button",
		});
		setIcon(addBtn, "any-key", 22);

		addBtn.onClickEvent(() => {
			hotkeySpan.setText("Press hotkey...");
			hotkeySpan.removeClass("mod-empty");
			hotkeySpan.addClass("mod-active");

			const chords = new Array<KeyChord>();
			const handleKeydown = (event: KeyboardEvent) => {
				if (isModifier(event.code)) {
					return;
				}
				chords.push(new KeyChord(event));
				hotkeySpan.setText(chords.map((c) => c.toString()).join(" "));
			};

			document.addEventListener("keydown", handleKeydown);
			document.addEventListener(
				"mousedown",
				(e: MouseEvent) => {
					document.removeEventListener("keydown", handleKeydown);

					if (chords.length) {
						this.onCreated?.(this.command.id, chords);
					}

					hotkeySpan.setText("Blank");
					hotkeySpan.addClass("mod-empty");
					hotkeySpan.removeClass("mod-active");
				},
				{ once: true } // Remove this listener after it is triggered
			);
		});
	};
}

class SettingTab extends PluginSettingTab {
	plugin: SequenceHotkeysPlugin;
	chords: Array<KeyChord>;

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

		allCommands(this.app).map((command: Command) => {
			commandSettings.push(
				new CommandSetting(
					commandsContainer,
					command,
					this.plugin.settings
				)
					.addOnCreated(this.plugin.addHotkey)
					.addOnReset(this.plugin.clearHotkey)
			);
		});

		this.plugin.setSaveListener((s: Settings) => {
			commandSettings.map((cs: CommandSetting) => cs.render(s));
		});

		// Hide/show the command settings based on the filter value.
		searchEl.onChange((filterStr: string) => {
			const filterParts = filterStr.toLowerCase().split(" ");
			commandSettings.map((cs: CommandSetting) =>
				cs.settingEl.toggle(
					filterParts.every((part) =>
						cs.getCommand().name.toLowerCase().contains(part)
					)
				)
			);
		});
	}
}
