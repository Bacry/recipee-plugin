import { App, Modal, Notice } from 'obsidian';
import { extractRecipeFromText } from '../services/ai/aiRecipeExtraction';
import { AIProviderId, AICredentials } from '../services/ai/types';
import { RecipeFormValues } from './RecipeForm';
import { t } from '../i18n/strings';
import type { Language } from '../i18n/strings';
import { fetchPageText } from '../services/fetchPageText';

// A native Obsidian modal with a large textarea for pasting free-form recipe
// text (or a URL field, as an alternative), plus an "Analyser" button that
// calls the configured AI provider to extract structured data. On success,
// calls onExtracted with the parsed values and closes; on error, shows the
// error inline and stays open so the user can retry.
export class ParseRecipeTextModal extends Modal {
	private providerId: AIProviderId;
	private credentials: AICredentials;
	private ingredientsFolder: string;
	private unitSystem: 'metric' | 'us';
	private onExtracted: (values: RecipeFormValues) => void;
	private language: Language;
	private urlInputEl!: HTMLInputElement;
	private textareaEl!: HTMLTextAreaElement;
	private statusEl!: HTMLElement;
	private analyzeButton!: HTMLButtonElement;

	constructor(
		app: App,
		providerId: AIProviderId,
		credentials: AICredentials,
		ingredientsFolder: string,
		onExtracted: (values: RecipeFormValues) => void,
		language: Language = 'fr',
		unitSystem: 'metric' | 'us' = 'metric'
	) {
		super(app);
		this.providerId = providerId;
		this.credentials = credentials;
		this.ingredientsFolder = ingredientsFolder;
		this.onExtracted = onExtracted;
		this.language = language;
		this.unitSystem = unitSystem;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h3', { text: t('parseRecipeTextModal.title', this.language) });
		contentEl.createEl('p', {
			text: t('parseRecipeTextModal.description', this.language),
		});

		contentEl.createEl('label', { text: t('parseRecipeTextModal.urlLabel', this.language) });
		this.urlInputEl = contentEl.createEl('input', { type: 'text' });
		this.urlInputEl.style.width = '100%';
		this.urlInputEl.placeholder = 'https://...';

		contentEl.createEl('p', { text: t('parseRecipeTextModal.or', this.language), cls: 'usda-popup-empty' });

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
		const url = this.urlInputEl.value.trim();
		let text = this.textareaEl.value.trim();
		if (url === '' && text === '') return;

		this.analyzeButton.disabled = true;
		this.statusEl.style.display = 'none';

		if (url !== '') {
			this.analyzeButton.textContent = t('parseRecipeTextModal.fetching', this.language);
			const pageResult = await fetchPageText(url);
			if (pageResult.error || !pageResult.text) {
				this.statusEl.style.display = 'block';
				this.statusEl.textContent = pageResult.error ?? t('parseRecipeTextModal.unknownError', this.language);
				this.analyzeButton.disabled = false;
				this.analyzeButton.textContent = t('parseRecipeTextModal.analyze', this.language);
				return;
			}
			text = pageResult.text;
		}

		this.analyzeButton.textContent = t('parseRecipeTextModal.analyzing', this.language);

		const result = await extractRecipeFromText(
			this.providerId,
			this.credentials,
			this.app,
			this.ingredientsFolder,
			text,
			this.language,
			this.unitSystem
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
