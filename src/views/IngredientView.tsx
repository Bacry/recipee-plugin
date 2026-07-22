import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { IngredientViewContainer } from '../components/IngredientViewContainer';
import { parseIngredientFromFrontmatter } from '../models/parseIngredientFromFrontmatter';
import type MyPlugin from '../main';

export const INGREDIENT_VIEW_TYPE = 'ingredient-view';

interface IngredientViewState {
	filePath?: string;
	returnToPath?: string; // set when opened from a recipe's ingredient link — used by the close button
}

export class IngredientView extends ItemView {
	private filePath?: string;
	private returnToPath?: string;
	private root: Root | null = null;
	private plugin: MyPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return INGREDIENT_VIEW_TYPE;
	}

	getDisplayText(): string {
		if (!this.filePath) return 'Ingredient';
		const file = this.app.vault.getAbstractFileByPath(this.filePath);
		return file instanceof TFile ? file.basename : 'Ingredient';
	}

	async setState(state: IngredientViewState, result: unknown) {
		this.filePath = state.filePath;
		this.returnToPath = state.returnToPath;
		this.leaf.updateHeader();
		this.render();
		return super.setState(state, result as never);
	}

	getState(): IngredientViewState {
		return { filePath: this.filePath, returnToPath: this.returnToPath };
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		this.root = createRoot(container);

		this.registerEvent(
			this.app.metadataCache.on('changed', (file) => {
				if (file.path === this.filePath) {
					this.render();
				}
			})
		);

		this.render();
	}

	// Closes back to the originating recipe if there is one, otherwise
	// just closes this tab — simulates browser-style "back" navigation.
	handleClose() {
		if (this.returnToPath) {
			this.plugin.activateRecipeView(this.returnToPath);
		} else {
			this.leaf.detach();
		}
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

		const { ingredient, errors, warnings } = parseIngredientFromFrontmatter(
			frontmatter,
			file.basename,
			this.plugin.settings.ingredientTypes,
			this.plugin.settings.shopSections,
		);

		if (errors.length > 0) {
			this.root.render(
				<div>
					<h4>Cette note contient des erreurs :</h4>
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
			<IngredientViewContainer
				app={this.app}
				file={file}
				ingredient={ingredient!}
				warnings={warnings}
				ingredientTypes={this.plugin.settings.ingredientTypes}
				shopSections={this.plugin.settings.shopSections}
				usdaApiKey={this.plugin.settings.usdaApiKey}
				readOnly={this.returnToPath !== undefined} // no editing when viewed from a recipe link
				onClose={() => this.handleClose()}
			/>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
