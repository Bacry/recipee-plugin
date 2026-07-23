import { App, TFile } from 'obsidian';
import { ShoppingList } from './ShoppingList';
import { parseShoppingList } from './parseShoppingList';
import { buildShoppingListMarkdown } from './buildShoppingListMarkdown';
import { SmartInputResult } from '../components/SmartShoppingInput';
import { addSingleIngredientToShoppingList } from './addSingleIngredientToShoppingList';

export async function addShoppingListItem(
	app: App,
	shoppingListPath: string,
	ingredientsFolder: string,
	otherItemsNotePath: string,
	entry: SmartInputResult
): Promise<void> {
	const file = app.vault.getAbstractFileByPath(shoppingListPath);
	if (!(file instanceof TFile)) {
		throw new Error(`Shopping list file not found at ${shoppingListPath}`);
	}

	const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
	const { list } = parseShoppingList(frontmatter);

	const updatedItems = await addSingleIngredientToShoppingList(
		app,
		ingredientsFolder,
		otherItemsNotePath,
		list.items,
		{
			name: entry.name,
			complement: entry.complement,
			quantity: entry.parsedQuantity?.quantity ?? null,
			unit: entry.parsedQuantity?.unit?.name ?? '',
			source: 'manual',
		}
	);

	const updatedList: ShoppingList = { items: updatedItems, recipes: list.recipes };
	await app.vault.modify(file, buildShoppingListMarkdown(updatedList));
}
