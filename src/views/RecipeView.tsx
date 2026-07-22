import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { parseRecipeFromFrontmatter } from '../models/parseRecipe';
import { buildRecipeMarkdown } from '../models/buildRecipeMarkdown';
import { RecipeDetails } from '../components/RecipeDetails';
import { INGREDIENT_VIEW_TYPE } from './IngredientView';
import { NEW_INGREDIENT_VIEW_TYPE } from './NewIngredientView';
import { NavigableViewState, NavigationEntry, navigateTo } from '../navigation';
import type MyPlugin from '../main';

export const RECIPE_VIEW_TYPE = 'recipe-view';

interface RecipeViewState extends NavigableViewState {
	filePath?: string;
}

export class RecipeView extends ItemView {
	private filePath?: string;
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
		this.history = state.history ?? [];
		this.render();
		return super.setState(state, result as never);
	}

	getState(): RecipeViewState {
		return { filePath: this.filePath, history: this.history };
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		this.root = createRoot(container);

		// Recipe images always live in a fixed "Images" subfolder inside the
		// configurable recipes folder — created automatically if missing.
		const imagesFolder = `${this.plugin.settings.recipesFolder}/Images`;
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

	// Navigates to an ingredient's view (existing fiche, read-only since we're
	// coming FROM a recipe) or to the ingredient creation form (missing fiche,
	// prefilled with the clicked name) — using the shared navigation stack so
	// a back button can return here afterwards.
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

	async handleSaveInstructionSection(sectionIndex: number, newContent: string) {
		if (!this.filePath) return;
		const file = this.app.vault.getAbstractFileByPath(this.filePath);
		if (!(file instanceof TFile)) return;

		const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
		const { recipe } = parseRecipeFromFrontmatter(frontmatter, file.basename);
		if (!recipe) return;

		const updatedInstructions = recipe.instructions.map((section, index) =>
			index === sectionIndex ? { ...section, content: newContent } : section
		);

		const updatedRecipe = { ...recipe, instructions: updatedInstructions };
		await this.app.vault.modify(file, buildRecipeMarkdown(updatedRecipe));
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
					app={this.app}
					recipe={recipe!}
					onIngredientClick={(name) => this.handleIngredientClick(name)}
					ingredientExists={(name) => this.ingredientExists(name)}
					onSaveInstructionSection={(index, content) => this.handleSaveInstructionSection(index, content)}
					onSaveNotes={(content) => this.handleSaveNotes(content)}
				/>
			</div>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
