import { KeyChord, keySequenceEqual, keySequencePartiallyEqual } from "./keys";

jest.mock("obsidian");

describe("KeyChord", () => {
	test("string constructor", () => {
		let kc = new KeyChord("");
		expect(kc.meta).toEqual(false);
		expect(kc.alt).toEqual(false);
		expect(kc.shift).toEqual(false);
		expect(kc.ctrl).toEqual(false);
		expect(kc.key).toBe("");

		kc = new KeyChord("C-KeyA");
		expect(kc.ctrl).toEqual(true);
		expect(kc.key).toBe("KeyA");

		kc = new KeyChord("M-Random");
		expect(kc.meta).toEqual(true);
		expect(kc.key).toBe("Random");

		kc = new KeyChord("A-Digit2");
		expect(kc.alt).toEqual(true);
		expect(kc.key).toBe("Digit2");

		kc = new KeyChord("S-KeyK");
		expect(kc.shift).toEqual(true);
		expect(kc.key).toBe("KeyK");

		kc = new KeyChord("M-A-S-One");
		expect(kc.meta).toEqual(true);
		expect(kc.alt).toEqual(true);
		expect(kc.shift).toEqual(true);
		expect(kc.ctrl).toEqual(false);
		expect(kc.key).toBe("One");

		kc = new KeyChord("S-C-Two");
		expect(kc.shift).toEqual(true);
		expect(kc.ctrl).toEqual(true);
		expect(kc.meta).toEqual(false);
		expect(kc.alt).toEqual(false);
		expect(kc.key).toBe("Two");

		kc = new KeyChord("C-");
		expect(kc.ctrl).toEqual(true);
		expect(kc.key).toBe("");

		kc = new KeyChord("S-");
		expect(kc.shift).toEqual(true);
		expect(kc.key).toBe("");

		kc = new KeyChord("M-");
		expect(kc.meta).toEqual(true);
		expect(kc.key).toBe("");

		kc = new KeyChord("A-");
		expect(kc.alt).toEqual(true);
		expect(kc.key).toBe("");
	});

	test("serialize", () => {
		expect(new KeyChord("C-KeyA").serialize()).toEqual("C-KeyA");
		expect(new KeyChord("C-M-S-KeyG").serialize()).toEqual("M-C-S-KeyG");
		expect(new KeyChord("S-").serialize()).toEqual("S-");
	});
});

describe("keySequenceEqual", () => {
	test("same sequence returns true", () => {
		expect(keySequenceEqual([], [])).toEqual(true);

		expect(
			keySequenceEqual([new KeyChord("C-KeyA")], [new KeyChord("C-KeyA")])
		).toEqual(true);

		expect(
			keySequenceEqual(
				[new KeyChord("M-S-KeyW"), new KeyChord("M-S-KeyQ")],
				[new KeyChord("M-S-KeyW"), new KeyChord("M-S-KeyQ")]
			)
		).toEqual(true);
	});

	test("different sequences return false", () => {
		expect(
			keySequenceEqual([new KeyChord("C-KeyA")], [new KeyChord("C-KeyB")])
		).toEqual(false);

		expect(
			keySequenceEqual(
				[new KeyChord("M-S-KeyW"), new KeyChord("M-S-KeyQ")],
				[new KeyChord("M-S-KeyW"), new KeyChord("M-S-KeyE")]
			)
		).toEqual(false);
	});

	test("subset matches return false", () => {
		expect(keySequenceEqual([], [new KeyChord("C-KeyA")])).toEqual(false);

		expect(
			keySequenceEqual(
				[new KeyChord("C-KeyA")],
				[new KeyChord("C-KeyA"), new KeyChord("C-KeyB")]
			)
		).toEqual(false);

		expect(
			keySequenceEqual(
				[
					new KeyChord("M-S-KeyW"),
					new KeyChord("M-S-KeyQ"),
					new KeyChord("M-S-KeyE"),
				],
				[new KeyChord("M-S-KeyW"), new KeyChord("M-S-KeyQ")]
			)
		).toEqual(false);
	});
});

describe("keySequencePartiallyEqual", () => {
	test("same sequence returns true", () => {
		expect(
			keySequencePartiallyEqual(
				[new KeyChord("C-KeyA")],
				[new KeyChord("C-KeyA")]
			)
		).toEqual(true);

		expect(
			keySequencePartiallyEqual(
				[new KeyChord("M-S-KeyW"), new KeyChord("M-S-KeyQ")],
				[new KeyChord("M-S-KeyW"), new KeyChord("M-S-KeyQ")]
			)
		).toEqual(true);
	});

	test("subset of sequence returns true", () => {
		expect(
			keySequencePartiallyEqual(
				[new KeyChord("C-KeyA")],
				[new KeyChord("C-KeyA"), new KeyChord("C-KeyB")]
			)
		).toEqual(true);

		expect(
			keySequencePartiallyEqual(
				[new KeyChord("M-S-KeyW"), new KeyChord("M-S-KeyQ")],
				[new KeyChord("M-S-KeyW")]
			)
		).toEqual(true);
	});

	test("empty sequence always returns false", () => {
		expect(keySequencePartiallyEqual([], [])).toEqual(false);
		expect(keySequencePartiallyEqual([], [new KeyChord("M-KeyG")])).toEqual(
			false
		);
		expect(keySequencePartiallyEqual([new KeyChord("M-KeyG")], [])).toEqual(
			false
		);
	});

	test("different sequences return false", () => {
		expect(
			keySequencePartiallyEqual(
				[new KeyChord("C-KeyB")],
				[new KeyChord("C-KeyA")]
			)
		).toEqual(false);

		expect(
			keySequencePartiallyEqual(
				[new KeyChord("M-S-KeyW"), new KeyChord("M-S-KeyQ")],
				[new KeyChord("C-KeyA")]
			)
		).toEqual(false);
	});

	test("only matches at start returns true", () => {
		expect(
			keySequencePartiallyEqual(
				[new KeyChord("C-KeyB")],
				[new KeyChord("C-KeyA"), new KeyChord("C-KeyB")]
			)
		).toEqual(false);

		expect(
			keySequencePartiallyEqual(
				[new KeyChord("M-S-KeyW"), new KeyChord("M-S-KeyQ")],
				[new KeyChord("M-S-KeyQ")]
			)
		).toEqual(false);
	});
});
