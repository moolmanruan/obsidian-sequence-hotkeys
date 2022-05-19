import { KeyChord } from "./keys";

interface Registration {
	id: string;
	chords: KeyChord[];
}

function arrayStartsWith(arr: string[], start: string[]): boolean {
	if (start.length > arr.length) {
		return false;
	}
	return start.every((_, i: number) => arr[i] === start[i]);
}

export class HotkeyManager {
	triggerHandler: (id: string) => void;
	registeredHotkeys: Registration[];

	currentSequence: KeyChord[];

	constructor(triggerHandler: (id: string) => void) {
		this.triggerHandler = triggerHandler;
		this.registeredHotkeys = [];
		this.currentSequence = [];
	}

	handleChordPress = (chord: KeyChord): boolean => {
		this.currentSequence.push(chord);

		const css = this.currentSequence.map((c) => c.toString());
		let hotkeys = this.registeredHotkeys.filter((r: Registration) => {
			const rcs = r.chords.map((c) => c.toString());
			return arrayStartsWith(rcs, css);
		});

		if (hotkeys.length === 0) {
			this.currentSequence = [];
			return false;
		}

		let exactMatch = hotkeys.find((r: Registration) => {
			// Current chord is already a subset of all hotkeys after filtering
			// above, so if length matches, it's an exact match.
			return css.length === r.chords.length;
		});
		if (exactMatch) {
			this.currentSequence = [];
			this.triggerHandler(hotkeys[0].id);
		}
		return true;
	};

	reset = () => {
		this.registeredHotkeys = [];
	};
	addHotkey = (id: string, chords: KeyChord[]) => {
		this.registeredHotkeys.push({ id, chords });
	};
	removeHotkey = (id: string) => {
		this.registeredHotkeys = this.registeredHotkeys.filter(
			(r) => r.id !== id
		);
	};
}
