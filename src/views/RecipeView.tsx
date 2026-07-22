import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { parseRecipeFromFrontmatter } from '../models/parseRecipe';
import { RecipeDetails } from '../components/RecipeDetails';
import type MyPlugin from '../main';
import { buildRecipeMarkdown } from '../models/buildRecipeMarkdown';

export const RECIPE_VIEW_TYPE = 'recipe-view';

export class RecipeView extends ItemView {
	private filePath?: string;
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

	async setState(state: { filePath?: string }, result: unknown) {
		this.filePath = state.filePath;
		this.render();
		return super.setState(state, result as never);
	}

	getState(): { filePath?: string } {
		return { filePath: this.filePath };
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		this.root = createRoot(container);

		// Recipe images always live in a fixed "Images" subfolder inside the
		// configurable recipes folder — e.g. "Recettes/Images" if recipesFolder
		// is "Recettes". Created automatically if missing.
		const imagesFolder = `${this.plugin.settings.recipesFolder}/Images`;
		if (!this.app.vault.getAbstractFileByPath(imagesFolder)) {
			await this.app.vault.createFolder(imagesFolder);
		}
		this.render();

		this.registerEvent(
			this.app.metadataCache.on('changed', (file) => {
				if (file.path === this.filePath) {
					this.render();
				}
			})
		);
	}

	handleIngredientClick(ingredientName: string) {
		const path = `${this.plugin.settings.ingredientsFolder}/${ingredientName}.md`;
		const existing = this.app.vault.getAbstractFileByPath(path);

		if (existing) {
			this.plugin.activateIngredientView(path, this.filePath);
		} else {
			this.plugin.activateNewIngredientView(ingredientName, this.filePath);
		}
	}

	ingredientExists(ingredientName: string): boolean {
		const path = `${this.plugin.settings.ingredientsFolder}/${ingredientName}.md`;
		return this.app.vault.getAbstractFileByPath(path) !== null;
	}

	// Rewrites the recipe note with one instruction section's content updated.
// Reads the current recipe fresh (not from a stale render-time variable),
// so concurrent edits to other fields aren't accidentally overwritten.
	async handleSaveInstructionSection(sectionIndex: number, newContent: string) {
		if (!this.filePath) return;
		const file = this.app.vault.getAbstractFileByPath(this.filePath);
		if (!(file instanceof TFile)) return;

		const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
		const { recipe } = parseRecipeFromFrontmatter(frontmatter, file.basename);
		if (!recipe) return; // shouldn't happen if the view is already displaying this recipe successfully

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
