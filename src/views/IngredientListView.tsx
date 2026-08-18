import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import type MyPlugin from '../main';
import { listAllIngredients, listUndefinedIngredients, listIngredientsNeedingReview } from '../models/listAllIngredients';
import { IngredientListDisplay } from '../components/IngredientListDisplay';
import { navigateTo } from '../navigation';
import { INGREDIENT_VIEW_TYPE } from './IngredientView';
import { NEW_INGREDIENT_VIEW_TYPE } from './NewIngredientView';
import { RECIPE_VIEW_TYPE } from './RecipeView';
import { NavigableViewState, NavigationEntry, canNavigateBack, closeOrGoBack } from '../navigation';
import { t } from '../i18n/strings';
import { LanguageProvider } from '../i18n/LanguageContext';
import { ConfirmModal } from '../components/ConfirmModal';
import { generateIngredientsInBulk } from '../models/generateIngredientsInBulk';

export const INGREDIENT_LIST_VIEW_TYPE = 'ingredient-list-view';

type SortKey = 'name' | 'type' | 'shopSection' | 'usedInRecipesCount';
type ListMode = 'defined' | 'undefined' | 'needsReview';

interface IngredientListViewState extends NavigableViewState {
	mode?: ListMode;
	searchQuery?: string;
	selectedTypes?: string[];
	excludedDietFlags?: string[];
	sortKey?: SortKey;
	sortDirection?: 'asc' | 'desc';
	scrollTop?: number;
}

