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

	_matchingHotheys = (): Registration[] => {
		const css = this.currentSequence.map((c) => c.toString());
		return this.registeredHotkeys.filter((r: Registration) => {
			const rcs = r.chords.map((c) => c.toString());
			return arrayStartsWith(rcs, css);
		});
	};

	// return: prevent key propagation
	handleChordPress = (chord: KeyChord): boolean => {
		this.currentSequence.push(chord);
		let hotkeys = this._matchingHotheys();

		// If the new has no matches, try matching with a sequence starting with the new chord
		if (hotkeys.length === 0 && this.currentSequence.length > 1) {
			this.currentSequence = [chord];
			hotkeys = this._matchingHotheys();
		}

		// If there are no matches at this point, clear the sequence and let the key through
		if (hotkeys.length === 0) {
			this.currentSequence = [];
			return false;
		}

		let exactMatch = hotkeys.find((r: Registration) => {
			// Current chord is already a subset of all hotkeys after filtering
			// above, so if length matches, it's an exact match.
			return this.currentSequence.length === r.chords.length;
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
