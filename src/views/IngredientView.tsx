import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { IngredientViewContainer } from '../components/IngredientViewContainer';
import { parseIngredientFromFrontmatter } from '../models/parseIngredientFromFrontmatter';
import type MyPlugin from '../main';

export const INGREDIENT_VIEW_TYPE = 'ingredient-view';

interface IngredientViewState {
	filePath?: string;
}

export class IngredientView extends ItemView {
	private filePath?: string;
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
		// Dynamic tab title: show the file name once we know it, fallback otherwise.
		if (!this.filePath) return 'Ingredient';
		const file = this.app.vault.getAbstractFileByPath(this.filePath);
		return file instanceof TFile ? file.basename : 'Ingredient';
	}

	async setState(state: IngredientViewState, result: unknown) {
		this.filePath = state.filePath;
		this.leaf.updateHeader(); // force Obsidian to re-call getDisplayText()
		this.render();
		return super.setState(state, result as never);
	}

	getState(): IngredientViewState {
		return { filePath: this.filePath };
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		this.root = createRoot(container);
		this.render();
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

		// Validate + parse raw frontmatter into a typed, trustworthy Ingredient object.
		// If errors is non-empty, ingredient is guaranteed to be null (see parseIngredientFromFrontmatter contract).
		const { ingredient, errors, warnings } = parseIngredientFromFrontmatter(
			frontmatter,
			file.basename,
			this.plugin.settings.ingredientTypes,
			this.plugin.settings.shopSections,
		);

		if (errors.length > 0) {
			// Blocking errors: never attempt to render IngredientDetails with invalid data.
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
			/>
		);
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		this.root = createRoot(container);
		this.render();

		// Re-render whenever Obsidian finishes re-parsing a file's metadata —
		// this fires after app.vault.modify() completes and the cache is truly up to date,
		// which is more reliable than calling render() immediately after modify().
		this.registerEvent(
			this.app.metadataCache.on('changed', (file) => {
				if (file.path === this.filePath) {
					this.render();
				}
			})
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}


