import { App } from 'obsidian';
import { ShoppingListItem } from './ShoppingList';
import { normalizeForSearch } from './textNormalize';
import { findIngredientFileByName } from './findIngredientFile';


export interface SingleIngredientAddition {
	name: string;
	complement: string; // always '' for recipe-generated additions, can be non-empty for manual ones
	quantity: number | null;
	unit: string;
	source: string; // 'manual' or 'recipe:<id>'
}

// Merges a single ingredient addition into an existing items array: either
// appends a new contribution to a matching existing item (same name +
// complement), or creates a brand new item. If the ingredient has no
// matching fiche, it's also registered in the "Autres" note, so future
// searches/shop-section assignment recognize it. Shared by both manual
// additions (SmartShoppingInput) and recipe-generated ones (Shop button),
// so both behave identically for this shared concern.
export async function addSingleIngredientToShoppingList(
	app: App,
	ingredientsFolder: string,
	otherItemsNotePath: string,
	items: ShoppingListItem[],
	addition: SingleIngredientAddition
): Promise<ShoppingListItem[]> {
	const normalizedName = normalizeForSearch(addition.name);
	const normalizedComplement = addition.complement.trim().toLowerCase();

	const existingIndex = items.findIndex(
		(item) =>
			normalizeForSearch(item.name) === normalizedName &&
			item.complement.trim().toLowerCase() === normalizedComplement
	);

// Even a "no amount" addition (quantity null — e.g. "vanille, à volonté")
// still creates a contribution, using 0 as a sentinel quantity. This is
// what lets removeRecipeFromShoppingList later know which recipe added
// this item, so it only removes it if THAT recipe is the one being
// cancelled — without this, quantity-less items would have no traceable
// source at all and could get wrongly deleted by any recipe removal.
	const newContribution = [{
		quantity: addition.quantity ?? 0,
		unit: addition.unit,
		source: addition.source,
	}];

	if (existingIndex >= 0) {
		const updated = [...items];
		updated[existingIndex] = {
			...updated[existingIndex],
			contributions: [...updated[existingIndex].contributions, ...newContribution],
		};
		return updated;
	}

	const newItem: ShoppingListItem = {
		id: Math.random().toString(36).slice(2, 10),
		name: addition.name,
		complement: addition.complement,
		checked: false,
		contributions: newContribution,
	};

	return [...items, newItem];
}
