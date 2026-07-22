import { App, TFile } from 'obsidian';
import { parseRecipeFromFrontmatter } from './parseRecipe';

// Scans all recipe notes and returns the basenames of those that reference
// a given ingredient by name — used to show "used in: X, Y, Z" at the
// bottom of an ingredient's view. Reads the whole recipes folder each time
// rather than caching, consistent with our other search functions (recipe
// counts stay small enough for this to be fast).
export function findRecipesUsingIngredient(
	app: App,
	recipesFolder: string,
	ingredientName: string
): string[] {

	const files = app.vault
		.getMarkdownFiles()
		.filter((f: TFile) => f.path.startsWith(recipesFolder + '/'));

	const matches: string[] = [];

	for (const file of files) {
		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		const { recipe } = parseRecipeFromFrontmatter(frontmatter, file.basename);
		if (!recipe) continue;

		const usesIt = recipe.ingredients.some((entry) => entry.ingredientName === ingredientName);
		if (usesIt) {
			matches.push(file.basename);
		}
	}

	return matches;
}
