import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { IngredientDetails } from '../components/IngredientDetails';
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
		if (!this.filePath) return 'Ingredient';
		const file = this.app.vault.getAbstractFileByPath(this.filePath);
		return file instanceof TFile ? file.basename : 'Ingredient';
	}

	async setState(state: IngredientViewState, result: unknown) {
		this.filePath = state.filePath;
		this.leaf.updateHeader();
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
			<div>
				{warnings.length > 0 && (
					<ul className="ingredient-validation-warnings">
						{warnings.map((warning, index) => (
							<li key={index}>{warning}</li>
						))}
					</ul>
				)}
				<IngredientDetails
					name={ingredient!.name}
					type={ingredient!.type}
					shopSection={ingredient!.shop_section}
					densityGMl={ingredient!.density_g_ml}
					entityWeightG={ingredient!.entity_weight_g}
					possibleForms={ingredient!.possible_forms}
					nutrition={ingredient!.nutrition_per_100g}
				/>
			</div>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
