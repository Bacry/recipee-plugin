import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { IngredientForm, IngredientFormValues } from '../components/IngredientForm';
import { buildIngredientMarkdown } from '../models/buildIngredientMarkdown';
import type MyPlugin from '../main';

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
				onSubmit={(values) => this.handleSubmit(values)}
				ingredientTypes={this.plugin.settings.ingredientTypes}
				shopSections={this.plugin.settings.shopSections}
				usdaApiKey={this.plugin.settings.usdaApiKey}
			/>
		);
	}

	async handleSubmit(values: IngredientFormValues) {
		if (values.name.trim() === '') {
			new Notice('Le nom est obligatoire.');
			return;
		}

		const folder = this.plugin.settings.ingredientsFolder;
		const path = `${folder}/${values.name}.md`;

		const existing = this.app.vault.getAbstractFileByPath(path);
		if (existing) {
			new Notice(`Un ingrédient "${values.name}" existe déjà.`);
			return;
		}

		const content = buildIngredientMarkdown(values);
		await this.app.vault.create(path, content);

		new Notice(`Ingrédient "${values.name}" créé.`);
		this.leaf.detach();
	}

	async onClose() {
		this.root?.unmount();
	}
}
