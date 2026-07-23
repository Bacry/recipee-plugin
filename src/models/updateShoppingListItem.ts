import { App, TFile } from 'obsidian';
import { ShoppingList } from './ShoppingList';
import { parseShoppingList } from './parseShoppingList';
import { buildShoppingListMarkdown } from './buildShoppingListMarkdown';

// Shared helper: reads the list, applies a transform to the items array,
// writes the result back. Keeps toggle/delete symmetric and avoids
// duplicating the read/parse/write boilerplate.
async function updateShoppingList(
	app: App,
	shoppingListPath: string,
	transform: (list: ShoppingList) => ShoppingList
): Promise<void> {
	const file = app.vault.getAbstractFileByPath(shoppingListPath);
	if (!(file instanceof TFile)) {
		throw new Error(`Shopping list file not found at ${shoppingListPath}`);
	}

	const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
	const { list } = parseShoppingList(frontmatter);
	const updated = transform(list);
	await app.vault.modify(file, buildShoppingListMarkdown(updated));
}

// Flips the checked state of a single item, identified by id.
export async function toggleShoppingListItemChecked(
	app: App,
	shoppingListPath: string,
	itemId: string
): Promise<void> {
	await updateShoppingList(app, shoppingListPath, (list) => ({
		items: list.items.map((item) =>
			item.id === itemId ? { ...item, checked: !item.checked } : item
		),
		recipes: list.recipes,
	}));
}

// Removes an item entirely, identified by id.
export async function deleteShoppingListItem(
	app: App,
	shoppingListPath: string,
	itemId: string
): Promise<void> {
	await updateShoppingList(app, shoppingListPath, (list) => ({
		items: list.items.filter((item) => item.id !== itemId),
		recipes: list.recipes,
	}));
}

// Sets (or clears, if quantity is null) the "already owned" adjustment on
// an item — clicking the item's name again with an empty value clears it.
export async function setItemAlreadyOwned(
	app: App,
	shoppingListPath: string,
	itemId: string,
	owned: { quantity: number; unit: string } | null
): Promise<void> {
	await updateShoppingList(app, shoppingListPath, (list) => ({
		items: list.items.map((item) =>
			item.id === itemId ? { ...item, alreadyOwned: owned ?? undefined } : item
		),
		recipes: list.recipes,
	}));
}

