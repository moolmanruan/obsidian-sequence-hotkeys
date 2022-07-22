import { HotkeyManager } from "./hotkey-manager";
import { KeyChord } from "./keys";

describe("HotkeyManager", () => {
	test("single chord", () => {
		let fn = jest.fn();
		let man = new HotkeyManager(fn);

		man.addHotkey("test-id1", [new KeyChord("C-KeyQ")]);
		man.addHotkey("test-id2", [new KeyChord("C-KeyF")]);

		man.handleChordPress(new KeyChord("C-KeyQ"));
		expect(fn).toHaveBeenLastCalledWith("test-id1");

		man.handleChordPress(new KeyChord("C-KeyF"));
		expect(fn).toHaveBeenLastCalledWith("test-id2");

		expect(fn).toBeCalledTimes(2);
	});

	test("chord sequence", () => {
		let fn = jest.fn();
		let man = new HotkeyManager(fn);

		man.addHotkey("test-id1", [new KeyChord("C-KeyQ")]);
		man.addHotkey("test-id2", [
			new KeyChord("C-KeyW"),
			new KeyChord("C-KeyQ"),
		]);

		man.handleChordPress(new KeyChord("C-KeyW"));
		man.handleChordPress(new KeyChord("C-KeyQ"));
		expect(fn).toBeCalledTimes(1);
		expect(fn).toHaveBeenLastCalledWith("test-id2");

		man.handleChordPress(new KeyChord("C-KeyQ"));
		expect(fn).toBeCalledTimes(2);
		expect(fn).toHaveBeenLastCalledWith("test-id1");
	});

	test("immediately resets sequence on mismatch", () => {
		let fn = jest.fn();
		let man = new HotkeyManager(fn);

		man.addHotkey("test-id1", [new KeyChord("C-KeyQ")]);
		man.addHotkey("test-id2", [
			new KeyChord("C-KeyW"),
			new KeyChord("C-KeyN"),
		]);

		man.handleChordPress(new KeyChord("C-KeyW")); // start test-id2 sequence
		man.handleChordPress(new KeyChord("C-KeyQ")); // restarts and matches test-id1 sequence
		expect(fn).toBeCalledTimes(1);
		expect(fn).toHaveBeenLastCalledWith("test-id1");

		man.handleChordPress(new KeyChord("C-KeyW")); // start test-id2 sequence
		man.handleChordPress(new KeyChord("C-KeyW")); // restarts test-id2 sequence
		man.handleChordPress(new KeyChord("C-KeyN")); // match test-id2 sequence
		expect(fn).toBeCalledTimes(2);
		expect(fn).toHaveBeenLastCalledWith("test-id2");
	});

	test("chord sequence", () => {
		let fn = jest.fn();
		let man = new HotkeyManager(fn);

		man.addHotkey("test-id", [
			new KeyChord("C-KeyQ"),
			new KeyChord("C-KeyF"),
		]);

		man.handleChordPress(new KeyChord("C-KeyQ"));
		expect(fn).toBeCalledTimes(0);

		man.handleChordPress(new KeyChord("C-KeyF"));
		expect(fn).toBeCalledTimes(1);
		expect(fn).toHaveBeenLastCalledWith("test-id");
	});

	test("reset removes registered hotkeys", () => {
		let fn = jest.fn();
		let man = new HotkeyManager(fn);
		man.addHotkey("test-id", [new KeyChord("C-KeyQ")]);
		man.addHotkey("test-another", [new KeyChord("C-KeyF")]);

		man.handleChordPress(new KeyChord("C-KeyQ"));
		man.handleChordPress(new KeyChord("C-KeyF"));
		expect(fn).toBeCalledTimes(2);

		man.reset();
		man.handleChordPress(new KeyChord("C-KeyQ"));
		man.handleChordPress(new KeyChord("C-KeyF"));
		expect(fn).toBeCalledTimes(2); // same as before reset
	});
});
