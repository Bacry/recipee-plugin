import { ItemView, WorkspaceLeaf } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { NavigableViewState, NavigationEntry } from '../navigation';
import type MyPlugin from '../main';
import { listAllRecipes } from '../models/listAllRecipes';
import { RecipeListDisplay } from '../components/RecipeListDisplay';
import { navigateTo } from '../navigation';
import { RECIPE_VIEW_TYPE } from './RecipeView';
import { searchIngredientNames } from '../models/searchIngredientNames';
import { normalizeForSearch } from '../models/textNormalize';

export const RECIPE_LIST_VIEW_TYPE = 'recipe-list-view';

interface RecipeListViewState extends NavigableViewState {}

export class RecipeListView extends ItemView {
	private plugin: MyPlugin;
	private root: Root | null = null;
	private history: NavigationEntry[] = [];
	private searchQuery = '';
	private selectedTags: Set<string> = new Set();
	private ingredientQuery = ''; // committed filter value — only set once a suggestion is picked or Enter is pressed
	private ingredientInput = ''; // raw text currently typed, before commit
	private ingredientSuggestions: string[] = [];
	private ingredientHighlightedIndex = -1;

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	private toggleTag(tag: string) {
		if (this.selectedTags.has(tag)) {
			this.selectedTags.delete(tag);
		} else {
			this.selectedTags.add(tag);
		}
		this.render();
	}
	private handleIngredientInputChange(value: string) {
		this.ingredientInput = value;
		this.ingredientSuggestions = value.trim().length >= 2
			? searchIngredientNames(this.app, this.plugin.settings.ingredientsFolder, value)
			: [];
		this.ingredientHighlightedIndex = -1;
		this.render();
	}

	private commitIngredientFilter(name: string) {
		this.ingredientQuery = name;
		this.ingredientInput = name;
		this.ingredientSuggestions = [];
		this.ingredientHighlightedIndex = -1;
		this.render();
	}

	private handleIngredientKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === 'ArrowDown' && this.ingredientSuggestions.length > 0) {
			e.preventDefault();
			this.ingredientHighlightedIndex = Math.min(this.ingredientHighlightedIndex + 1, this.ingredientSuggestions.length - 1);
			this.render();
			return;
		}
		if (e.key === 'ArrowUp' && this.ingredientSuggestions.length > 0) {
			e.preventDefault();
			this.ingredientHighlightedIndex = Math.max(this.ingredientHighlightedIndex - 1, -1);
			this.render();
			return;
		}
		if (e.key === 'Enter') {
			const target = this.ingredientHighlightedIndex >= 0
				? this.ingredientSuggestions[this.ingredientHighlightedIndex]
				: this.ingredientSuggestions[0];
			if (target) this.commitIngredientFilter(target);
		}
	}

	private clearIngredientFilter() {
		this.ingredientQuery = '';
		this.ingredientInput = '';
		this.ingredientSuggestions = [];
		this.render();
	}

	getViewType(): string {
		return RECIPE_LIST_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Recettes';
	}

	async setState(state: RecipeListViewState, result: unknown) {
		this.history = state.history ?? [];
		this.render();
		return super.setState(state, result as never);
	}

	getState(): RecipeListViewState {
		return { history: this.history };
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		this.root = createRoot(container);
		this.render();
	}
	render() {
		if (!this.root) return;

		const allRecipes = listAllRecipes(this.app, this.plugin.settings.recipesFolder);
		const allTags = Array.from(new Set(allRecipes.flatMap((r) => r.tags))).sort((a, b) => a.localeCompare(b));

		const searchFiltered = this.searchQuery.trim() === ''
			? allRecipes
			: allRecipes.filter((r) => r.name.toLowerCase().includes(this.searchQuery.toLowerCase()));

		const tagFiltered = this.selectedTags.size === 0
			? searchFiltered
			: searchFiltered.filter((r) => Array.from(this.selectedTags).every((tag) => r.tags.includes(tag)));

		// Ingredient filter: recipe must include this exact ingredient name
		// (accent/case-insensitive), combined in AND with the other filters.
		const filtered = this.ingredientQuery.trim() === ''
			? tagFiltered
			: tagFiltered.filter((r) =>
				r.ingredientNames.some((name) => normalizeForSearch(name) === normalizeForSearch(this.ingredientQuery))
			);

		this.root.render(
			<div>
				<div className="recipe-list-search-row">
					<input
						type="text"
						placeholder="Rechercher une recette..."
						value={this.searchQuery}
						onChange={(e) => {
							this.searchQuery = e.target.value;
							this.render();
						}}
						className="recipe-list-search"
					/>

					<div className="recipe-list-ingredient-filter-wrapper">
						<input
							type="text"
							placeholder="Filtrer par ingrédient..."
							value={this.ingredientInput}
							onChange={(e) => this.handleIngredientInputChange(e.target.value)}
							onKeyDown={(e) => this.handleIngredientKeyDown(e)}
							className="recipe-list-search"
						/>
						{this.ingredientQuery && (
							<button type="button" onClick={() => this.clearIngredientFilter()} title="Retirer le filtre">✕</button>
						)}
						{this.ingredientSuggestions.length > 0 && (
							<ul className="smart-shopping-suggestions">
								{this.ingredientSuggestions.map((suggestion, index) => (
									<li
										key={suggestion}
										className={index === this.ingredientHighlightedIndex ? 'smart-shopping-suggestion-highlighted' : ''}
										onMouseEnter={() => {
											this.ingredientHighlightedIndex = index;
											this.render();
										}}
										onClick={() => this.commitIngredientFilter(suggestion)}
									>
										{suggestion}
									</li>
								))}
							</ul>
						)}
					</div>
				</div>

				{allTags.length > 0 && (
					<div className="recipe-list-tag-filters">
						{allTags.map((tag) => (
							<span
								key={tag}
								className={`recipe-tag recipe-list-tag-filter ${this.selectedTags.has(tag) ? 'recipe-list-tag-filter-active' : ''}`}
								onClick={() => this.toggleTag(tag)}
							>
							{tag}
						</span>
						))}
					</div>
				)}

				<RecipeListDisplay
					app={this.app}
					recipes={filtered}
					onRecipeClick={(filePath) => {
						navigateTo(this.leaf, RECIPE_VIEW_TYPE, { filePath });
					}}
				/>
			</div>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
