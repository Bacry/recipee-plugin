import { App, TFile } from 'obsidian';
import { parseRecipeFromFrontmatter } from './parseRecipe';
import { normalizeForSearch } from './textNormalize';

// Returns the basenames of recipe files tagged "base", matching the query
// (accent/case-insensitive, "starts with" first) — used for autocomplete
// when adding a base recipe as a component of another recipe.
export function searchBaseRecipes(
	app: App,
	recipesFolder: string,
	query: string,
	limit = 10
): string[] {
	const normalizedQuery = normalizeForSearch(query.trim());
	if (normalizedQuery === '') return [];

	const files = app.vault
		.getMarkdownFiles()
		.filter((f: TFile) => f.path.startsWith(recipesFolder + '/'));

	const matches: string[] = [];
	for (const file of files) {
		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		const { recipe } = parseRecipeFromFrontmatter(frontmatter, file.basename);
		if (!recipe || !recipe.tags.includes('base')) continue;

		if (normalizeForSearch(file.basename).includes(normalizedQuery)) {
			matches.push(file.basename);
		}
	}

	matches.sort((a, b) => {
		const aStarts = normalizeForSearch(a).startsWith(normalizedQuery);
		const bStarts = normalizeForSearch(b).startsWith(normalizedQuery);
		if (aStarts && !bStarts) return -1;
		if (!aStarts && bStarts) return 1;
		return a.localeCompare(b);
	});

	return matches.slice(0, limit);
}

// Returns the servingsLabel (used as the "output unit") of a base recipe by
// name, or null if the recipe doesn't exist or isn't tagged "base".
// Used to validate that a quantity's unit is convertible before saving.
export function getBaseRecipeServingsLabel(
	app: App,
	recipesFolder: string,
	recipeName: string
): string | null {
	const path = `${recipesFolder}/${recipeName}.md`;
	const file = app.vault.getAbstractFileByPath(path);
	if (!(file instanceof TFile)) return null;

	const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
	const { recipe } = parseRecipeFromFrontmatter(frontmatter, file.basename);
	if (!recipe || !recipe.tags.includes('base')) return null;

	return recipe.servingsLabel;
}
