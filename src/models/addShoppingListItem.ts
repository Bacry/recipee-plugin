import { App, TFile } from 'obsidian';
import { ShoppingList, ShoppingListItem } from './ShoppingList';
import { parseShoppingList } from './parseShoppingList';
import { buildShoppingListMarkdown } from './buildShoppingListMarkdown';
import { SmartInputResult } from '../components/SmartShoppingInput';
import { normalizeForSearch } from './textNormalize';

// Generates a short random id for a new shopping list item.
// Not cryptographically meaningful — just needs to be unique within this list.
function generateId(): string {
	return Math.random().toString(36).slice(2, 10);
}

// Finds an existing item that matches on both name and complement
// (accent/case-insensitive), so repeated additions of the same thing
// merge into one line instead of piling up duplicates.
function findMatchingItem(
	items: ShoppingListItem[],
	name: string,
	complement: string
): ShoppingListItem | undefined {
	const normalizedName = normalizeForSearch(name);
	const normalizedComplement = complement.trim().toLowerCase();

	return items.find(
		(item) =>
			normalizeForSearch(item.name) === normalizedName &&
			item.complement.trim().toLowerCase() === normalizedComplement
	);
}

// Reads the current shopping list, then either:
// - appends a new contribution to an existing item (same name + complement), or
// - creates a brand new item line,
// and writes the updated list back to disk.
export async function addShoppingListItem(
	app: App,
	shoppingListPath: string,
	entry: SmartInputResult
): Promise<void> {
	const file = app.vault.getAbstractFileByPath(shoppingListPath);
	if (!(file instanceof TFile)) {
		throw new Error(`Shopping list file not found at ${shoppingListPath}`);
	}

	const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
	const { list } = parseShoppingList(frontmatter);

	const newContribution = entry.parsedQuantity
		? [
			{
				quantity: entry.parsedQuantity.quantity,
				unit: entry.parsedQuantity.unit?.name ?? '',
				source: 'manual',
			},
		]
		: [];

	const existingItem = findMatchingItem(list.items, entry.name, entry.complement);

	let updatedItems: ShoppingListItem[];
	if (existingItem) {
		// Merge: keep the existing item, just append the new contribution(s).
		// Note: if this addition had no quantity, there's nothing to append —
		// the existing item is left untouched.
		updatedItems = list.items.map((item) =>
			item.id === existingItem.id
				? { ...item, contributions: [...item.contributions, ...newContribution] }
				: item
		);
	} else {
		const newItem: ShoppingListItem = {
			id: generateId(),
			name: entry.name,
			complement: entry.complement,
			checked: false,
			contributions: newContribution,
		};
		updatedItems = [...list.items, newItem];
	}

	const updatedList: ShoppingList = { items: updatedItems };
	await app.vault.modify(file, buildShoppingListMarkdown(updatedList));
}
