import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { IngredientForm, IngredientFormValues } from '../components/IngredientForm';
import { buildIngredientMarkdown } from '../models/buildIngredientMarkdown';
import type MyPlugin from '../main';
import { lowerFirstLetter } from '../models/textNormalize';

export const NEW_INGREDIENT_VIEW_TYPE = 'new-ingredient-view';

interface NewIngredientViewState {
	prefilledName?: string;
	returnToPath?: string;
}

export class NewIngredientView extends ItemView {
	private root: Root | null = null;
	private plugin: MyPlugin;
	private prefilledName?: string;
	private returnToPath?: string;

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

	async setState(state: NewIngredientViewState, result: unknown) {
		this.prefilledName = state.prefilledName;
		this.returnToPath = state.returnToPath;
		this.render();
		return super.setState(state, result as never);
	}

	getState(): NewIngredientViewState {
		return { prefilledName: this.prefilledName, returnToPath: this.returnToPath };
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		this.root = createRoot(container);
		this.render();
	}

	// Navigates back to the originating recipe if there is one, otherwise closes the tab.
	handleClose() {
		if (this.returnToPath) {
			this.plugin.activateRecipeView(this.returnToPath);
		} else {
			this.leaf.detach();
		}
	}

	render() {
		if (!this.root) return;

		this.root.render(
			<IngredientForm
				// Forces React to fully remount IngredientForm whenever the prefilled name
				// changes, instead of reusing a previous instance. Without this, useState's
				// initial value (read from initialValues) would be "stuck" from the first
				// mount, and a new prefilledName would never actually update the form.
				key={this.prefilledName ?? 'empty'}
				app={this.app}
				onSubmit={(values) => this.handleSubmit(values)}
				onClose={() => this.handleClose()}
				ingredientTypes={this.plugin.settings.ingredientTypes}
				shopSections={this.plugin.settings.shopSections}
				usdaApiKey={this.plugin.settings.usdaApiKey}
				initialValues={
					this.prefilledName
						? {
							name: this.prefilledName,
							nameEn: '',
							type: '',
							shopSection: '',
							densityGMl: '',
							entityWeightG: '',
							brand: '',
							possibleForms: '',
							nutrition: {
								kcal: 0, lipids: 0, non_saturated_lipids: 0, glucids: 0,
								sugar: 0, proteins: 0, salt: 0, fibers: 0, cholesterol: 0,
							},
						}
						: undefined
				}
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
		this.handleClose(); // returns to the recipe if opened from one, otherwise closes the tab
	}

	async onClose() {
		this.root?.unmount();
	}
}
