export interface ShoppingListContribution {
	quantity: number;
	unit: string;
	source: string; // "manual" for user-added entries, or "recipe:<recipeEntryId>" for recipe-generated ones
}

export interface ShoppingListItem {
	id: string;
	name: string;
	complement: string;
	checked: boolean;
	contributions: ShoppingListContribution[];
}

// One "Shop" click on a recipe creates one entry here — tracks which recipe
// contributed ingredients, at what serving size, so it can be identified
// and cancelled later (removing exactly its contributions, nothing else).
export interface ShoppingListRecipeEntry {
	id: string;
	recipeName: string;
	servings: number;
}

export interface ShoppingList {
	items: ShoppingListItem[];
	recipes: ShoppingListRecipeEntry[];
}
