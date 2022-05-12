import { Modifier } from "obsidian";

const CODE_CHAR_MAP = new Map<string, string>([
	["Control", "⌃"],
	["Alt", "⌥"],
	["Shift", "⇧"],
	["Meta", "⌘"],
	["KeyA", "A"],
	["KeyB", "B"],
	["KeyC", "C"],
	["KeyD", "D"],
	["KeyE", "E"],
	["KeyF", "F"],
	["KeyG", "G"],
	["KeyH", "H"],
	["KeyI", "I"],
	["KeyJ", "J"],
	["KeyK", "K"],
	["KeyL", "L"],
	["KeyM", "M"],
	["KeyN", "N"],
	["KeyO", "O"],
	["KeyP", "P"],
	["KeyQ", "Q"],
	["KeyR", "R"],
	["KeyS", "S"],
	["KeyT", "T"],
	["KeyU", "U"],
	["KeyV", "V"],
	["KeyW", "W"],
	["KeyX", "X"],
	["KeyY", "Y"],
	["KeyZ", "Z"],
	["Digit0", "0"],
	["Digit1", "1"],
	["Digit2", "2"],
	["Digit3", "3"],
	["Digit4", "4"],
	["Digit5", "5"],
	["Digit6", "6"],
	["Digit7", "7"],
	["Digit8", "8"],
	["Digit9", "9"],
]);

export interface KeyChord {
	modifiers: Array<string>;
	key: string; // KeyboardEvent.code
}

export const eventToKeyChord = (e: KeyboardEvent): KeyChord => {
	const modifiers = new Array<string>();
	// Follow same ordering of modifiers as the default Obsidian Hotkeys
	if (e.metaKey) {
		modifiers.push("Meta");
	}
	if (e.ctrlKey) {
		modifiers.push("Control");
	}
	if (e.altKey) {
		modifiers.push("Alt");
	}
	if (e.shiftKey) {
		modifiers.push("Shift");
	}
	return { modifiers, key: e.code };
};

const codeChar = (e: string): string => {
	return CODE_CHAR_MAP.get(e) || e;
};

export const isModifier = (key: string): boolean => {
	switch (key) {
		case "Control":
		case "Alt":
		case "Shift":
		case "Meta":
			return true;
		default:
			return false;
	}
};

export const chordString = (c: KeyChord): string => {
	const keys = new Array<string>();
	c.modifiers.map((m) => keys.push(codeChar(m.toString())));
	keys.push(codeChar(c.key));
	return keys.join("");
};
