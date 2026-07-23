import { App, Modal, Notice } from 'obsidian';
import { extractRecipeFromText } from '../services/claudeRecipeExtraction';
import { RecipeFormValues } from './RecipeForm';

// A native Obsidian modal with a large textarea for pasting free-form recipe
// text, plus an "Analyser" button that calls Claude to extract structured
// data. On success, calls onExtracted with the parsed values and closes;
// on error, shows the error inline and stays open so the user can retry.
export class ParseRecipeTextModal extends Modal {
	private apiKey: string;
	private model: string;
	private ingredientsFolder: string;
	private onExtracted: (values: RecipeFormValues) => void;
	private textareaEl!: HTMLTextAreaElement;
	private statusEl!: HTMLElement;
	private analyzeButton!: HTMLButtonElement;

	constructor(
		app: App,
		apiKey: string,
		model: string,
		ingredientsFolder: string,
		onExtracted: (values: RecipeFormValues) => void
	) {
		super(app);
		this.apiKey = apiKey;
		this.model = model;
		this.ingredientsFolder = ingredientsFolder;
		this.onExtracted = onExtracted;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h3', { text: 'Extraire une recette depuis un texte' });
		contentEl.createEl('p', {
			text: 'Colle le texte brut d\'une recette (depuis un site, un livre...) — Claude va essayer d\'en extraire les champs.',
		});

		this.textareaEl = contentEl.createEl('textarea', {
			cls: 'markdown-editable-textarea',
		});
		this.textareaEl.rows = 12;
		this.textareaEl.style.width = '100%';

		this.statusEl = contentEl.createEl('p', { cls: 'ingredient-validation-warnings' });
		this.statusEl.style.display = 'none';

		const buttonRow = contentEl.createDiv({ cls: 'ingredient-form-actions' });

		this.analyzeButton = buttonRow.createEl('button', { text: 'Analyser', cls: 'ingredient-form-submit' });
		this.analyzeButton.onclick = () => this.handleAnalyze();

		const cancelButton = buttonRow.createEl('button', { text: 'Annuler' });
		cancelButton.onclick = () => this.close();
	}

	private async handleAnalyze() {
		const text = this.textareaEl.value.trim();
		if (text === '') return;

		this.analyzeButton.disabled = true;
		this.analyzeButton.textContent = 'Analyse en cours...';
		this.statusEl.style.display = 'none';

		const result = await extractRecipeFromText(this.app, this.apiKey, this.model, this.ingredientsFolder, text);

		if (result.error || !result.values) {
			this.statusEl.style.display = 'block';
			this.statusEl.textContent = result.error ?? 'Erreur inconnue.';
			this.analyzeButton.disabled = false;
			this.analyzeButton.textContent = 'Analyser';
			return;
		}

		new Notice('Recette extraite avec succès.');
		this.onExtracted(result.values);
		this.close();
	}

	onClose() {
		this.contentEl.empty();
	}
}
