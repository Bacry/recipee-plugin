import { App, TFile } from 'obsidian';
import { parseRecipeFromFrontmatter } from './parseRecipe';
import { normalizeForSearch } from './textNormalize';

// Scans all recipe notes and collects every distinct tag already in use,
// for autocomplete when tagging a recipe. Reads the whole recipes folder
// each time rather than caching — recipe counts are small enough that this
// stays fast, and it avoids any risk of a stale cache after edits.
export function getAllRecipeTags(app: App, recipesFolder: string): string[] {
	const files = app.vault
		.getMarkdownFiles()
		.filter((f: TFile) => f.path.startsWith(recipesFolder + '/'));

	const allTags = new Set<string>();

	for (const file of files) {
		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		const { recipe } = parseRecipeFromFrontmatter(frontmatter, file.basename);
		if (!recipe) continue;

		for (const tag of recipe.tags) {
			allTags.add(tag);
		}
	}

	return Array.from(allTags);
}

// Filters the known tags by a query, accent/case-insensitive, "starts with" first.
export function searchRecipeTags(app: App, recipesFolder: string, query: string, limit = 10): string[] {
	const normalizedQuery = normalizeForSearch(query.trim());
	if (normalizedQuery === '') return [];

	const allTags = getAllRecipeTags(app, recipesFolder);
	const matches = allTags.filter((tag) => normalizeForSearch(tag).includes(normalizedQuery));

	matches.sort((a, b) => {
		const aStarts = normalizeForSearch(a).startsWith(normalizedQuery);
		const bStarts = normalizeForSearch(b).startsWith(normalizedQuery);
		if (aStarts && !bStarts) return -1;
		if (!aStarts && bStarts) return 1;
		return a.localeCompare(b);
	});

	return matches.slice(0, limit);
}
