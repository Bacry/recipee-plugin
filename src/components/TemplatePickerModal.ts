import { App, FuzzySuggestModal, TFile } from 'obsidian';
import { t } from '../i18n/strings';
import type { Language } from '../i18n/strings';

type TemplateChoice = TFile | null; // null = "empty recipe", always listed first

// A native Obsidian fuzzy picker listing recipe template files (by basename),
// used by "Create new recipe" when at least one template exists. Uses
// FuzzySuggestModal — the same native fuzzy-search UI as Obsidian's own
// command palette and quick switcher — rather than a custom popup. Always
// includes a synthetic "empty recipe" choice (represented as null) first,
// so picking a template is never mandatory just because some exist.
export class TemplatePickerModal extends FuzzySuggestModal<TemplateChoice> {
	private templates: TFile[];
	private onChoose: (template: TFile | null) => void;
	private language: Language;

	constructor(app: App, templates: TFile[], onChoose: (template: TFile | null) => void, language: Language = 'fr') {
		super(app);
		this.templates = templates;
		this.onChoose = onChoose;
		this.language = language;
		this.setPlaceholder(t('main.templatePicker.placeholder', language));
	}

	getItems(): TemplateChoice[] {
		return [null, ...this.templates];
	}

	getItemText(template: TemplateChoice): string {
		return template === null ? t('main.templatePicker.emptyRecipe', this.language) : template.basename;
	}

	onChooseItem(template: TemplateChoice): void {
		this.onChoose(template);
	}
}
