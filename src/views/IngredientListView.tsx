import { ItemView, WorkspaceLeaf } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import type MyPlugin from '../main';
import { listAllIngredients, listUndefinedIngredients } from '../models/listAllIngredients';
import { IngredientListDisplay } from '../components/IngredientListDisplay';
import { navigateTo } from '../navigation';
import { INGREDIENT_VIEW_TYPE } from './IngredientView';
import { NEW_INGREDIENT_VIEW_TYPE } from './NewIngredientView';
import { RECIPE_VIEW_TYPE } from './RecipeView';
import { NavigableViewState, NavigationEntry, canNavigateBack, closeOrGoBack } from '../navigation';

export const INGREDIENT_LIST_VIEW_TYPE = 'ingredient-list-view';

type SortKey = 'name' | 'type' | 'shopSection' | 'usedInRecipesCount';

interface IngredientListViewState extends NavigableViewState {
	showUndefined?: boolean;
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
	private showUndefined = false;
	private searchQuery = '';
	private selectedTypes: Set<string> = new Set();
	private typeMenuOpen = false;
	private excludedDietFlags: Set<string> = new Set();
	private dietMenuOpen = false;
	private sortKey: SortKey = 'name';
	private sortDirection: 'asc' | 'desc' = 'asc';
	private scrollTop = 0;

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return INGREDIENT_LIST_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Liste des ingrédients';
	}

	private updateCloseAction(): void {
		if (!this.closeAction) return;
		this.closeAction.setAttribute('aria-label', canNavigateBack({ history: this.history }) ? 'Retour' : 'Fermer');
	}

	async setState(state: IngredientListViewState, result: unknown) {
		this.history = state.history ?? [];
		this.showUndefined = state.showUndefined ?? false;
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
			showUndefined: this.showUndefined,
			searchQuery: this.searchQuery,
			selectedTypes: Array.from(this.selectedTypes),
			excludedDietFlags: Array.from(this.excludedDietFlags),
			sortKey: this.sortKey,
			sortDirection: this.sortDirection,
			scrollTop: this.scrollTop,
		};
	}

	async onOpen() {

		// We add the close button at top right of the note.
		this.closeAction = this.addAction('arrow-left', 'Fermer', () => {
			closeOrGoBack(this.leaf, this.history);
		});
		this.closeAction.addClass('header-buttons');

		// Create the container and root
		const container = this.containerEl.children[1] as HTMLElement;
		this.root = createRoot(container);

		// We store the scroll state
		container.addEventListener('scroll', () => {
			this.scrollTop = container.scrollTop;
		});

		this.render();
	}

	private toggleShowUndefined(value: boolean) {
		this.showUndefined = value;
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

	render() {
		if (!this.root) return;

		if (this.showUndefined) {
			const undefinedIngredients = listUndefinedIngredients(
				this.app,
				this.plugin.settings.ingredientsFolder,
				this.plugin.settings.recipesFolder
			);
			const filtered = this.searchQuery.trim() === ''
				? undefinedIngredients
				: undefinedIngredients.filter((n) => n.name.toLowerCase().includes(this.searchQuery.toLowerCase()));

			this.root.render(
				<IngredientListDisplay
					mode="undefined"
					showUndefined={this.showUndefined}
					onToggleShowUndefined={(v) => this.toggleShowUndefined(v)}
					searchQuery={this.searchQuery}
					onSearchQueryChange={(v) => { this.searchQuery = v; this.render(); }}
					undefinedIngredients={filtered}
					onUndefinedClick={(name) => this.handleUndefinedClick(name)}
					onUndefinedRecipeClick={(name) => this.handleUndefinedRecipeClick(name)}
					ingredients={[]}
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
			);
			return;
		}

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
			<IngredientListDisplay
				mode="defined"
				showUndefined={this.showUndefined}
				onToggleShowUndefined={(v) => this.toggleShowUndefined(v)}
				searchQuery={this.searchQuery}
				onSearchQueryChange={(v) => { this.searchQuery = v; this.render(); }}
				undefinedIngredients={[]}
				onUndefinedClick={() => {}}
				onUndefinedRecipeClick={() => {}}
				ingredients={sorted}
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
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
