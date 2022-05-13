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

function arraysEqual(a: string[], b: string[]): boolean {
	if (a.length !== b.length) {
		return false;
	}
	return a.every((_, i: number) => a[i] === b[i]);
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

	handleChordPress = (chord: KeyChord) => {
		this.currentSequence.push(chord);

		const css = this.currentSequence.map((c) => c.toString());
		let hotkeys = this.registeredHotkeys.filter((r: Registration) => {
			const rcs = r.chords.map((c) => c.toString());
			return arrayStartsWith(rcs, css);
		});

		if (hotkeys.length === 0) {
			this.currentSequence = [];
			return;
		}

		let exactMatch = hotkeys.find((r: Registration) => {
			const rcs = r.chords.map((c) => c.toString());
			return arraysEqual(css, rcs);
		});
		if (exactMatch) {
			this.currentSequence = [];
			this.triggerHandler(hotkeys[0].id);
		}
	};

	reset = () => {
		this.registeredHotkeys = [];
	};
	addHotkey = (id: string, chords: KeyChord[]) => {
		this.registeredHotkeys.push({ id, chords });
	};
	removeHotkey = (id: string) => {
		this.registeredHotkeys = this.registeredHotkeys.filter(
			(r) => r.id != id
		);
	};
}
