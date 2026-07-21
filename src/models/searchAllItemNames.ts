import { App } from 'obsidian';
import { searchIngredientNames } from './searchIngredientNames';
import { getOtherItemNames } from './otherItemsNote';
import { normalizeForSearch } from './textNormalize';

// Combines ingredient file names and "Autres" note names into a single
// autocomplete source, so the popup shows suggestions from both —
// e.g. "Farine" (an ingredient with a full nutrition sheet) and
// "Éponges" (a plain non-food item) side by side.
export async function searchAllItemNames(
	app: App,
	ingredientsFolder: string,
	otherItemsNotePath: string,
	query: string,
	limit = 10
): Promise<string[]> {
	const normalizedQuery = normalizeForSearch(query.trim());
	if (normalizedQuery === '') return [];

	const ingredientMatches = searchIngredientNames(app, ingredientsFolder, query, limit);

	const otherNames = await getOtherItemNames(app, otherItemsNotePath);
	const otherMatches = otherNames.filter((name) => normalizeForSearch(name).includes(normalizedQuery));

	// Merge, de-duplicate (in case the same name somehow exists in both sources),
	// re-sort with "starts with" priority like searchIngredientNames does internally,
	// then cap to the limit.
	const merged = Array.from(new Set([...ingredientMatches, ...otherMatches]));
	merged.sort((a, b) => {
		const aStarts = normalizeForSearch(a).startsWith(normalizedQuery);
		const bStarts = normalizeForSearch(b).startsWith(normalizedQuery);
		if (aStarts && !bStarts) return -1;
		if (!aStarts && bStarts) return 1;
		return a.localeCompare(b);
	});

	return merged.slice(0, limit);
}
