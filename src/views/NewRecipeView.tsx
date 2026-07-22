import { ItemView, WorkspaceLeaf, TFile, Notice } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { RecipeForm, RecipeFormValues } from '../components/RecipeForm';
import { parseRecipeFromFrontmatter } from '../models/parseRecipe';
import { buildRecipeMarkdown } from '../models/buildRecipeMarkdown';
import { recipeToFormValues, formValuesToRecipe } from '../models/recipeFormConversion';
import { ErrorModal } from '../components/ErrorModal';
import { lowerFirstLetter } from '../models/textNormalize';
import { NavigableViewState, NavigationEntry, closeOrGoBack, navigateBack } from '../navigation';
import { RECIPE_VIEW_TYPE } from './RecipeView';
import type MyPlugin from '../main';

export const NEW_RECIPE_VIEW_TYPE = 'new-recipe-view';

interface NewRecipeViewState extends NavigableViewState {
	editFilePath?: string;
	isCocktail?: boolean; // set when opened via "Create new cocktail" — affects the instructions template used
}

export class NewRecipeView extends ItemView {
	private plugin: MyPlugin;
	private root: Root | null = null;
	private editFilePath?: string;
	private isCocktail = false;
	private history: NavigationEntry[] = [];

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return NEW_RECIPE_VIEW_TYPE;
	}

	getDisplayText(): string {
		return this.editFilePath ? 'Modifier recette' : 'Nouvelle recette';
	}

	async setState(state: NewRecipeViewState, result: unknown) {
		this.editFilePath = state.editFilePath;
		this.isCocktail = state.isCocktail ?? false;
		this.history = state.history ?? [];
		this.render();
		return super.setState(state, result as never);
	}

	getState(): NewRecipeViewState {
		return { editFilePath: this.editFilePath, isCocktail: this.isCocktail, history: this.history };
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		this.root = createRoot(container);
		this.render();
	}

	handleClose() {
		closeOrGoBack(this.leaf, this.history);
	}

	render() {
		if (!this.root) return;

		let initialValues: RecipeFormValues | undefined;
		if (this.editFilePath) {
			const file = this.app.vault.getAbstractFileByPath(this.editFilePath);
			if (file instanceof TFile) {
				const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
				const { recipe } = parseRecipeFromFrontmatter(frontmatter, file.basename);
				if (recipe) {
					initialValues = recipeToFormValues(recipe);
				}
			}
		}

		const defaultInstructions = this.isCocktail
			? this.plugin.settings.cocktailInstructionsTemplate
			: this.plugin.settings.recipeInstructionsTemplate;

		// Prefills specific to the "Create new cocktail" flow — only applied
		// when creating fresh (editFilePath undefined) and isCocktail is true.
		const defaultValueOverrides = this.isCocktail && !this.editFilePath
			? {
				baseServings: '1',
				servingsLabel: 'verre',
				preparationDurationMin: '10',
				tags: 'cocktail',
			}
			: undefined;

		this.root.render(
			<RecipeForm
				key={`${this.editFilePath ?? 'new'}-${this.isCocktail}`}
				app={this.app}
				recipesFolder={this.plugin.settings.recipesFolder}
				ingredientsFolder={this.plugin.settings.ingredientsFolder}
				defaultInstructions={defaultInstructions}
				defaultValueOverrides={defaultValueOverrides}
				onSubmit={(values) => this.handleSubmit(values)}
				onClose={() => this.handleClose()}
				initialValues={initialValues}
				submitLabel={this.editFilePath ? 'Enregistrer les modifications' : 'Créer la recette'}
			/>
		);
	}

	async handleSubmit(values: RecipeFormValues) {
		const { recipe, errors } = formValuesToRecipe(values);

		if (errors.length > 0) {
			new ErrorModal(this.app, errors).open();
			return;
		}

		if (this.editFilePath) {
			// Edit mode: overwrite the existing file, then navigate back to
			// RecipeView for it (rather than just closing/going back blindly —
			// this ensures we land on the up-to-date recipe even if the name
			// changed, though renaming isn't supported yet: the file path stays
			// the same, only its content is rewritten).
			const file = this.app.vault.getAbstractFileByPath(this.editFilePath);
			if (!(file instanceof TFile)) return;

			await this.app.vault.modify(file, buildRecipeMarkdown(recipe!));
			new Notice(`Recette "${recipe!.name}" mise à jour.`);

			// Pop back to whatever was on the history stack (should be RecipeView
			// for this same file, since that's the only way to reach edit mode).
			await navigateBack(this.leaf);
		} else {
			// Create mode: build a new file in the recipes folder.
			const normalizedName = lowerFirstLetter(recipe!.name);
			const folder = this.plugin.settings.recipesFolder;
			const path = `${folder}/${normalizedName}.md`;

			const existing = this.app.vault.getAbstractFileByPath(path);
			if (existing) {
				new Notice(`Une recette "${normalizedName}" existe déjà.`);
				return;
			}

			await this.app.vault.create(path, buildRecipeMarkdown({ ...recipe!, name: normalizedName }));
			new Notice(`Recette "${normalizedName}" créée.`);

			// No history to pop from when creating fresh — navigate directly to
			// RecipeView for the file we just made, transforming this same leaf.
			await this.leaf.setViewState({
				type: RECIPE_VIEW_TYPE,
				active: true,
				state: { filePath: path, history: [] },
			});
		}
	}

	async onClose() {
		this.root?.unmount();
	}
}
