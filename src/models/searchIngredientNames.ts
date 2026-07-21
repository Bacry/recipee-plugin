import { App, TFile } from 'obsidian';
import { normalizeForSearch } from './textNormalize';

// Returns up to `limit` ingredient file names (without the .md extension)
// whose name contains the given query (case-insensitive substring match).
// Kept deliberately simple — no fuzzy matching, no ranking beyond
// "starts with" vs "contains", since ingredient names are short and few.
export function searchIngredientNames(
	app: App,
	ingredientsFolder: string,
	query: string,
	limit = 10
): string[] {
	const normalizedQuery = normalizeForSearch(query);
	if (normalizedQuery === '') return [];

	const files = app.vault
		.getMarkdownFiles()
		.filter((f: TFile) => f.path.startsWith(ingredientsFolder + '/'));

	const matches = files
		.map((f) => f.basename)
		.filter((name) => normalizeForSearch(name).includes(normalizedQuery));

	// Sort "starts with" matches first, since they're usually more relevant
	// than a match buried in the middle of the name.
	matches.sort((a, b) => {
		const aStarts = normalizeForSearch(a).startsWith(normalizedQuery);
		const bStarts = normalizeForSearch(b).startsWith(normalizedQuery);
		if (aStarts && !bStarts) return -1;
		if (!aStarts && bStarts) return 1;
		return a.localeCompare(b);
	});

	return matches.slice(0, limit);
}
