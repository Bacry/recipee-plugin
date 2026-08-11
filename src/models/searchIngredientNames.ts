import { App, TFile } from 'obsidian';
import { normalizeForSearch } from './textNormalize';
import { parseIngredientFromFrontmatter } from './parseIngredientFromFrontmatter';

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

	matches.sort((a, b) => {
		const aStarts = normalizeForSearch(a).startsWith(normalizedQuery);
		const bStarts = normalizeForSearch(b).startsWith(normalizedQuery);
		if (aStarts && !bStarts) return -1;
		if (!aStarts && bStarts) return 1;
		return a.localeCompare(b);
	});

	return matches.slice(0, limit);
}

export interface IngredientNameSuggestion {
	name: string; // the underlying ingredient sheet name — always this, never the form-suffixed text
	form?: string; // set when this suggestion represents a specific declared form of that ingredient
}

// Same matching as searchIngredientNames, but expands each matched
// ingredient into one suggestion per declared form (in addition to the
// plain ingredient itself), when its sheet has possible_forms set. An
// ingredient with no declared forms only ever contributes its plain
// suggestion — same behavior as before this feature existed.
export function searchIngredientNamesWithForms(
	app: App,
	ingredientsFolder: string,
	ingredientTypes: string[],
	shopSections: string[],
	query: string,
	limit = 10
): IngredientNameSuggestion[] {
	const normalizedQuery = normalizeForSearch(query);
	if (normalizedQuery === '') return [];

	const files = app.vault
		.getMarkdownFiles()
		.filter((f: TFile) => f.path.startsWith(ingredientsFolder + '/'));

	const matchedNames = files
		.map((f) => f.basename)
		.filter((name) => normalizeForSearch(name).includes(normalizedQuery));

	matchedNames.sort((a, b) => {
		const aStarts = normalizeForSearch(a).startsWith(normalizedQuery);
		const bStarts = normalizeForSearch(b).startsWith(normalizedQuery);
		if (aStarts && !bStarts) return -1;
		if (!aStarts && bStarts) return 1;
		return a.localeCompare(b);
	});

	const suggestions: IngredientNameSuggestion[] = [];

	for (const name of matchedNames) {
		suggestions.push({ name });

		const file = files.find((f) => f.basename === name);
		if (!file) continue;
		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		const { ingredient } = parseIngredientFromFrontmatter(frontmatter, name, ingredientTypes, shopSections);
		if (!ingredient?.possible_forms) continue;

		for (const form of ingredient.possible_forms) {
			suggestions.push({ name, form });
		}
	}

	return suggestions.slice(0, limit);
}
