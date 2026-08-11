import { App } from 'obsidian';
import { searchIngredientNamesWithForms, IngredientNameSuggestion } from './searchIngredientNames';
import { getOtherItemNames } from './otherItemsNote';
import { normalizeForSearch } from './textNormalize';

// Combines ingredient file names (with their declared forms, e.g.
// "Poulet (haché)") and "Autres" note names into a single autocomplete
// source, so the popup shows suggestions from both — e.g. "Farine" (an
// ingredient with a full nutrition sheet) and "Éponges" (a plain non-food
// item) side by side.
export async function searchAllItemNames(
	app: App,
	ingredientsFolder: string,
	otherItemsNotePath: string,
	ingredientTypes: string[],
	shopSections: string[],
	query: string,
	limit = 10
): Promise<IngredientNameSuggestion[]> {
	const normalizedQuery = normalizeForSearch(query.trim());
	if (normalizedQuery === '') return [];

	const ingredientMatches = searchIngredientNamesWithForms(app, ingredientsFolder, ingredientTypes, shopSections, query, limit);

	const otherNames = await getOtherItemNames(app, otherItemsNotePath);
	const otherMatches: IngredientNameSuggestion[] = otherNames
		.filter((name) => normalizeForSearch(name).includes(normalizedQuery))
		.map((name) => ({ name }));

	// Merge, de-duplicate on name+form (in case the same plain name somehow
	// exists in both sources), re-sort with "starts with" priority like
	// searchIngredientNames does internally, then cap to the limit.
	const seen = new Set<string>();
	const merged: IngredientNameSuggestion[] = [];
	for (const suggestion of [...ingredientMatches, ...otherMatches]) {
		const key = `${suggestion.name}::${suggestion.form ?? ''}`;
		if (seen.has(key)) continue;
		seen.add(key);
		merged.push(suggestion);
	}

	merged.sort((a, b) => {
		const aStarts = normalizeForSearch(a.name).startsWith(normalizedQuery);
		const bStarts = normalizeForSearch(b.name).startsWith(normalizedQuery);
		if (aStarts && !bStarts) return -1;
		if (!aStarts && bStarts) return 1;
		return a.name.localeCompare(b.name);
	});

	return merged.slice(0, limit);
}
