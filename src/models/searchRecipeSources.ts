import { normalizeForSearch } from './textNormalize';
import { App, TFile } from 'obsidian';
import { parseRecipeFromFrontmatter } from './parseRecipe';


// A source is treated as "not a website" if it doesn't start with http(s)://
// — covers plain text sources like "Mamie", "Livre Larousse des desserts", etc.
function isUrlSource(value: string): boolean {
	return /^https?:\/\//i.test(value.trim());
}

// Scans all recipe notes and collects every distinct non-URL source already
// in use, for autocomplete on the source field. Same approach as
// getAllRecipeTags — reads the whole folder each time, no caching needed.
export function getAllRecipeSources(app: App, recipesFolder: string): string[] {
	const files = app.vault
		.getMarkdownFiles()
		.filter((f: TFile) => f.path.startsWith(recipesFolder + '/'));

	const allSources = new Set<string>();

	for (const file of files) {
		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		const { recipe } = parseRecipeFromFrontmatter(frontmatter, file.basename);
		if (!recipe || !recipe.source) continue;
		if (isUrlSource(recipe.source)) continue;

		allSources.add(recipe.source);
	}

	return Array.from(allSources);
}

export function searchRecipeSources(app: App, recipesFolder: string, query: string, limit = 10): string[] {
	const normalizedQuery = normalizeForSearch(query.trim());
	if (normalizedQuery === '') return [];

	const allSources = getAllRecipeSources(app, recipesFolder);
	const matches = allSources.filter((s) => normalizeForSearch(s).includes(normalizedQuery));

	matches.sort((a, b) => a.localeCompare(b));

	return matches.slice(0, limit);
}
