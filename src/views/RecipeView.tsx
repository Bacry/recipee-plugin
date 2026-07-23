import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { parseRecipeFromFrontmatter } from '../models/parseRecipe';
import { buildRecipeMarkdown } from '../models/buildRecipeMarkdown';
import { RecipeDetails } from '../components/RecipeDetails';
import { INGREDIENT_VIEW_TYPE } from './IngredientView';
import { NEW_INGREDIENT_VIEW_TYPE } from './NewIngredientView';
import { NEW_RECIPE_VIEW_TYPE } from './NewRecipeView';
import { findUnit, convertQuantity } from '../models/units';
import { NavigableViewState, NavigationEntry, navigateTo, canNavigateBack, closeOrGoBack } from '../navigation';
import type MyPlugin from '../main';

export const RECIPE_VIEW_TYPE = 'recipe-view';

interface RecipeViewState extends NavigableViewState {
	filePath?: string;
	initialServings?: number; // set when opened as a base recipe, scaled to the quantity used by the parent
}

export class RecipeView extends ItemView {
	private filePath?: string;
	private initialServings?: number;
	private history: NavigationEntry[] = [];
	private root: Root | null = null;
	private plugin: MyPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return RECIPE_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Recette';
	}

	async setState(state: RecipeViewState, result: unknown) {
		this.filePath = state.filePath;
		this.initialServings = state.initialServings;
		this.history = state.history ?? [];
		this.render();
		return super.setState(state, result as never);
	}

	getState(): RecipeViewState {
		return { filePath: this.filePath, initialServings: this.initialServings, history: this.history };
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		this.root = createRoot(container);

		const imagesFolder = this.plugin.settings.recipeImagesFolder;
		if (!this.app.vault.getAbstractFileByPath(imagesFolder)) {
			await this.app.vault.createFolder(imagesFolder);
		}

		this.registerEvent(
			this.app.metadataCache.on('changed', (file) => {
				if (file.path === this.filePath) {
					this.render();
				}
			})
		);

		this.render();
	}

	handleIngredientClick(ingredientName: string) {
		const path = `${this.plugin.settings.ingredientsFolder}/${ingredientName}.md`;
		const existing = this.app.vault.getAbstractFileByPath(path);

		if (existing) {
			navigateTo(this.leaf, INGREDIENT_VIEW_TYPE, { filePath: path });
		} else {
			navigateTo(this.leaf, NEW_INGREDIENT_VIEW_TYPE, { prefilledName: ingredientName });
		}
	}

	ingredientExists(ingredientName: string): boolean {
		const path = `${this.plugin.settings.ingredientsFolder}/${ingredientName}.md`;
		return this.app.vault.getAbstractFileByPath(path) !== null;
	}

	// Navigates to a base recipe's view, converting the scaled quantity used
	// here into that recipe's own output unit (its servingsLabel), so the
	// opened view starts scaled to reflect exactly how much of it is used.
	// Falls back to the base recipe's own baseServings if conversion fails
	// for any reason (shouldn't happen — already validated at form-submit time).
	handleBaseRecipeClick(recipeName: string, scaledQuantity: number, unit: string) {
		const path = `${this.plugin.settings.recipesFolder}/${recipeName}.md`;
		const file = this.app.vault.getAbstractFileByPath(path);

		let initialServings: number | undefined;
		if (file instanceof TFile) {
			const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
			const { recipe: baseRecipe } = parseRecipeFromFrontmatter(frontmatter, file.basename);
			if (baseRecipe) {
				const fromUnit = unit === '' ? null : findUnit(unit);
				const targetUnit = findUnit(baseRecipe.servingsLabel);
				const converted = convertQuantity(scaledQuantity, fromUnit, targetUnit);
				if (converted !== null) {
					initialServings = converted;
				}
			}
		}

		navigateTo(this.leaf, RECIPE_VIEW_TYPE, { filePath: path, initialServings });
	}

	handleEdit() {
		if (!this.filePath) return;
		navigateTo(this.leaf, NEW_RECIPE_VIEW_TYPE, { editFilePath: this.filePath });
	}

	handleClose() {
		closeOrGoBack(this.leaf, this.history);
	}

	async handleSaveNotes(newContent: string) {
		if (!this.filePath) return;
		const file = this.app.vault.getAbstractFileByPath(this.filePath);
		if (!(file instanceof TFile)) return;

		const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
		const { recipe } = parseRecipeFromFrontmatter(frontmatter, file.basename);
		if (!recipe) return;

		const updatedRecipe = { ...recipe, notes: newContent };
		await this.app.vault.modify(file, buildRecipeMarkdown(updatedRecipe));
	}

	render() {
		if (!this.root) return;

		if (!this.filePath) {
			this.root.render(<p>Aucun fichier sélectionné.</p>);
			return;
		}

		const file = this.app.vault.getAbstractFileByPath(this.filePath);
		if (!(file instanceof TFile)) {
			this.root.render(<p>Fichier introuvable : {this.filePath}</p>);
			return;
		}

		const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
		const { recipe, errors, warnings } = parseRecipeFromFrontmatter(frontmatter, file.basename);

		if (errors.length > 0) {
			this.root.render(
				<div>
					<h4>Cette recette contient des erreurs :</h4>
					<ul>
						{errors.map((error, index) => (
							<li key={index} className="ingredient-validation-error">{error}</li>
						))}
					</ul>
				</div>
			);
			return;
		}

		const readOnly = canNavigateBack({ history: this.history });

		this.root.render(
			<div>
				{warnings.length > 0 && (
					<ul className="ingredient-validation-warnings">
						{warnings.map((warning, index) => (
							<li key={index}>{warning}</li>
						))}
					</ul>
				)}
				<RecipeDetails
					key={`${this.filePath}-${this.initialServings ?? ''}`}
					app={this.app}
					recipe={recipe!}
					ingredientsFolder={this.plugin.settings.ingredientsFolder}
					recipesFolder={this.plugin.settings.recipesFolder}
					initialServings={this.initialServings}
					onIngredientClick={(name) => this.handleIngredientClick(name)}
					ingredientExists={(name) => this.ingredientExists(name)}
					onBaseRecipeClick={(name, qty, unit) => this.handleBaseRecipeClick(name, qty, unit)}
					onSaveNotes={(content) => this.handleSaveNotes(content)}
					onEdit={readOnly ? undefined : () => this.handleEdit()}
					onClose={() => this.handleClose()}
				/>
			</div>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
