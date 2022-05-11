import { App, Modal } from "obsidian";

export class SetShortcutModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { titleEl, contentEl } = this;
		titleEl.empty();
		titleEl.setText("Set Shortcut");
		contentEl.empty();
		titleEl.setText(" ");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
