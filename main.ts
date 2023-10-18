import {
	App,
	Command,
	Plugin,
	PluginSettingTab,
	SearchComponent,
	setIcon,
	Setting,
	Menu,
	ButtonComponent,
	MenuItem,
} from "obsidian";

import {
	KeyChord,
	keySequenceEqual,
	codeToString,
	keySequencePartiallyEqual,
} from "keys";
import { HotkeyManager } from "hotkey-manager";
import { ChordListener } from "./src/chord_listener";
import { changeFilter, changeFilterOption, FilterOption, store } from "./store";

interface Hotkey {
	command: string;
	chords: KeyChord[];
}

const hotkeysEqual = (a: Hotkey, b: Hotkey): boolean =>
	a.command === b.command && keySequenceEqual(a.chords, b.chords);

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

const commandName = (app: any, id: string): string | undefined =>
	allCommands(app).find((c: Command) => c.id === id)?.name;

const hotkeysForCommand = (s: SequenceHotkeysSettings, id: string): Hotkey[] =>
	s.hotkeys.filter((h: Hotkey) => h.command === id);

export default class SequenceHotkeysPlugin extends Plugin {
	settings: SequenceHotkeysSettings;
	saveListener: ((s: SequenceHotkeysSettings) => void) | undefined;
	hotkeyManager: HotkeyManager;
	chordListener: ChordListener;

	async onload() {
		this.hotkeyManager = new HotkeyManager((id: string) =>
			(this.app as any).commands.executeCommandById(id)
		);

		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SequenceHotkeysSettingTab(this.app, this));

		this.chordListener = new ChordListener((chord: KeyChord) => {
			if (!!(this.app as any).setting.activeTab) {
				return false;
			}
			return this.hotkeyManager.handleChordPress(chord);
		});
	}

	onunload() {
		this.chordListener.destruct();
	}

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
				h.command != commandId || !keySequenceEqual(h.chords, chords)
		);
		this._settingsUpdated();
	};
}

class SequenceHotkeysSettingTab extends PluginSettingTab {
	plugin: SequenceHotkeysPlugin;
	// A list of the CommandSetting elements
	commandSettingEls: Array<CommandSetting>;
	// The element showing how many shortcuts are visible
	descEl: HTMLDivElement;

	filterOptionDiv: HTMLDivElement;
	menuItems: { [id: string]: MenuItem } = {};

	// Callback to unsubscribe from the redux store
	unsubscribe: () => void;

	constructor(app: App, plugin: SequenceHotkeysPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.commandSettingEls = new Array<CommandSetting>();
	}

	hasCommands = (cs: CommandSetting) => {
		const hotkeys = hotkeysForCommand(
			this.plugin.settings,
			cs.getCommand().id
		);
		return hotkeys.length > 0;
	};

	render = () => {
		const state = store.getState();

		this.filterOptionDiv.setText(state.filterOption);

		Object.keys(this.menuItems).forEach((k) => {
			this.menuItems[k].setActive(k === state.filterOption);
		});

		// Hide/show the command settings based on the filter value.
		const filterParts = state.filter.toLowerCase().split(" ");
		this.commandSettingEls.map((cs: CommandSetting) => {
			const matchesFilter = filterParts.every((part) =>
				cs.getCommand().name.toLowerCase().contains(part)
			);
			let assignedFilter = true;
			if (state.filterOption === "Assigned") {
				assignedFilter = this.hasCommands(cs);
			} else if (state.filterOption === "Unassigned") {
				assignedFilter = !this.hasCommands(cs);
			}
			cs.settingEl.toggle(matchesFilter && assignedFilter);
		});

		this.updateDescription();
	};

	updateDescription = () => {
		this.descEl.setText(
			`Showing ${
				this.commandSettingEls.filter((e: CommandSetting) =>
					e.settingEl.isShown()
				).length
			} hotkeys.`
		);
	};

	// Run every time the settings page is closed
	hide(): void {
		this.unsubscribe();
		this.commandSettingEls.map((s) => s.hide());
	}

