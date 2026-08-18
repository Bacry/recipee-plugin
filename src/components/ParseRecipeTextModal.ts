import { App, Modal, Notice } from 'obsidian';
import { extractRecipeFromText } from '../services/ai/aiRecipeExtraction';
import { AIProviderId, AICredentials } from '../services/ai/types';
import { RecipeFormValues } from './RecipeForm';
import { t } from '../i18n/strings';
import type { Language } from '../i18n/strings';

// A native Obsidian modal with a large textarea for pasting free-form recipe
// text (or a URL field, as an alternative), plus an "Analyser" button that
// calls the configured AI provider to extract structured data. On success,
// calls onExtracted with the parsed values and closes; on error, shows the
// error inline and stays open so the user can retry.
export class ParseRecipeTextModal extends Modal {
	private providerId: AIProviderId;
	private credentials: AICredentials;
	private ingredientsFolder: string;
	private onExtracted: (values: RecipeFormValues) => void;
	private language: Language;
	private textareaEl!: HTMLTextAreaElement;
	private statusEl!: HTMLElement;
	private analyzeButton!: HTMLButtonElement;

	constructor(
		app: App,
		providerId: AIProviderId,
		credentials: AICredentials,
		ingredientsFolder: string,
		onExtracted: (values: RecipeFormValues) => void,
		language: Language = 'fr'
	) {
		super(app);
		this.providerId = providerId;
		this.credentials = credentials;
		this.ingredientsFolder = ingredientsFolder;
		this.onExtracted = onExtracted;
		this.language = language;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h3', { text: t('parseRecipeTextModal.title', this.language) });
		contentEl.createEl('p', {
			text: t('parseRecipeTextModal.description', this.language),
		});

		this.textareaEl = contentEl.createEl('textarea', {
			cls: 'markdown-editable-textarea',
		});
		this.textareaEl.rows = 12;
		this.textareaEl.style.width = '100%';

		this.statusEl = contentEl.createEl('p', { cls: 'ingredient-validation-warnings' });
		this.statusEl.style.display = 'none';

		const buttonRow = contentEl.createDiv({ cls: 'ingredient-form-actions' });

		this.analyzeButton = buttonRow.createEl('button', { text: t('parseRecipeTextModal.analyze', this.language), cls: 'ingredient-form-submit' });
		this.analyzeButton.onclick = () => this.handleAnalyze();

		const cancelButton = buttonRow.createEl('button', { text: t('parseRecipeTextModal.cancel', this.language) });
		cancelButton.onclick = () => this.close();
	}

	private async handleAnalyze() {
		const text = this.textareaEl.value.trim();
		if (text === '') return;

		this.analyzeButton.disabled = true;
		this.analyzeButton.textContent = t('parseRecipeTextModal.analyzing', this.language);
		this.statusEl.style.display = 'none';

		const result = await extractRecipeFromText(
			this.providerId,
			this.credentials,
			this.app,
			this.ingredientsFolder,
			text,
			undefined,
			this.language
		);

		if (result.error || !result.values) {
			this.statusEl.style.display = 'block';
			this.statusEl.textContent = result.error ?? t('parseRecipeTextModal.unknownError', this.language);
			this.analyzeButton.disabled = false;
			this.analyzeButton.textContent = t('parseRecipeTextModal.analyze', this.language);
			return;
		}

		new Notice(t('parseRecipeTextModal.success', this.language));
		this.onExtracted(result.values);
		this.close();
	}

	onClose() {
		this.contentEl.empty();
	}
}
