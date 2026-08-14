import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import type MyPlugin from '../main';
import { listAllRecipes } from '../models/listAllRecipes';
import { RecipeListDisplay } from '../components/RecipeListDisplay';
import { navigateTo } from '../navigation';
import { RECIPE_VIEW_TYPE } from './RecipeView';
import { searchIngredientNames } from '../models/searchIngredientNames';
import { normalizeForSearch } from '../models/textNormalize';
import { NavigableViewState, NavigationEntry, canNavigateBack, closeOrGoBack } from '../navigation';
import { computeRecipeDietFlags } from '../models/computeRecipeDietFlags';
import { parseRecipeFromFrontmatter } from '../models/parseRecipe';
import { t } from '../i18n/strings';
import { LanguageProvider } from '../i18n/LanguageContext';

export const RECIPE_LIST_VIEW_TYPE = 'recipe-list-view';

interface RecipeListViewState extends NavigableViewState {
	searchQuery?: string;
	selectedTags?: string[]; // serialized as an array — Set isn't JSON-friendly for state persistence
	ingredientQuery?: string;
	sortKey?: 'name' | 'duration' | 'cooked';
	sortDirection?: 'asc' | 'desc';
	scrollTop?: number;
}

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
	private tagMenuOpen = false;
	private sortKey: 'name' | 'duration' | 'cooked' | 'created' = 'name';
	private sortDirection: 'asc' | 'desc' = 'asc';
	private closeAction!: HTMLElement;
	private excludedDietFlags: Set<string> = new Set();
	private dietMenuOpen = false;
	private scrollTop = 0;


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
		this.app.workspace.requestSaveLayout();
		this.render();
	}

	private async togglePinnedTag(tag: string) {
		const current = this.plugin.settings.pinnedTags;
		this.plugin.settings.pinnedTags = current.includes(tag)
			? current.filter((t) => t !== tag)
			: [...current, tag];
		await this.plugin.saveSettings();
		this.render();
	}

	private toggleTagMenu() {
		this.tagMenuOpen = !this.tagMenuOpen;
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
		return t('recipeListView.title', this.plugin.settings.language);
	}

	async setState(state: RecipeListViewState, result: unknown) {
		this.history = state.history ?? [];
		this.searchQuery = state.searchQuery ?? '';
		this.selectedTags = new Set(state.selectedTags ?? []);
		this.ingredientQuery = state.ingredientQuery ?? '';
		this.ingredientInput = state.ingredientQuery ?? '';
		this.sortKey = state.sortKey ?? 'name';
		this.sortDirection = state.sortDirection ?? 'asc';
		this.scrollTop = state.scrollTop ?? 0;
		this.updateCloseAction();
		this.render();
		// Restore scroll position after React has painted the list — a plain
		// render() call is synchronous but the DOM update it triggers isn't
		// guaranteed to be flushed yet, so we wait a frame.
		requestAnimationFrame(() => {
			const container = this.containerEl.children[1] as HTMLElement;
			container.scrollTop = this.scrollTop;
		});
		return super.setState(state, result as never);
	}

	getState(): RecipeListViewState {
		return {
			history: this.history,
			searchQuery: this.searchQuery,
			selectedTags: Array.from(this.selectedTags),
			ingredientQuery: this.ingredientQuery,
			sortKey: this.sortKey,
			sortDirection: this.sortDirection,
			scrollTop: this.scrollTop,
		};
	}

	private updateCloseAction(): void {
		if (!this.closeAction) return;
		const language = this.plugin.settings.language;
		this.closeAction.setAttribute('aria-label', canNavigateBack({ history: this.history }) ? t('recipeListView.closeAction.back', language) : t('recipeListView.closeAction.close', language));
	}

	async onOpen() {
		this.closeAction = this.addAction('arrow-left', t('recipeListView.closeAction.close', this.plugin.settings.language), () => {
			closeOrGoBack(this.leaf, this.history);
		});
		this.closeAction.addClass('header-button');
		const container = this.containerEl.children[1] as HTMLElement;
		this.root = createRoot(container);

		container.addEventListener('scroll', () => {
			this.scrollTop = container.scrollTop;
		});

		this.render();
	}

	private toggleSort(key: 'name' | 'duration' | 'cooked') {
		if (this.sortKey === key) {
			this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			this.sortKey = key;
			this.sortDirection = 'asc';
		}
		this.app.workspace.requestSaveLayout();
		this.render();
	}
	private totalDurationMin(recipe: RecipeSummary): number {
		return (recipe.preparationDurationMin ?? 0) + (recipe.cookingDurationMin ?? 0);
	}

	private toggleDietFlag(flag: string) {
		if (this.excludedDietFlags.has(flag)) {
			this.excludedDietFlags.delete(flag);
		} else {
			this.excludedDietFlags.add(flag);
		}
		this.app.workspace.requestSaveLayout();
		this.render();
	}

	private applyDietPreset(flags: string[]) {
		this.excludedDietFlags = new Set(flags);
		this.app.workspace.requestSaveLayout();
		this.render();
	}

	private toggleDietMenu() {
		this.dietMenuOpen = !this.dietMenuOpen;
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

		const ingredientFiltered = this.ingredientQuery.trim() === ''
			? tagFiltered
			: tagFiltered.filter((r) =>
				r.ingredientNames.some((name) => normalizeForSearch(name) === normalizeForSearch(this.ingredientQuery))
			);

		// Diet filter: excludes any recipe that contains at least one of the
		// checked flags anywhere in its composition (own ingredients + base
		// recipes, recursively). Chained AFTER the ingredient filter, so all
		// filters combine in AND.
		const filtered = this.excludedDietFlags.size === 0
			? ingredientFiltered
			: ingredientFiltered.filter((r) => {
				const file = this.app.vault.getAbstractFileByPath(r.filePath);
				if (!(file instanceof TFile)) return true;
				const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
				const { recipe } = parseRecipeFromFrontmatter(frontmatter, file.basename);
				if (!recipe) return true;

				const { flags } = computeRecipeDietFlags(
					this.app,
					this.plugin.settings.ingredientsFolder,
					this.plugin.settings.recipesFolder,
					recipe
				);

				return !Array.from(this.excludedDietFlags).some((excluded) => flags.has(excluded));
			});

		const sorted = [...filtered].sort((a, b) => {
			let comparison = 0;
			if (this.sortKey === 'name') {
				comparison = a.name.localeCompare(b.name);
			} else if (this.sortKey === 'duration') {
				comparison = this.totalDurationMin(a) - this.totalDurationMin(b);
			} else if (this.sortKey === 'created') {
				comparison = a.createdTime - b.createdTime;
			} else {
				comparison = (a.madeBeforeTracking ? 1 : 0) - (b.madeBeforeTracking ? 1 : 0);
				if (comparison === 0) {
					comparison = a.cookedCount - b.cookedCount;
				}
			}
			return this.sortDirection === 'asc' ? comparison : -comparison;
		});

		const language = this.plugin.settings.language;

		this.root.render(
			<LanguageProvider value={language}>
			<div>
				<div className="recipe-list-sticky-header">
					<div className="recipe-list-search-row">
						<input
							type="text"
							placeholder={t('recipeListView.search.placeholder', this.plugin.settings.language)}
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
								placeholder={t('recipeListView.ingredientFilter.placeholder', this.plugin.settings.language)}
								value={this.ingredientInput}
								onChange={(e) => this.handleIngredientInputChange(e.target.value)}
								onKeyDown={(e) => this.handleIngredientKeyDown(e)}
								className="recipe-list-search"
							/>
							{this.ingredientQuery && (
								<button type="button" onClick={() => this.clearIngredientFilter()} title={t('recipeListView.ingredientFilter.remove', this.plugin.settings.language)}>✕</button>
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

					<div className="recipe-list-filter-buttons-row">
						<div className="recipe-list-tag-menu-wrapper">
							<button
								type="button"
								onClick={() => this.toggleDietMenu()}
								className="recipe-list-tag-menu-button"
							>
								{t('recipeListView.constraints', this.plugin.settings.language)} {this.excludedDietFlags.size > 0 ? `(${this.excludedDietFlags.size})` : ''}
							</button>

							{this.dietMenuOpen && (
								<ul className="recipe-list-tag-menu">
									{this.plugin.settings.dietPresets.map((preset) => (
										<li
											key={`preset-${preset.name}`}
											onClick={() => this.applyDietPreset(preset.flags)}
											className="recipe-list-tag-menu-item recipe-list-preset-item"
										>
											★ {preset.name}
										</li>
									))}
									{this.plugin.settings.dietFlags.map((flag) => (
										<li
											key={flag}
											onClick={() => this.toggleDietFlag(flag)}
											className="recipe-list-tag-menu-item"
										>
											<input type="checkbox" checked={this.excludedDietFlags.has(flag)} readOnly />
											{t('recipeListView.constraints.without', this.plugin.settings.language).replace('{flag}', flag)}
										</li>
									))}
								</ul>
							)}
						</div>

						{allTags.length > 0 && (
							<div className="recipe-list-tag-menu-wrapper recipe-list-tags-wrapper">
								<button
									type="button"
									onClick={() => this.toggleTagMenu()}
									className="recipe-list-tag-menu-button"
								>
									{t('recipeListView.tags', this.plugin.settings.language)} {this.selectedTags.size > 0 ? `(${this.selectedTags.size})` : ''}
								</button>

								{this.tagMenuOpen && (
									<ul className="recipe-list-tag-menu">
										{allTags.map((tag) => (
											<li
												key={tag}
												className="recipe-list-tag-menu-item"
											>
							<span onClick={() => this.toggleTag(tag)} className="recipe-list-tag-menu-item-label">
								<input type="checkbox" checked={this.selectedTags.has(tag)} readOnly />
								{tag}
							</span>
												<button
													type="button"
													onClick={(e) => { e.stopPropagation(); this.togglePinnedTag(tag); }}
													className="recipe-list-pin-button"
													title={this.plugin.settings.pinnedTags.includes(tag) ? t('recipeListView.tags.unpin', this.plugin.settings.language) : t('recipeListView.tags.pin', this.plugin.settings.language)}
												>
													{this.plugin.settings.pinnedTags.includes(tag) ? '📌' : '📍'}
												</button>
											</li>
										))}
									</ul>
								)}
							</div>
						)}

						{this.plugin.settings.pinnedTags
							.filter((tag) => allTags.includes(tag))
							.map((tag) => (
								<button
									key={tag}
									type="button"
									onClick={() => this.toggleTag(tag)}
									className={this.selectedTags.has(tag) ? 'recipe-list-pinned-tag recipe-list-pinned-tag-active' : 'recipe-list-pinned-tag'}
								>
									{tag}
								</button>
							))}
					</div>

					<div className="recipe-list-row recipe-list-header-row">
						<div className="recipe-list-cell-name recipe-list-sortable" onClick={() => this.toggleSort('name')}>
							{t('recipeListView.column.name', language)}{this.sortKey === 'name' ? (this.sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
						</div>
						<div className="recipe-list-cell-duration recipe-list-sortable" onClick={() => this.toggleSort('duration')}>
							{t('recipeListView.column.duration', language)}{this.sortKey === 'duration' ? (this.sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
						</div>
						<div className="recipe-list-cell-created recipe-list-sortable" onClick={() => this.toggleSort('created')}>
							{t('recipeListView.column.created', language)} {this.sortKey === 'created' ? (this.sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
						</div>
						<div className="recipe-list-cell-cooked recipe-list-sortable" onClick={() => this.toggleSort('cooked')}>
							#{this.sortKey === 'cooked' ? (this.sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
						</div>
					</div>
				</div>

				<RecipeListDisplay
					app={this.app}
					recipes={sorted}
					onRecipeClick={(filePath) => {
						navigateTo(this.leaf, RECIPE_VIEW_TYPE, { filePath });
					}}
				/>
			</div>
			</LanguageProvider>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
