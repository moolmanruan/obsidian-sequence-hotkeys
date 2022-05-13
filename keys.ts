import { Modifier } from "obsidian";

const CODE_CHAR_MAP = new Map<string, string>([
	["Control", "⌃"],
	["ControlLeft", "⌃"],
	["ControlRight", "⌃"],
	["Alt", "⌥"],
	["AltLeft", "⌥"],
	["AltRight", "⌥"],
	["Shift", "⇧"],
	["ShiftLeft", "⇧"],
	["ShiftRight", "⇧"],
	["Meta", "⌘"],
	["MetaLeft", "⌘"],
	["MetaRight", "⌘"],
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
	["Minus", "-"],
	["Equal", "="],
	["Escape", "Esc"],
	["BracketLeft", "["],
	["BracketRight", "]"],
	["Semicolon", ";"],
	["Quote", "'"],
	["Comma", ","],
	["Period", "."],
	["Slash", "/"],
	["ArrowLeft", "Left"],
	["ArrowRight", "Right"],
	["ArrowUp", "Up"],
	["ArrowDown", "Down"],
	["Backquote", "`"],
	["CapsLock", "⇪"],
]);

const codeToChar = (e: string): string => CODE_CHAR_MAP.get(e) || e;

export const isModifier = (key: string): boolean => {
	switch (key) {
		case "Control":
		case "Alt":
		case "Shift":
		case "Meta":
		case "ControlLeft":
		case "AltLeft":
		case "ShiftLeft":
		case "MetaLeft":
		case "ControlRight":
		case "AltRight":
		case "ShiftRight":
		case "MetaRight":
			return true;
		default:
			return false;
	}
};

export const isEscape = (e: KeyboardEvent): boolean =>
	e.code === "Escape" &&
	e.altKey === false &&
	e.ctrlKey === false &&
	e.metaKey === false &&
	e.shiftKey === false;

export class KeyChord {
	meta: boolean;
	ctrl: boolean;
	alt: boolean;
	shift: boolean;
	key: string; // KeyboardEvent.code

	constructor(input: KeyboardEvent | string) {
		// If one checks `input instanceof KeyboardEvent` the jest tests fail
		// with `ReferenceError: KeyboardEvent is not defined`.
		if (typeof input === "string") {
			const parts = input.split("-");
			this.key = parts.pop();
			parts.map((p) => {
				switch (p) {
					case "M":
						this.meta = true;
						break;
					case "C":
						this.ctrl = true;
						break;
					case "A":
						this.alt = true;
						break;
					case "S":
						this.shift = true;
						break;
				}
			});
		} else {
			this.key = input.code;
			this.meta = input.metaKey;
			this.ctrl = input.ctrlKey;
			this.alt = input.altKey;
			this.shift = input.shiftKey;
		}
	}

	serialize = (): string => {
		const parts = new Array<string>();
		if (this.meta) {
			parts.push("M");
		}
		if (this.ctrl) {
			parts.push("C");
		}
		if (this.alt) {
			parts.push("A");
		}
		if (this.shift) {
			parts.push("S");
		}
		parts.push(codeToChar(this.key));
		return parts.join("-");
	};

	toString = (): string => {
		const keys = new Array<string>();
		if (this.meta) {
			keys.push("Meta");
		}
		if (this.ctrl) {
			keys.push("Control");
		}
		if (this.alt) {
			keys.push("Alt");
		}
		if (this.shift) {
			keys.push("Shift");
		}
		keys.push(codeToChar(this.key));
		return keys.map(codeToChar).join("");
	};
}
