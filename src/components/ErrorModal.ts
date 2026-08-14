import { App, Modal } from 'obsidian';
import { t } from '../i18n/strings';
import type { Language } from '../i18n/strings';

// A simple native Obsidian modal to display a list of validation errors.
// Uses the Modal class directly (not React) since it's a one-off dialog,
// consistent with how Obsidian's own UI (e.g. command palette) works.
export class ErrorModal extends Modal {
	private errors: string[];
	private language: Language;

	constructor(app: App, errors: string[], language: Language = 'fr') {
		super(app);
		this.errors = errors;
		this.language = language;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h3', { text: t('errorModal.title', this.language) });

		const list = contentEl.createEl('ul');
		for (const error of this.errors) {
			list.createEl('li', { text: error });
		}
	}

	onClose() {
		this.contentEl.empty();
	}
}
