import {
	App,
	Command,
	Platform,
	Plugin,
	PluginSettingTab,
	SearchComponent,
	setIcon,
	Setting,
	Menu,
	Hotkey as ObsidianHotkey,
} from "obsidian";

import { isModifier, KeyChord, keyChordListsEqual, codeToString } from "keys";
import { HotkeyManager } from "hotkey-manager";

interface Hotkey {
	command: string;
	chords: KeyChord[];
}

interface SequenceHotkeysSettings {
	hotkeys: Hotkey[];
}

const DEFAULT_SETTINGS: SequenceHotkeysSettings = {
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

const SerializeSettings = (settings: SequenceHotkeysSettings): Data => {
	return {
		hotkeys: settings.hotkeys.map((h) => ({
			command: h.command,
			chords: h.chords.map((c) => c.serialize()),
		})),
	};
};
const DeserializeSettings = (data: Data): SequenceHotkeysSettings => {
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
	const commands: Command[] = Object.values((app as any).commands.commands);
	commands.sort((a: Command, b: Command): number =>
		a.name.localeCompare(b.name)
	);
	return commands;
}

export default class SequenceHotkeysPlugin extends Plugin {
	settings: SequenceHotkeysSettings;
	statusBar: HTMLElement;
	saveListener: ((s: SequenceHotkeysSettings) => void) | undefined;
	hotkeyManager: HotkeyManager;

	async onload() {
		this.hotkeyManager = new HotkeyManager((id: string) =>
			(this.app as any).commands.executeCommandById(id)
		);

		await this.loadSettings();

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		this.statusBar = this.addStatusBarItem();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SequenceHotkeysSettingTab(this.app, this));

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

	setSaveListener = (fn: (s: SequenceHotkeysSettings) => void) => {
		this.saveListener = fn;
	};

	keyDownHandler = (event: KeyboardEvent) => {
		if (!!(this.app as any).setting.activeTab || isModifier(event.code)) {
			return;
		}
		const chord = new KeyChord(event);
		this.statusBar.setText(chord.toString());
		if (this.hotkeyManager.handleChordPress(chord)) {
			// Prevent default if used
			event.preventDefault();
		}
	};

	addHotkey = (commandId: string, chords: KeyChord[] | undefined) => {
		if (chords?.length) {
			this.settings.hotkeys = [
				...this.settings.hotkeys,
				{
					command: commandId,
					chords,
				},
			];
		}
		this._settingsUpdated();
	};

	deleteHotkey = (commandId: string, chords: KeyChord[]) => {
		this.settings.hotkeys = this.settings.hotkeys.filter(
			(h: Hotkey) =>
				h.command != commandId || !keyChordListsEqual(h.chords, chords)
		);
		this._settingsUpdated();
	};
}

const hotkeyToInternal = (hh: ObsidianHotkey[]): KeyChord[] =>
	hh.map((h: ObsidianHotkey): KeyChord => {
		let k = new KeyChord(h.key);
		k.ctrl = h.modifiers.contains("Ctrl");
		k.alt = h.modifiers.contains("Alt");
		k.shift = h.modifiers.contains("Shift");
		k.meta = h.modifiers.contains("Meta");
		if (Platform.isMacOS) {
			k.meta = k.meta || h.modifiers.contains("Mod");
		} else {
			k.ctrl = k.ctrl || h.modifiers.contains("Mod");
		}
		return k;
	});

const defaultCommandKeys = (app: App): Map<string, Array<KeyChord>> => {
	const ret = new Map<string, Array<KeyChord>>();
	Object.entries((app as any).hotkeyManager.defaultKeys).map(([key, val]) => {
		ret.set(key, hotkeyToInternal(val));
	});

	const cmdIDs = allCommands(app).map((c) => c.id);
	const cmdExists = (id: string): boolean =>
		!!cmdIDs.find((cID) => cID === id);

	Object.entries((app as any).hotkeyManager.customKeys).map(([key, val]) => {
		if (val.length === 0 || !cmdExists(key)) {
			ret.delete(key);
			return;
		}
		ret.set(key, hotkeyToInternal(val));
	});

	return ret;
};

class SequenceHotkeysSettingTab extends PluginSettingTab {
	plugin: SequenceHotkeysPlugin;
	chords: Array<KeyChord>;
	filter: string;
	// A list of the CommandSetting elements
	commandSettingEls: Array<CommandSetting>;

	constructor(app: App, plugin: SequenceHotkeysPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.filter = "";
		this.commandSettingEls = new Array<CommandSetting>();
	}

	setFilter = (s: string) => {
		this.filter = s;

		// Hide/show the command settings based on the filter value.
		const filterParts = this.filter.toLowerCase().split(" ");
		this.commandSettingEls.map((cs: CommandSetting) =>
			cs.settingEl.toggle(
				filterParts.every((part) =>
					cs.getCommand().name.toLowerCase().contains(part)
				)
			)
		);
	};

	// Run every time the settings page is closed
	hide(): void {
		this.commandSettingEls.map((s) => s.hide());
	}

	// Run every time the settings page is opened
	display(): void {
		console.log(">>>>>");
		const defKeys = defaultCommandKeys(this.app);
		defKeys.forEach((v, k) => console.log(k + " -> " + v));
		console.log("<<<<<");

		const { containerEl } = this;
		containerEl.empty();

		let searchEl: SearchComponent;
		new Setting(containerEl).addSearch((s: SearchComponent) => {
			searchEl = s;
			s.setPlaceholder("Filter...");
		});
		searchEl.onChange(this.setFilter);

		const commandsContainer = containerEl.createDiv();

		this.commandSettingEls = new Array<CommandSetting>();
		allCommands(this.app).map((command: Command) => {
			this.commandSettingEls.push(
				new CommandSetting(
					commandsContainer,
					command,
					this.plugin.settings,
					this.plugin.addHotkey,
					this.plugin.deleteHotkey
				)
			);
		});

		this.plugin.setSaveListener((s: SequenceHotkeysSettings) => {
			this.commandSettingEls.map((cs: CommandSetting) => cs.display(s));
		});

		// Focus on the search input
		searchEl.inputEl.focus();
	}
}

class CommandSetting extends Setting {
	command: Command;
	onCreated: (id: string, chords: KeyChord[]) => void;
	onDelete: (id: string, chords: KeyChord[]) => void;

	cancelCapture: (() => void) | undefined;

	constructor(
		containerEl: HTMLElement,
		command: Command,
		settings: SequenceHotkeysSettings,
		onCreated: (id: string, chords: KeyChord[]) => void,
		onDelete: (id: string, chords: KeyChord[]) => void
	) {
		super(containerEl);
		this.command = command;
		this.display(settings);
		this.onCreated = onCreated;
		this.onDelete = onDelete;
	}

	getCommand = (): Command => this.command;

	// Should be run to clean up pending event listeners
	hide = () => {
		this.setCancelCapture(undefined);
	};

	setCancelCapture = (cb: (() => void) | undefined) => {
		// Call current callback if it exists before replacing it
		this.cancelCapture?.();
		this.cancelCapture = cb;
	};

	display = (settings: SequenceHotkeysSettings) => {
		this.clear();

		const hotkeys = settings.hotkeys.filter(
			(h: Hotkey) => h.command === this.command.id
		);

		this.setName(this.command.name);

		const hotkeyDiv = this.controlEl.createDiv({
			cls: "setting-command-hotkeys",
		});

		for (const hotkey of hotkeys) {
			const hotkeySpan = hotkeyDiv.createSpan({
				cls: "setting-hotkey mod-empty",
			});
			const hotkeySpanText = hotkeySpan.createSpan({
				text: hotkey.chords.map((c) => c.toString()).join(" ") + " ",
			});
			const deleteBtn = hotkeySpanText.createSpan({
				cls: "setting-hotkey-icon setting-delete-hotkey",
				attr: { "aria-label": "Delete hotkey" },
			});
			setIcon(deleteBtn, "cross", 8);
			deleteBtn.onClickEvent(() => {
				this.onDelete(hotkey.command, hotkey.chords);
			});
		}

		const addBtn = this.controlEl.createSpan({
			cls: "setting-add-hotkey-button",
			attr: { "aria-label": "Customize this command" },
		});
		setIcon(addBtn, "any-key", 22);

		addBtn.onClickEvent(() => {
			const newHotkeySpan = hotkeyDiv.createSpan({
				cls: "setting-hotkey mod-empty",
			});
			const newHotkeySpanText = newHotkeySpan.createSpan({
				text: "Press hotkey...",
			});
			const onUpdate = (chords: KeyChord[]) => {
				newHotkeySpanText.setText(
					chords.map((c) => c.toString()).join(" ")
				);
			};
			const onComplete = (chords: KeyChord[]) => {
				this.setCancelCapture(undefined);
				this.onCreated?.(this.command.id, chords);
			};
			const chordCapturer = new CaptureChord(onUpdate, onComplete);
			this.setCancelCapture(chordCapturer.cancel);

			newHotkeySpan.removeClass("mod-empty");
			newHotkeySpan.addClass("mod-active");

			addBtn.hide();
			const menuBtn = this.controlEl.createSpan({
				cls: "setting-add-hotkey-button",
				attr: {
					"aria-label": `Add ${codeToString(
						"Enter"
					)} or ${codeToString("Escape")} key to sequence`,
				},
			});
			setIcon(menuBtn, "plus", 22);

			const menu = new Menu(menuBtn).setNoIcon();
			menu.addItem((item) =>
				item.setTitle("Add " + codeToString("Enter")).onClick(() => {
					chordCapturer.pushChord(new KeyChord("Enter"));
				})
			);

			menu.addItem((item) =>
				item.setTitle("Add " + codeToString("Escape")).onClick(() => {
					chordCapturer.pushChord(new KeyChord("Escape"));
				})
			);
			menuBtn.onClickEvent((event) => {
				menu.showAtMouseEvent(event);
			});

			const doneBtn = this.controlEl.createSpan({
				cls: "setting-add-hotkey-button",
				attr: {
					"aria-label": "Accept hotkey sequence",
				},
			});
			setIcon(doneBtn, "checkbox-glyph", 22);
			doneBtn.onClickEvent(() => {
				onComplete(chordCapturer.chords);
			});
		});
	};
}

class CaptureChord {
	chords: KeyChord[];
	onUpdate: (cs: KeyChord[]) => void;
	onComplete: (cs: KeyChord[]) => void;
	handleKeydown: (e: KeyboardEvent) => void;

	constructor(
		onUpdate: (cs: KeyChord[]) => void,
		onComplete: (cs: KeyChord[]) => void
	) {
		this.chords = new Array<KeyChord>();
		this.onUpdate = onUpdate;
		this.onComplete = onComplete;

		this.handleKeydown = (event: KeyboardEvent) => {
			event.preventDefault();
			event.stopPropagation();

			if (
				event.altKey === false &&
				event.ctrlKey === false &&
				event.shiftKey === false &&
				event.metaKey === false &&
				(event.code === "Enter" || event.code === "Escape")
			) {
				this.cancel();
				if (event.code === "Enter") {
					this.onComplete(this.chords);
				}
				return;
			}

			if (isModifier(event.code)) {
				return;
			}
			this.pushChord(new KeyChord(event));
		};
		document.addEventListener("keydown", this.handleKeydown);
	}

	pushChord = (c: KeyChord) => {
		this.chords.push(c);
		this.onUpdate(this.chords);
	};

	cancel = () => {
		document.removeEventListener("keydown", this.handleKeydown);
	};
}
