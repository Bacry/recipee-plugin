import { App, TFile } from 'obsidian';
import { parseRecipeFromFrontmatter } from './parseRecipe';

// Scans all recipe notes and returns the basenames of those that reference
// a given recipe as a base recipe — used to block deletion of a recipe
// that's still in use as a component of another (unlike ingredients, this
// case isn't handled gracefully today: a missing base recipe would break
// the referencing recipe's nutrition calculation, so deletion is blocked
// entirely rather than just warned about).
export function findRecipesUsingBaseRecipe(
	app: App,
	recipesFolder: string,
	baseRecipeName: string
): string[] {
	const files = app.vault
		.getMarkdownFiles()
		.filter((f: TFile) => f.path.startsWith(recipesFolder + '/'));

	const matches: string[] = [];

	for (const file of files) {
		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		const { recipe } = parseRecipeFromFrontmatter(frontmatter, file.basename);
		if (!recipe) continue;

		const usesIt = recipe.baseRecipes.some((entry) => entry.recipeName === baseRecipeName);
		if (usesIt) {
			matches.push(file.basename);
		}
	}

	return matches;
}
