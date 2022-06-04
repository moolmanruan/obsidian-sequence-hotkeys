import { KeyChord, keySequenceEqual } from "./keys";

jest.mock("obsidian");

describe("KeyChord", () => {
	test("string constructor", () => {
		let kc = new KeyChord("");
		expect(kc.meta).toBeFalsy();
		expect(kc.alt).toBeFalsy();
		expect(kc.shift).toBeFalsy();
		expect(kc.ctrl).toBeFalsy();
		expect(kc.key).toBe("");

		kc = new KeyChord("C-KeyA");
		expect(kc.ctrl).toBeTruthy();
		expect(kc.key).toBe("KeyA");

		kc = new KeyChord("M-Random");
		expect(kc.meta).toBeTruthy();
		expect(kc.key).toBe("Random");

		kc = new KeyChord("A-Digit2");
		expect(kc.alt).toBeTruthy();
		expect(kc.key).toBe("Digit2");

		kc = new KeyChord("S-KeyK");
		expect(kc.shift).toBeTruthy();
		expect(kc.key).toBe("KeyK");

		kc = new KeyChord("M-A-S-One");
		expect(kc.meta).toBeTruthy();
		expect(kc.alt).toBeTruthy();
		expect(kc.shift).toBeTruthy();
		expect(kc.ctrl).toBeFalsy();
		expect(kc.key).toBe("One");

		kc = new KeyChord("S-C-Two");
		expect(kc.shift).toBeTruthy();
		expect(kc.ctrl).toBeTruthy();
		expect(kc.meta).toBeFalsy();
		expect(kc.alt).toBeFalsy();
		expect(kc.key).toBe("Two");
	});
});

describe("keySequenceEqual", () => {
	test("same sequence returns true", () => {
		expect(keySequenceEqual([], [])).toBeTruthy();

		expect(
			keySequenceEqual([new KeyChord("C-KeyA")], [new KeyChord("C-KeyA")])
		).toBeTruthy();

		expect(
			keySequenceEqual(
				[new KeyChord("M-S-KeyW"), new KeyChord("M-S-KeyQ")],
				[new KeyChord("M-S-KeyW"), new KeyChord("M-S-KeyQ")]
			)
		).toBeTruthy();
	});

	test("different sequences return false", () => {
		expect(
			keySequenceEqual([new KeyChord("C-KeyA")], [new KeyChord("C-KeyB")])
		).toBeFalsy();

		expect(
			keySequenceEqual(
				[new KeyChord("M-S-KeyW"), new KeyChord("M-S-KeyQ")],
				[new KeyChord("M-S-KeyW"), new KeyChord("M-S-KeyE")]
			)
		).toBeFalsy();
	});

	test("subset matches return false", () => {
		expect(keySequenceEqual([], [new KeyChord("C-KeyA")])).toBeFalsy();

		expect(
			keySequenceEqual(
				[new KeyChord("C-KeyA")],
				[new KeyChord("C-KeyA"), new KeyChord("C-KeyB")]
			)
		).toBeFalsy();

		expect(
			keySequenceEqual(
				[
					new KeyChord("M-S-KeyW"),
					new KeyChord("M-S-KeyQ"),
					new KeyChord("M-S-KeyE"),
				],
				[new KeyChord("M-S-KeyW"), new KeyChord("M-S-KeyQ")]
			)
		).toBeFalsy();
	});
});
