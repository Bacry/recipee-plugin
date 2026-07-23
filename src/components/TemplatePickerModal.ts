import { App, FuzzySuggestModal, TFile } from 'obsidian';

// A native Obsidian fuzzy picker listing recipe template files (by basename),
// used by "Create new recipe" when at least one template exists. Uses
// FuzzySuggestModal — the same native fuzzy-search UI as Obsidian's own
// command palette and quick switcher — rather than a custom popup.
export class TemplatePickerModal extends FuzzySuggestModal<TFile> {
	private templates: TFile[];
	private onChoose: (template: TFile) => void;

	constructor(app: App, templates: TFile[], onChoose: (template: TFile) => void) {
		super(app);
		this.templates = templates;
		this.onChoose = onChoose;
		this.setPlaceholder('Choisir un template de recette...');
	}

	getItems(): TFile[] {
		return this.templates;
	}

	getItemText(template: TFile): string {
		return template.basename;
	}

	onChooseItem(template: TFile): void {
		this.onChoose(template);
	}
}
