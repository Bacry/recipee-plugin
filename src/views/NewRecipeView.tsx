import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { RecipeForm, RecipeFormValues } from '../components/RecipeForm';
import { formValuesToRecipe } from '../models/recipeFormConversion';
import { ErrorModal } from '../components/ErrorModal';
import { NavigableViewState, NavigationEntry, closeOrGoBack } from '../navigation';
import { RECIPE_VIEW_TYPE } from './RecipeView';
import type MyPlugin from '../main';
import { createRecipe } from '../models/recipePersistence';

export const NEW_RECIPE_VIEW_TYPE = 'new-recipe-view';

interface NewRecipeViewState extends NavigableViewState {
	prefilledValues?: RecipeFormValues; // set when opened from a template
	templateKey?: string; // forces RecipeForm to remount when a different template is picked
}

export class NewRecipeView extends ItemView {
	private plugin: MyPlugin;
	private root: Root | null = null;
	private prefilledValues?: RecipeFormValues;
	private templateKey?: string;
	private history: NavigationEntry[] = [];

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return NEW_RECIPE_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Nouvelle recette';
	}

	async setState(state: NewRecipeViewState, result: unknown) {
		this.prefilledValues = state.prefilledValues;
		this.templateKey = state.templateKey;
		this.history = state.history ?? [];
		this.render();
		return super.setState(state, result as never);
	}

	getState(): NewRecipeViewState {
		return { prefilledValues: this.prefilledValues, templateKey: this.templateKey, history: this.history };
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		this.root = createRoot(container);

		const closeAction = this.addAction('x', 'Fermer le formulaire', () => {
			this.handleClose();
		});
		closeAction.addClass('new-recipe-ingredient-view-close-action');

		this.render();
	}

	handleClose() {
		closeOrGoBack(this.leaf, this.history);
	}

	render() {
		if (!this.root) return;

		this.root.render(
			<RecipeForm
				key={this.templateKey ?? 'new'}
				app={this.app}
				recipesFolder={this.plugin.settings.recipesFolder}
				ingredientsFolder={this.plugin.settings.ingredientsFolder}
				recipeImagesFolder={this.plugin.settings.recipeImagesFolder}
				anthropicApiKey={this.plugin.settings.anthropicApiKey}
				anthropicModel={this.plugin.settings.anthropicModel}
				onSubmit={(values) => this.handleSubmit(values)}
				initialValues={this.prefilledValues}
				submitLabel="Créer la recette"
			/>
		);
	}

	async handleSubmit(values: RecipeFormValues) {
		const { recipe, errors } = formValuesToRecipe(values);

		if (errors.length > 0) {
			new ErrorModal(this.app, errors).open();
			return;
		}

		try {
			const file = await createRecipe({
				app: this.app,
				recipesFolder: this.plugin.settings.recipesFolder,
				recipe: recipe!,
				subfolder: values.subfolder,
			});

			new Notice(`Recette "${file.basename}" créée.`);

			await this.leaf.setViewState({
				type: RECIPE_VIEW_TYPE,
				active: true,
				state: { filePath: file.path, history: [] },
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Impossible de créer la recette.';
			new Notice(message);
		}
	}

	async onClose() {
		this.root?.unmount();
	}
}
