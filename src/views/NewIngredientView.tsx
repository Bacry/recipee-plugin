import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { IngredientForm, IngredientFormValues } from '../components/IngredientForm';
import { buildIngredientMarkdown } from '../models/buildIngredientMarkdown';
import type MyPlugin from '../main';
import { lowerFirstLetter } from '../models/textNormalize';

export const NEW_INGREDIENT_VIEW_TYPE = 'new-ingredient-view';

export class NewIngredientView extends ItemView {
	private root: Root | null = null;
	private plugin: MyPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return NEW_INGREDIENT_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Nouvel ingrédient';
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		this.root = createRoot(container);
		this.render();
	}

	render() {
		if (!this.root) return;

		this.root.render(
			<IngredientForm
				app={this.app}
				onSubmit={(values) => this.handleSubmit(values)}
				ingredientTypes={this.plugin.settings.ingredientTypes}
				shopSections={this.plugin.settings.shopSections}
				usdaApiKey={this.plugin.settings.usdaApiKey}
			/>
		);
	}

	async handleSubmit(values: IngredientFormValues) {
		const normalizedName = lowerFirstLetter(values.name.trim());

		if (normalizedName === '') {
			new Notice('Le nom est obligatoire.');
			return;
		}

		const folder = this.plugin.settings.ingredientsFolder;
		const path = `${folder}/${normalizedName}.md`;

		const existing = this.app.vault.getAbstractFileByPath(path);
		if (existing) {
			new Notice(`Un ingrédient "${normalizedName}" existe déjà.`);
			return;
		}

		const content = buildIngredientMarkdown({ ...values, name: normalizedName });
		await this.app.vault.create(path, content);

		new Notice(`Ingrédient "${normalizedName}" créé.`);
		this.leaf.detach();
	}

	async onClose() {
		this.root?.unmount();
	}
}
