import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { IngredientViewContainer } from '../components/IngredientViewContainer';
import { parseIngredientFromFrontmatter } from '../models/parseIngredientFromFrontmatter';
import type MyPlugin from '../main';
import { NavigableViewState, NavigationEntry, canNavigateBack, closeOrGoBack } from '../navigation';

export const INGREDIENT_VIEW_TYPE = 'ingredient-view';

// This view's state now includes `history` (via NavigableViewState), on top
// of its own specific field (filePath). See navigation.ts for the full
// explanation of how back-navigation works across all our views.
interface IngredientViewState extends NavigableViewState {
	filePath?: string;
}

export class IngredientView extends ItemView {
	private filePath?: string;
	private history: NavigationEntry[] = [];
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
		this.history = state.history ?? [];
		this.leaf.updateHeader();
		this.render();
		return super.setState(state, result as never);
	}

	getState(): IngredientViewState {
		return { filePath: this.filePath, history: this.history };
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

	// If we got here by navigating from another view (history is non-empty),
	// go back to that view. Otherwise (opened fresh, e.g. via command), just
	// close this leaf — there's nothing in our navigation stack to return to.
	handleClose() {
		closeOrGoBack(this.leaf, this.history);
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
				// Reusing canNavigateBack as our "read-only" signal: if we navigated
				// here from another screen (e.g. a recipe's ingredient link), we're
				// just viewing — editing is reserved for direct access (e.g. via
				// the command palette, which starts with an empty history).
				readOnly={canNavigateBack({ history: this.history })}
				onClose={() => this.handleClose()}
			/>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
