import { ShoppingList, ShoppingListItem, ShoppingListContribution, ShoppingListRecipeEntry } from './ShoppingList';

export interface ShoppingListParseResult {
	list: ShoppingList;
	warnings: string[]; // one entry per skipped/malformed item, never blocks the rest of the list
}

// Parses the raw frontmatter of the "Courses" note into a typed ShoppingList.
// Unlike ingredient parsing, a single malformed item doesn't block the whole list —
// it's skipped with a warning, so the rest of your shopping list stays usable.
export function parseShoppingList(
	frontmatter: Record<string, unknown> | undefined
): ShoppingListParseResult {
	const warnings: string[] = [];

	if (!frontmatter || !Array.isArray(frontmatter.items)) {
		return { list: { items: [], recipes: [] }, warnings: [] };
	}

	const items: ShoppingListItem[] = [];

	for (const raw of frontmatter.items) {
		const parsed = parseItem(raw);
		if (parsed === null) {
			warnings.push(`Un article de la liste est mal formé et a été ignoré : ${JSON.stringify(raw)}`);
			continue;
		}
		items.push(parsed);
	}

	const recipes: ShoppingListRecipeEntry[] = [];
	if (Array.isArray(frontmatter.recipes)) {
		for (const raw of frontmatter.recipes) {
			const parsed = parseRecipeEntry(raw);
			if (parsed === null) {
				warnings.push(`Une entrée de recette est mal formée et a été ignorée : ${JSON.stringify(raw)}`);
				continue;
			}
			recipes.push(parsed);
		}
	}

	return { list: { items, recipes }, warnings };
}

function parseItem(raw: unknown): ShoppingListItem | null {
	if (typeof raw !== 'object' || raw === null) return null;
	const obj = raw as Record<string, unknown>;

	if (typeof obj.id !== 'string' || obj.id.trim() === '') return null;
	if (typeof obj.name !== 'string' || obj.name.trim() === '') return null;
	if (typeof obj.complement !== 'string') return null;
	if (typeof obj.checked !== 'boolean') return null;
	if (!Array.isArray(obj.contributions)) return null;

	const contributions: ShoppingListContribution[] = [];
	for (const rawContribution of obj.contributions) {
		const contribution = parseContribution(rawContribution);
		if (contribution === null) return null; // a malformed contribution invalidates the whole item
		contributions.push(contribution);
	}

	return {
		id: obj.id,
		name: obj.name,
		complement: obj.complement,
		checked: obj.checked,
		contributions,
	};
}

function parseRecipeEntry(raw: unknown): ShoppingListRecipeEntry | null {
	if (typeof raw !== 'object' || raw === null) return null;
	const obj = raw as Record<string, unknown>;

	if (typeof obj.id !== 'string' || obj.id.trim() === '') return null;
	if (typeof obj.recipe_name !== 'string' || obj.recipe_name.trim() === '') return null;
	if (typeof obj.servings !== 'number' || Number.isNaN(obj.servings)) return null;

	return { id: obj.id, recipeName: obj.recipe_name, servings: obj.servings };
}

function parseContribution(raw: unknown): ShoppingListContribution | null {
	if (typeof raw !== 'object' || raw === null) return null;
	const obj = raw as Record<string, unknown>;

	if (typeof obj.quantity !== 'number' || Number.isNaN(obj.quantity)) return null;
	if (typeof obj.unit !== 'string') return null;
	if (typeof obj.source !== 'string') return null;

	return { quantity: obj.quantity, unit: obj.unit, source: obj.source };
}
