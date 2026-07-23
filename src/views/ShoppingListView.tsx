import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { parseShoppingList } from '../models/parseShoppingList';
import type MyPlugin from '../main';
import { SmartShoppingInput } from '../components/SmartShoppingInput';
import { addShoppingListItem } from '../models/addShoppingListItem';
import { SmartInputResult } from '../components/SmartShoppingInput';
import { ShoppingListDisplay, ResolvedItem } from '../components/ShoppingListDisplay';
import { aggregateContributions } from '../models/aggregateContributions';
import { resolveShopSection, getIngredientDensityInfo } from '../models/resolveShopSection';
import { toggleShoppingListItemChecked, deleteShoppingListItem } from '../models/updateShoppingListItem';
import { setOtherItemShopSection } from '../models/otherItemsNote';
import { ShoppingListItem } from '../models/ShoppingList';
import { showShopSectionMenu } from '../components/showShopSectionMenu';
import { NavigableViewState, NavigationEntry } from '../navigation';
import { removeRecipeFromShoppingList } from '../models/removeRecipeFromShoppingList';
import { toggleShoppingListItemChecked, deleteShoppingListItem, setItemAlreadyOwned } from '../models/updateShoppingListItem';

export const SHOPPING_LIST_VIEW_TYPE = 'shopping-list-view';

// ShoppingListView doesn't currently navigate to/from other views, but it
// still implements NavigableViewState for consistency — harmless now, and
// ready if it ever needs to participate in navigation later (e.g. a future
// "view this ingredient's shopping entry" link).
interface ShoppingListViewState extends NavigableViewState {}

export class ShoppingListView extends ItemView {
	private plugin: MyPlugin;
	private root: Root | null = null;
	private currentItems: ShoppingListItem[] = [];
	private history: NavigationEntry[] = [];

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return SHOPPING_LIST_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Courses';
	}

	async setState(state: ShoppingListViewState, result: unknown) {
		this.history = state.history ?? [];
		return super.setState(state, result as never);
	}

	getState(): ShoppingListViewState {
		return { history: this.history };
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		this.root = createRoot(container);

		// Make sure the shopping list note exists before we try to read it.
		const path = this.plugin.settings.shoppingListPath;
		let file = this.app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) {
			file = await this.app.vault.create(path, '---\nitems: []\n---\n');
		}

		// Re-render whenever the shopping list note is modified elsewhere
		// (e.g. once we wire in the add-item form later).
		this.registerEvent(
			this.app.metadataCache.on('changed', (changedFile) => {
				const shoppingListPath = this.plugin.settings.shoppingListPath;
				const otherItemsPath = this.plugin.settings.otherItemsNotePath;

				// Re-render on changes to either file: the shopping list itself,
				// or the "Autres" note (e.g. after tagging a shop section via the menu).
				if (changedFile.path === shoppingListPath || changedFile.path === otherItemsPath) {
					this.render();
				}
			})
		);

		this.render();
	}
	async handleAddItem(entry: SmartInputResult) {
		await addShoppingListItem(
			this.app,
			this.plugin.settings.shoppingListPath,
			this.plugin.settings.ingredientsFolder,
			this.plugin.settings.otherItemsNotePath,
			entry
		);
	}
	async handleToggleChecked(itemId: string) {
		await toggleShoppingListItemChecked(this.app, this.plugin.settings.shoppingListPath, itemId);
	}

	async handleSetAlreadyOwned(itemId: string, owned: { quantity: number; unit: string } | null) {
		await setItemAlreadyOwned(this.app, this.plugin.settings.shoppingListPath, itemId, owned);
	}

	async handleDelete(itemId: string) {
		await deleteShoppingListItem(this.app, this.plugin.settings.shoppingListPath, itemId);
	}

	async handleRemoveRecipe(recipeEntryId: string) {
		await removeRecipeFromShoppingList(this.app, this.plugin.settings.shoppingListPath, recipeEntryId);
	}

// Placeholder — actual "set section" popup logic
	handleSetSection(itemId: string, event: React.MouseEvent) {
		const item = this.currentItems.find((i) => i.id === itemId);
		if (!item) return;

		showShopSectionMenu(event.nativeEvent, this.plugin.settings.shopSections, async (section) => {
			await setOtherItemShopSection(this.app, this.plugin.settings.otherItemsNotePath, item.name, section);
		});
	}

	async render() {
		if (!this.root) return;

		const path = this.plugin.settings.shoppingListPath;
		const file = this.app.vault.getAbstractFileByPath(path);

		if (!(file instanceof TFile)) {
			this.root.render(<p>Fichier de liste de courses introuvable.</p>);
			return;
		}

		const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
		const { list, warnings } = parseShoppingList(frontmatter);

		this.currentItems = list.items;

		// Resolve each item's shop section before rendering, since resolution
		// now involves reading the "Autres" note (async) in addition to
		// checking ingredient files.
		const resolvedItems: ResolvedItem[] = await Promise.all(
			list.items.map(async (item) => {
				const shopSection = await resolveShopSection(
					this.app,
					this.plugin.settings.ingredientsFolder,
					this.plugin.settings.otherItemsNotePath,
					item.name
				);

				const densityInfo = getIngredientDensityInfo(this.app, this.plugin.settings.ingredientsFolder, item.name);
				const aggregation = aggregateContributions(item.contributions, densityInfo, item.alreadyOwned);

				const ingredientPath = `${this.plugin.settings.ingredientsFolder}/${item.name}.md`;
				const isKnownIngredient = this.app.vault.getAbstractFileByPath(ingredientPath) instanceof TFile;

				return { item, shopSection, aggregation, isKnownIngredient };
			})
		);

		this.root.render(
			<div>
				{warnings.length > 0 && (
					<ul className="ingredient-validation-warnings">
						{warnings.map((warning, index) => (
							<li key={index}>{warning}</li>
						))}
					</ul>
				)}
				<SmartShoppingInput
					app={this.app}
					ingredientsFolder={this.plugin.settings.ingredientsFolder}
					otherItemsNotePath={this.plugin.settings.otherItemsNotePath}
					onAdd={(result) => this.handleAddItem(result)}
				/>
				<ShoppingListDisplay
					resolvedItems={resolvedItems}
					recipeEntries={list.recipes}
					onToggleChecked={(id) => this.handleToggleChecked(id)}
					onDelete={(id) => this.handleDelete(id)}
					onSetSection={(id, event) => this.handleSetSection(id, event)}
					onRemoveRecipe={(id) => this.handleRemoveRecipe(id)}
					onSetAlreadyOwned={(id, owned) => this.handleSetAlreadyOwned(id, owned)}
				/>
			</div>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
