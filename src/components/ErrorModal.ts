import { App, Modal } from 'obsidian';

// A simple native Obsidian modal to display a list of validation errors.
// Uses the Modal class directly (not React) since it's a one-off dialog,
// consistent with how Obsidian's own UI (e.g. command palette) works.
export class ErrorModal extends Modal {
	private errors: string[];

	constructor(app: App, errors: string[]) {
		super(app);
		this.errors = errors;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h3', { text: 'Corrige les erreurs suivantes' });

		const list = contentEl.createEl('ul');
		for (const error of this.errors) {
			list.createEl('li', { text: error });
		}
	}

	onClose() {
		this.contentEl.empty();
	}
}
