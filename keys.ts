import { Platform } from "obsidian";

const CODE_STR_MAP = new Map<string, string>([
	["Control", "Ctrl-"],
	["ControlLeft", "Ctrl-"],
	["ControlRight", "Ctrl-"],
	["Alt", "Alt-"],
	["AltLeft", "Alt-"],
	["AltRight", "Alt-"],
	["Shift", "Shift-"],
	["ShiftLeft", "Shift-"],
	["ShiftRight", "Shift-"],
	["Meta", "Meta-"],
	["MetaLeft", "Meta-"],
	["MetaRight", "Meta-"],
	["Escape", "Esc"],
	["Enter", "Enter"],
	["CapsLock", "CapsLock"],
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
]);

if (Platform.isMacOS) {
	CODE_STR_MAP.set("Control", "⌃");
	CODE_STR_MAP.set("ControlLeft", "⌃");
	CODE_STR_MAP.set("ControlRight", "⌃");
	CODE_STR_MAP.set("Alt", "⌥");
	CODE_STR_MAP.set("AltLeft", "⌥");
	CODE_STR_MAP.set("AltRight", "⌥");
	CODE_STR_MAP.set("Shift", "⇧");
	CODE_STR_MAP.set("ShiftLeft", "⇧");
	CODE_STR_MAP.set("ShiftRight", "⇧");
	CODE_STR_MAP.set("Meta", "⌘");
	CODE_STR_MAP.set("MetaLeft", "⌘");
	CODE_STR_MAP.set("MetaRight", "⌘");
	CODE_STR_MAP.set("Escape", "⎋");
	CODE_STR_MAP.set("Enter", "⏎");
	CODE_STR_MAP.set("CapsLock", "⇪");
}

export const codeToString = (e: string): string => CODE_STR_MAP.get(e) || e;

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

export const keySequenceEqual = (a: KeyChord[], b: KeyChord[]): boolean =>
	a.length === b.length && a.every((c, i) => c.equals(b[i]));

export const keySequencePartiallyEqual = (
	a: KeyChord[],
	b: KeyChord[]
): boolean => {
	if (a.length === 0 || b.length === 0) {
		// Empty sequence always returns false
		return false;
	}
	if (a.length > b.length) {
		// If a is longer, check that every chord in b matches a
		return b.every((c, i) => c.equals(a[i]));
	}
	// If b is longer, check that every chord in a matches b
	return a.every((c, i) => c.equals(b[i]));
};

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

	equals = (other: KeyChord): boolean => {
		return (
			!!other &&
			this.key === other.key &&
			this.meta === other.meta &&
			this.ctrl === other.ctrl &&
			this.alt === other.alt &&
			this.shift === other.shift
		);
	};

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
		parts.push(codeToString(this.key));
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
		keys.push(codeToString(this.key));
		return keys.map(codeToString).join("");
	};
}