export class IngredientListView extends ItemView {
	private plugin: MyPlugin;
	private root: Root | null = null;
	private history: NavigationEntry[] = [];
	private closeAction!: HTMLElement;
	private mode: ListMode = 'defined';
	private searchQuery = '';
	private selectedTypes: Set<string> = new Set();
	private typeMenuOpen = false;
	private excludedDietFlags: Set<string> = new Set();
	private dietMenuOpen = false;
	private sortKey: SortKey = 'name';
	private sortDirection: 'asc' | 'desc' = 'asc';
	private scrollTop = 0;
	private selectedUndefinedNames: Set<string> = new Set();
	private isGenerating = false;

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return INGREDIENT_LIST_VIEW_TYPE;
	}

	getDisplayText(): string {
		return t('ingredientListView.title', this.plugin.settings.language);
	}

	private updateCloseAction(): void {
		if (!this.closeAction) return;
		const language = this.plugin.settings.language;
		this.closeAction.setAttribute('aria-label', canNavigateBack({ history: this.history }) ? t('ingredientListView.closeAction.back', language) : t('ingredientListView.closeAction.close', language));
	}

	async setState(state: IngredientListViewState, result: unknown) {
		this.history = state.history ?? [];
		this.mode = state.mode ?? 'defined';
		this.searchQuery = state.searchQuery ?? '';
		this.selectedTypes = new Set(state.selectedTypes ?? []);
		this.excludedDietFlags = new Set(state.excludedDietFlags ?? []);
		this.sortKey = state.sortKey ?? 'name';
		this.sortDirection = state.sortDirection ?? 'asc';
		this.scrollTop = state.scrollTop ?? 0;
		this.updateCloseAction();
		this.render();
		requestAnimationFrame(() => {
			const container = this.containerEl.children[1] as HTMLElement;
			container.scrollTop = this.scrollTop;
		});
		return super.setState(state, result as never);
	}

	getState(): IngredientListViewState {
		return {
			history: this.history,
			mode: this.mode,
			searchQuery: this.searchQuery,
			selectedTypes: Array.from(this.selectedTypes),
			excludedDietFlags: Array.from(this.excludedDietFlags),
			sortKey: this.sortKey,
			sortDirection: this.sortDirection,
			scrollTop: this.scrollTop,
		};
	}

	async onOpen() {
		this.closeAction = this.addAction('arrow-left', t('ingredientListView.closeAction.close', this.plugin.settings.language), () => {
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

	private setMode(mode: ListMode) {
		this.mode = mode;
		this.selectedUndefinedNames = new Set();
		this.app.workspace.requestSaveLayout();
		this.render();
	}

	private toggleType(type: string) {
		if (this.selectedTypes.has(type)) {
			this.selectedTypes.delete(type);
		} else {
			this.selectedTypes.add(type);
		}
		this.app.workspace.requestSaveLayout();
		this.render();
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

	private toggleSort(key: SortKey) {
		if (this.sortKey === key) {
			this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			this.sortKey = key;
			this.sortDirection = 'asc';
		}
		this.app.workspace.requestSaveLayout();
		this.render();
	}

	private toggleUndefinedSelected(name: string) {
		if (this.selectedUndefinedNames.has(name)) {
			this.selectedUndefinedNames.delete(name);
		} else {
			this.selectedUndefinedNames.add(name);
		}
		this.render();
	}

	private toggleSelectAllUndefined() {
		const undefinedIngredients = listUndefinedIngredients(
			this.app,
			this.plugin.settings.ingredientsFolder,
			this.plugin.settings.recipesFolder
		);
		const allSelected = undefinedIngredients.length > 0 && undefinedIngredients.every((e) => this.selectedUndefinedNames.has(e.name));
		this.selectedUndefinedNames = allSelected ? new Set() : new Set(undefinedIngredients.map((e) => e.name));
		this.render();
	}

	handleUndefinedClick(name: string) {
		navigateTo(this.leaf, NEW_INGREDIENT_VIEW_TYPE, { prefilledName: name });
	}

	handleUndefinedRecipeClick(recipeName: string) {
		const file = this.app.vault
			.getMarkdownFiles()
			.find((f) => f.path.startsWith(this.plugin.settings.recipesFolder + '/') && f.basename === recipeName);
		if (file) {
			navigateTo(this.leaf, RECIPE_VIEW_TYPE, { filePath: file.path });
		}
	}

	handleNeedsReviewClick(filePath: string) {
		navigateTo(this.leaf, INGREDIENT_VIEW_TYPE, { filePath });
	}

	private handleGenerateWithAI() {
		const language = this.plugin.settings.language;
		const names = Array.from(this.selectedUndefinedNames);
		if (names.length === 0) return;

		new ConfirmModal(
			this.app,
			t('ingredientListView.generation.confirm', language).replace('{count}', names.length.toString()),
			async () => {
				this.isGenerating = true;
				this.render();

				const result = await generateIngredientsInBulk(
					this.app,
					this.plugin.settings,
					names,
					(current, total, name) => {
						new Notice(t('ingredientListView.generation.progress', language).replace('{current}', current.toString()).replace('{total}', total.toString()) + ` (${name})`);
					}
				);

				this.isGenerating = false;
				this.selectedUndefinedNames = new Set();

				const failedSuffix = result.failedNames.length > 0
					? t('ingredientListView.generation.failedSuffix', language).replace('{count}', result.failedNames.length.toString())
					: '';
				const tokenSuffix = t('ingredientListView.generation.tokenUsage', language)
					.replace('{input}', result.totalInputTokens.toString())
					.replace('{output}', result.totalOutputTokens.toString());
				new Notice(t('ingredientListView.generation.done', language).replace('{success}', result.successCount.toString()).replace('{failedSuffix}', failedSuffix) + tokenSuffix, 10000);
				if (result.failedNames.length > 0) {
					console.warn('Ingredient generation failures:', result.failedNames);
				}

				this.mode = 'needsReview';
				this.render();
			},
			language,
			t('ingredientListView.generation.confirmButton', language)
		).open();
	}

	render() {
		if (!this.root) return;
		const language = this.plugin.settings.language;

		const definedCount = listAllIngredients(
			this.app,
			this.plugin.settings.ingredientsFolder,
			this.plugin.settings.recipesFolder,
			this.plugin.settings.ingredientTypes,
			this.plugin.settings.shopSections
		).length;
		const undefinedCount = listUndefinedIngredients(this.app, this.plugin.settings.ingredientsFolder, this.plugin.settings.recipesFolder).length;
		const needsReviewCount = listIngredientsNeedingReview(
			this.app,
			this.plugin.settings.ingredientsFolder,
			this.plugin.settings.ingredientTypes,
			this.plugin.settings.shopSections
		).length;

		if (this.mode === 'undefined') {
			const undefinedIngredients = listUndefinedIngredients(
				this.app,
				this.plugin.settings.ingredientsFolder,
				this.plugin.settings.recipesFolder
			);
			const filtered = this.searchQuery.trim() === ''
				? undefinedIngredients
				: undefinedIngredients.filter((n) => n.name.toLowerCase().includes(this.searchQuery.toLowerCase()));

			this.root.render(
				<LanguageProvider value={language}>
					<IngredientListDisplay
						mode="undefined"
						onModeChange={(m) => this.setMode(m)}
						definedCount={definedCount}
						undefinedCount={undefinedCount}
						needsReviewCount={needsReviewCount}
						searchQuery={this.searchQuery}
						onSearchQueryChange={(v) => { this.searchQuery = v; this.render(); }}
						undefinedIngredients={filtered}
						selectedUndefinedNames={this.selectedUndefinedNames}
						onToggleUndefinedSelected={(name) => this.toggleUndefinedSelected(name)}
						onToggleSelectAllUndefined={() => this.toggleSelectAllUndefined()}
						onGenerateWithAI={() => this.handleGenerateWithAI()}
						isGenerating={this.isGenerating}
						onUndefinedClick={(name) => this.handleUndefinedClick(name)}
						onUndefinedRecipeClick={(name) => this.handleUndefinedRecipeClick(name)}
						ingredients={[]}
						needsReviewIngredients={[]}
						onNeedsReviewClick={() => {}}
						allTypes={[]}
						selectedTypes={this.selectedTypes}
						onToggleType={() => {}}
						typeMenuOpen={false}
						onToggleTypeMenu={() => {}}
						allDietFlags={[]}
						excludedDietFlags={this.excludedDietFlags}
						onToggleDietFlag={() => {}}
						dietMenuOpen={false}
						onToggleDietMenu={() => {}}
						onIngredientClick={() => {}}
						sortKey={this.sortKey}
						sortDirection={this.sortDirection}
						onToggleSort={() => {}}
					/>
				</LanguageProvider>
			);
			return;
		}

		if (this.mode === 'needsReview') {
			const needsReviewIngredients = listIngredientsNeedingReview(
				this.app,
				this.plugin.settings.ingredientsFolder,
				this.plugin.settings.ingredientTypes,
				this.plugin.settings.shopSections
			);

			this.root.render(
				<LanguageProvider value={language}>
					<IngredientListDisplay
						mode="needsReview"
						onModeChange={(m) => this.setMode(m)}
						definedCount={definedCount}
						undefinedCount={undefinedCount}
						needsReviewCount={needsReviewCount}
						searchQuery={this.searchQuery}
						onSearchQueryChange={() => {}}
						undefinedIngredients={[]}
						selectedUndefinedNames={new Set()}
						onToggleUndefinedSelected={() => {}}
						onToggleSelectAllUndefined={() => {}}
						onGenerateWithAI={() => {}}
						isGenerating={false}
						onUndefinedClick={() => {}}
						onUndefinedRecipeClick={() => {}}
						ingredients={[]}
						needsReviewIngredients={needsReviewIngredients}
						onNeedsReviewClick={(filePath) => this.handleNeedsReviewClick(filePath)}
						allTypes={[]}
						selectedTypes={this.selectedTypes}
						onToggleType={() => {}}
						typeMenuOpen={false}
						onToggleTypeMenu={() => {}}
						allDietFlags={[]}
						excludedDietFlags={this.excludedDietFlags}
						onToggleDietFlag={() => {}}
						dietMenuOpen={false}
						onToggleDietMenu={() => {}}
						onIngredientClick={() => {}}
						sortKey={this.sortKey}
						sortDirection={this.sortDirection}
						onToggleSort={() => {}}
					/>
				</LanguageProvider>
			);
			return;
		}

		// mode === 'defined'
		const allIngredients = listAllIngredients(
			this.app,
			this.plugin.settings.ingredientsFolder,
			this.plugin.settings.recipesFolder,
			this.plugin.settings.ingredientTypes,
			this.plugin.settings.shopSections
		);

		const searchFiltered = this.searchQuery.trim() === ''
			? allIngredients
			: allIngredients.filter((i) => i.name.toLowerCase().includes(this.searchQuery.toLowerCase()));

		const typeFiltered = this.selectedTypes.size === 0
			? searchFiltered
			: searchFiltered.filter((i) => this.selectedTypes.has(i.type));

		const dietFiltered = this.excludedDietFlags.size === 0
			? typeFiltered
			: typeFiltered.filter((i) => {
				const file = this.app.vault.getAbstractFileByPath(i.filePath);
				const frontmatter = file ? this.app.metadataCache.getFileCache(file as any)?.frontmatter : undefined;
				const flags: string[] = Array.isArray(frontmatter?.diet_flags) ? frontmatter.diet_flags : [];
				return !Array.from(this.excludedDietFlags).some((excluded) => flags.includes(excluded));
			});

		const sorted = [...dietFiltered].sort((a, b) => {
			let comparison = 0;
			if (this.sortKey === 'name') {
				comparison = a.name.localeCompare(b.name);
			} else if (this.sortKey === 'type') {
				comparison = a.type.localeCompare(b.type);
			} else if (this.sortKey === 'shopSection') {
				comparison = a.shopSection.localeCompare(b.shopSection);
			} else {
				comparison = a.usedInRecipesCount - b.usedInRecipesCount;
			}
			return this.sortDirection === 'asc' ? comparison : -comparison;
		});

		this.root.render(
			<LanguageProvider value={language}>
				<IngredientListDisplay
					mode="defined"
					onModeChange={(m) => this.setMode(m)}
					definedCount={definedCount}
					undefinedCount={undefinedCount}
					needsReviewCount={needsReviewCount}
					searchQuery={this.searchQuery}
					onSearchQueryChange={(v) => { this.searchQuery = v; this.render(); }}
					undefinedIngredients={[]}
					selectedUndefinedNames={new Set()}
					onToggleUndefinedSelected={() => {}}
					onToggleSelectAllUndefined={() => {}}
					onGenerateWithAI={() => {}}
					isGenerating={false}
					onUndefinedClick={() => {}}
					onUndefinedRecipeClick={() => {}}
					ingredients={sorted}
					needsReviewIngredients={[]}
					onNeedsReviewClick={() => {}}
					allTypes={this.plugin.settings.ingredientTypes}
					selectedTypes={this.selectedTypes}
					onToggleType={(t) => this.toggleType(t)}
					typeMenuOpen={this.typeMenuOpen}
					onToggleTypeMenu={() => { this.typeMenuOpen = !this.typeMenuOpen; this.render(); }}
					allDietFlags={this.plugin.settings.dietFlags}
					excludedDietFlags={this.excludedDietFlags}
					onToggleDietFlag={(f) => this.toggleDietFlag(f)}
					dietMenuOpen={this.dietMenuOpen}
					onToggleDietMenu={() => { this.dietMenuOpen = !this.dietMenuOpen; this.render(); }}
					onIngredientClick={(filePath) => navigateTo(this.leaf, INGREDIENT_VIEW_TYPE, { filePath })}
					sortKey={this.sortKey}
					sortDirection={this.sortDirection}
					onToggleSort={(key) => this.toggleSort(key)}
				/>
			</LanguageProvider>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
