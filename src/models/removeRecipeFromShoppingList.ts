import { App, TFile } from 'obsidian';
import { ShoppingList } from './ShoppingList';
import { parseShoppingList } from './parseShoppingList';
import { buildShoppingListMarkdown } from './buildShoppingListMarkdown';

// Removes a recipe entry from the shopping list, along with every
// contribution it created (tagged "recipe:<id>"). Items left with zero
// remaining contributions AND no manual quantity are dropped entirely,
// since there's nothing left to buy for them — unless the item's name has
// no fiche and might still be wanted, in which case... actually, simplest
// and safest: only drop the item if it ends up with an empty contributions
// array AND was created purely by this recipe (never touched manually).
// To keep this simple and predictable, we just remove the matching
// contributions; an item with zero contributions left still shows up with
// no quantity, same as any manually-added "no amount" item — not deleted
// outright, since the user might want to keep it on the list regardless.
export async function removeRecipeFromShoppingList(
	app: App,
	shoppingListPath: string,
	recipeEntryId: string
): Promise<void> {
	const file = app.vault.getAbstractFileByPath(shoppingListPath);
	if (!(file instanceof TFile)) {
		throw new Error(`Shopping list file not found at ${shoppingListPath}`);
	}

	const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
	const { list } = parseShoppingList(frontmatter);

	const source = `recipe:${recipeEntryId}`;

	const updatedItems = list.items
		.map((item) => ({
			...item,
			contributions: item.contributions.filter((c) => c.source !== source),
		}))
		// Drop items that end up with zero contributions left — nothing to
		// buy for them anymore, and they weren't manually added (a manual
		// addition with a quantity would have its own "manual" contribution
		// still present, so it survives this filter untouched).
		.filter((item) => item.contributions.length > 0);

	const updatedRecipes = list.recipes.filter((r) => r.id !== recipeEntryId);

	const updatedList: ShoppingList = { items: updatedItems, recipes: updatedRecipes };
	await app.vault.modify(file, buildShoppingListMarkdown(updatedList));
}
