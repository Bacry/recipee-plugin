export interface ShoppingListContribution {
	quantity: number;
	unit: string; // e.g. "g", "kg", "mL", "L", or "" for countable items (entities)
	source: string; // "manual" for user-added entries, or "recipe:<recipe name>" once recipes are wired in
}

export interface ShoppingListItem {
	id: string; // unique identifier for this ingredient line, stable across edits
	name: string; // ingredient name, or free text if not a known ingredient
	complement: string; // optional free-text detail (e.g. brand), empty string if none
	checked: boolean; // true once bought
	contributions: ShoppingListContribution[]; // each addition is tracked separately,
	// so removing a recipe later can remove exactly its contribution without
	// guessing which part of a merged total belonged to it.
	// Note: shop section is intentionally NOT stored here — it's looked up at display time
	// from the ingredient's file (or the "Autres" note), to avoid data duplication and drift.
}

export interface ShoppingList {
	items: ShoppingListItem[];
}