	// Run every time the settings page is opened
	display(): void {
		this.unsubscribe = store.subscribe(this.render);

		const { containerEl } = this;
		containerEl.empty();

		const searchBar = new Setting(containerEl);
		const title = searchBar.infoEl.createDiv();
		title.addClass("setting-item-name");
		title.setText("Search hotkeys");
		this.descEl = searchBar.infoEl.createDiv();
		this.descEl.addClass("setting-item-description");

		const filterMenu = new Menu();
		["All", "Assigned", "Unassigned"].forEach((o: FilterOption) => {
			filterMenu.addItem((i: MenuItem) => {
				i.setTitle(o);
				i.onClick(() => {
					store.dispatch(changeFilterOption(o));
				});
				this.menuItems[o] = i;
			});
		});

		this.filterOptionDiv = searchBar.controlEl.createDiv();
		this.filterOptionDiv.addClass("setting-item-description");
		const filterButton = new ButtonComponent(searchBar.controlEl);
		filterButton.setClass("clickable-icon");
		filterButton.setIcon("lucide-filter");
		filterButton.onClick((e: MouseEvent) => {
			filterMenu.showAtPosition({ x: e.pageX, y: e.pageY });
		});

		const searchEl = new SearchComponent(searchBar.controlEl);
		searchEl.setPlaceholder("Filter...");
		searchEl.onChange((s: string) => store.dispatch(changeFilter(s)));

		const spacer = containerEl.createDiv();
		spacer.addClass("setting-filter-container");

		const commandsContainer = containerEl.createDiv();

		this.commandSettingEls = allCommands(this.app).map(
			(command: Command) =>
				new CommandSetting(
					commandsContainer,
					command,
					this.plugin.addHotkey,
					this.plugin.deleteHotkey
				)
		);

		const updateCommands = (s: SequenceHotkeysSettings) => {
			this.commandSettingEls.map((cs: CommandSetting) => {
				const hotkeys: CommandSettingHotkey[] = hotkeysForCommand(
					s,
					cs.getCommand().id
				).map((h: Hotkey) => {
					const conflict = s.hotkeys.find(
						(shc: Hotkey) =>
							!hotkeysEqual(shc, h) &&
							keySequencePartiallyEqual(shc.chords, h.chords)
					);
					return {
						chords: h.chords,
						warning: !!conflict
							? `This hotkey conflicts with "${commandName(
									this.app,
									conflict.command
							  )}"`
							: "",
					};
				});
				cs.display(hotkeys);
			});
		};

		this.plugin.setSaveListener(updateCommands);

		// Update the command with the current setting's hotkeys
		updateCommands(this.plugin.settings);

		this.render();

		// Focus on the search input
		searchEl.inputEl.focus();
	}
}

interface CommandSettingHotkey {
	chords: KeyChord[];
	warning: string;
}

class CommandSetting extends Setting {
	command: Command;
	onCreated: (id: string, chords: KeyChord[]) => void;
	onDelete: (id: string, chords: KeyChord[]) => void;

	cancelCapture: (() => void) | undefined;

	constructor(
		containerEl: HTMLElement,
		command: Command,
		onCreated: (id: string, chords: KeyChord[]) => void,
		onDelete: (id: string, chords: KeyChord[]) => void
	) {
		super(containerEl);
		this.command = command;
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

	display = (hotkeys: CommandSettingHotkey[]) => {
		this.clear();

		this.setName(this.command.name);

		const hotkeyDiv = this.controlEl.createDiv({
			cls: "setting-command-hotkeys",
		});

		for (const hotkey of hotkeys) {
			const warnClass = !!hotkey.warning ? " has-conflict" : "";
			const hotkeySpan = hotkeyDiv.createSpan({
				cls: "setting-hotkey" + warnClass,
				attr: { "aria-label": hotkey.warning },
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
				this.onDelete(this.command.id, hotkey.chords);
			});
		}

		const addBtn = this.controlEl.createSpan({
			cls: "setting-add-hotkey-button",
			attr: { "aria-label": "Customize this command" },
		});
		setIcon(addBtn, "any-key", 22);

		addBtn.onClickEvent(() => {
			const newHotkeySpan = hotkeyDiv.createSpan({
				cls: "setting-hotkey",
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
			this.setCancelCapture(chordCapturer.destruct);

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
	chordListener: ChordListener;
	chords: KeyChord[];
	onUpdate: (cs: KeyChord[]) => void;
	onComplete: (cs: KeyChord[]) => void;

	constructor(
		onUpdate: (cs: KeyChord[]) => void,
		onComplete: (cs: KeyChord[]) => void
	) {
		this.chords = new Array<KeyChord>();
		this.onUpdate = onUpdate;
		this.onComplete = onComplete;

		this.chordListener = new ChordListener((c: KeyChord): boolean => {
			if (
				!c.alt &&
				!c.ctrl &&
				!c.shift &&
				!c.meta &&
				(c.key === "Enter" || c.key === "Escape")
			) {
				this.destruct();
				if (c.key === "Enter") {
					this.onComplete(this.chords);
				}
				return true;
			}

			this.pushChord(c);
			return true;
		});
	}

	pushChord = (c: KeyChord) => {
		this.chords.push(c);
		this.onUpdate(this.chords);
	};

	destruct = () => {
		this.chordListener.destruct();
	};
}
