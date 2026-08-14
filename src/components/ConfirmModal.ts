import { App, Modal } from 'obsidian';
import { t } from '../i18n/strings';
import type { Language } from '../i18n/strings';

// A simple native Obsidian confirmation dialog with two buttons —
// used for "this recipe is already in your shopping list, add anyway?".
export class ConfirmModal extends Modal {
	private message: string;
	private onConfirm: () => void;
	private language: Language;

	constructor(app: App, message: string, onConfirm: () => void, language: Language = 'fr') {
		super(app);
		this.message = message;
		this.onConfirm = onConfirm;
		this.language = language;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('p', { text: this.message });

		const buttonRow = contentEl.createDiv({ cls: 'ingredient-form-actions' });

		const confirmButton = buttonRow.createEl('button', { text: t('confirmModal.confirm', this.language), cls: 'ingredient-form-submit' });
		confirmButton.onclick = () => {
			this.onConfirm();
			this.close();
		};

		const cancelButton = buttonRow.createEl('button', { text: t('confirmModal.cancel', this.language) });
		cancelButton.onclick = () => this.close();
	}

	onClose() {
		this.contentEl.empty();
	}
}
