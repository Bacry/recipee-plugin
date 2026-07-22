import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { IngredientForm, IngredientFormValues } from '../components/IngredientForm';
import { buildIngredientMarkdown } from '../models/buildIngredientMarkdown';
import { lowerFirstLetter } from '../models/textNormalize';
import type MyPlugin from '../main';
import { NavigableViewState, NavigationEntry, closeOrGoBack } from '../navigation';

export const NEW_INGREDIENT_VIEW_TYPE = 'new-ingredient-view';

interface NewIngredientViewState extends NavigableViewState {
	prefilledName?: string; // set when opened from a "create missing ingredient" link, e.g. from a recipe
}

export class NewIngredientView extends ItemView {
	private root: Root | null = null;
	private plugin: MyPlugin;
	private prefilledName?: string;
	private history: NavigationEntry[] = [];

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
		this.history = state.history ?? [];
		this.render();
		return super.setState(state, result as never);
	}

	getState(): NewIngredientViewState {
		return { prefilledName: this.prefilledName, history: this.history };
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		this.root = createRoot(container);
		this.render();
	}

	// Same pattern as IngredientView: go back if we navigated here from
	// another screen, otherwise there's nothing to return to — just close.
	handleClose() {
		closeOrGoBack(this.leaf, this.history);
	}
	render() {
		if (!this.root) return;

		this.root.render(
			<IngredientForm
				// Forces a full remount whenever the prefilled name changes — see
				// the comment in the previous version for why this is necessary
				// (useState's initial value is only read on first mount).
				key={this.prefilledName ?? 'empty'}
				app={this.app}
				onSubmit={(values) => this.handleSubmit(values)}
				onClose={() => this.handleClose()}
				ingredientTypes={this.plugin.settings.ingredientTypes}
				shopSections={this.plugin.settings.shopSections}
				usdaApiKey={this.plugin.settings.usdaApiKey}
				autoSearchOnMount={!!this.prefilledName}
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
		this.handleClose(); // returns to the previous screen if there is one, otherwise closes the tab
	}

	async onClose() {
		this.root?.unmount();
	}
}
