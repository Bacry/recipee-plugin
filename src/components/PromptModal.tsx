import { App, Modal } from 'obsidian';
import { t } from '../i18n/strings';
import type { Language } from '../i18n/strings';

// A simple native Obsidian modal with a single text input — the in-app
// replacement for window.prompt(), which Electron blocks entirely (see
// https://github.com/obsidianmd/obsidian-releases, prompt() throws in newer
// Electron versions rather than showing a dialog).
export class PromptModal extends Modal {
	private title: string;
	private onSubmit: (value: string) => void;
	private language: Language;
	private inputEl!: HTMLInputElement;

	constructor(app: App, title: string, onSubmit: (value: string) => void, language: Language = 'fr') {
		super(app);
		this.title = title;
		this.onSubmit = onSubmit;
		this.language = language;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h3', { text: this.title });

		this.inputEl = contentEl.createEl('input', { type: 'text' });
		this.inputEl.style.width = '100%';
		this.inputEl.focus();
		this.inputEl.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') this.commit();
		});

		const buttonRow = contentEl.createDiv({ cls: 'ingredient-form-actions' });

		const confirmButton = buttonRow.createEl('button', { text: t('confirmModal.confirm', this.language), cls: 'ingredient-form-submit' });
		confirmButton.onclick = () => this.commit();

		const cancelButton = buttonRow.createEl('button', { text: t('parseRecipeTextModal.cancel', this.language) });
		cancelButton.onclick = () => this.close();
	}

	private commit() {
		const value = this.inputEl.value.trim();
		if (value === '') return;
		this.onSubmit(value);
		this.close();
	}

	onClose() {
		this.contentEl.empty();
	}
}
