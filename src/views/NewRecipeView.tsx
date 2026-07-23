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
	prefilledValues?: RecipeFormValues;
	templateKey?: string;
}

export class NewRecipeView extends ItemView {
	private plugin: MyPlugin;
	private root: Root | null = null;
	private editFilePath?: string;
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
		return this.editFilePath ? 'Modifier recette' : 'Nouvelle recette';
	}

	async setState(state: NewRecipeViewState, result: unknown) {
		this.editFilePath = state.editFilePath;
		this.prefilledValues = state.prefilledValues;
		this.templateKey = state.templateKey;
		this.history = state.history ?? [];
		this.render();
		return super.setState(state, result as never);
	}

	getState(): NewRecipeViewState {
		return { editFilePath: this.editFilePath, prefilledValues: this.prefilledValues, templateKey: this.templateKey, history: this.history };
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
					initialValues = recipeToFormValues(recipe, this.editFilePath, this.plugin.settings.recipesFolder);
				}
			}
		} else if (this.prefilledValues) {
			initialValues = this.prefilledValues;
		}

		this.root.render(
			<RecipeForm
				key={this.editFilePath ?? this.templateKey ?? 'new'}
				app={this.app}
				recipesFolder={this.plugin.settings.recipesFolder}
				ingredientsFolder={this.plugin.settings.ingredientsFolder}
				recipeImagesFolder={this.plugin.settings.recipeImagesFolder}
				anthropicApiKey={this.plugin.settings.anthropicApiKey}
				anthropicModel={this.plugin.settings.anthropicModel}
				onSubmit={(values) => this.handleSubmit(values)}
				onClose={() => this.handleClose()}
				initialValues={initialValues}
				submitLabel={this.editFilePath ? 'Enregistrer les modifications' : 'Créer la recette'}
			/>
		);
	}

	// Builds the target file path for a recipe, given its name and chosen subfolder.
	private buildPath(name: string, subfolder: string): string {
		const folder = this.plugin.settings.recipesFolder;
		return subfolder.trim() === '' ? `${folder}/${name}.md` : `${folder}/${subfolder}/${name}.md`;
	}

	async handleSubmit(values: RecipeFormValues) {
		const { recipe, errors } = formValuesToRecipe(values);

		if (errors.length > 0) {
			new ErrorModal(this.app, errors).open();
			return;
		}

		const normalizedName = lowerFirstLetter(recipe!.name);
		const newPath = this.buildPath(normalizedName, values.subfolder);

		if (this.editFilePath) {
			const file = this.app.vault.getAbstractFileByPath(this.editFilePath);
			if (!(file instanceof TFile)) return;

			// If the target path differs from the current one (name or subfolder
			// changed), move the file first — Obsidian's rename() handles both
			// renaming and moving to a different folder via the same call, and
			// automatically updates any [[links]] pointing to this file.
			if (newPath !== this.editFilePath) {
				const targetFolder = newPath.slice(0, newPath.lastIndexOf('/'));
				if (!this.app.vault.getAbstractFileByPath(targetFolder)) {
					new ErrorModal(this.app, [`Le sous-dossier "${values.subfolder}" n'existe pas.`]).open();
					return;
				}

				const existing = this.app.vault.getAbstractFileByPath(newPath);
				if (existing) {
					new Notice(`Une recette "${normalizedName}" existe déjà à cet emplacement.`);
					return;
				}

				await this.app.vault.rename(file, newPath);
			}

			await this.app.vault.modify(file, buildRecipeMarkdown({ ...recipe!, name: normalizedName }));
			new Notice(`Recette "${normalizedName}" mise à jour.`);

			await navigateBack(this.leaf);
		} else {
			const existing = this.app.vault.getAbstractFileByPath(newPath);
			if (existing) {
				new Notice(`Une recette "${normalizedName}" existe déjà.`);
				return;
			}

			await this.app.vault.create(newPath, buildRecipeMarkdown({ ...recipe!, name: normalizedName }));
			new Notice(`Recette "${normalizedName}" créée.`);

			await this.leaf.setViewState({
				type: RECIPE_VIEW_TYPE,
				active: true,
				state: { filePath: newPath, history: [] },
			});
		}
	}

	async onClose() {
		this.root?.unmount();
	}
}
