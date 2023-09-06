import { isModifier, KeyChord } from "../keys";

export class ChordListener {
	// The callback that is invoked when a chord is pressed
	onChord: (cs: KeyChord) => boolean;
	handleKeydown: (e: KeyboardEvent) => void;
	handleKeyup: (e: KeyboardEvent) => void;

	_lastKeydown: KeyboardEvent | undefined;

	constructor(onChord: (cs: KeyChord) => boolean) {
		this.onChord = onChord;

		this.handleKeydown = (event: KeyboardEvent) => {
			// Store the event
			this._lastKeydown = event;

			if (isModifier(event.code)) {
				return;
			}

			this.chordPress(event);
		};

		this.handleKeyup = (event: KeyboardEvent) => {
			// If the chord was not handled yet, because it consists
			// of modifiers only, handle it now.
			this.chordPress(event);
		};
		document.addEventListener("keydown", this.handleKeydown, { capture: true });
		document.addEventListener("keyup", this.handleKeyup, { capture: true });
	}

	chordPress = (event: KeyboardEvent) => {
		if (!!this._lastKeydown) {
			if (this.onChord(new KeyChord(this._lastKeydown))) {
				event.preventDefault();
				event.stopPropagation();
			}
			this._lastKeydown = undefined;
		}
	};

	destruct = () => {
		document.removeEventListener("keydown", this.handleKeydown, { capture: true });
		document.removeEventListener("keyup", this.handleKeyup, { capture: true });
	};
}
