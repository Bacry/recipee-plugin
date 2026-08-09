import { App } from 'obsidian';
import { RecipeBaseRecipeEntry } from './recipe';
import { parseRecipeFromFrontmatter } from './parseRecipe';
import { buildRecipeMarkdown } from './buildRecipeMarkdown';
import { findRecipeFileByName } from './findRecipeFile';

// When a recipe is flagged "already made before tracking", its base recipes
// were necessarily made too — propagate the flag down recursively. Skips
// writing to recipes already flagged, but still recurses past them (a
// deeper base recipe might not be flagged yet even if this one already is).
export async function propagateMadeBeforeTracking(
	app: App,
	recipesFolder: string,
	baseRecipes: RecipeBaseRecipeEntry[],
	visiting: Set<string> = new Set()
): Promise<void> {
	for (const entry of baseRecipes) {
		const file = findRecipeFileByName(app, recipesFolder, entry.recipeName);
		if (!file) continue;
		if (visiting.has(file.path)) continue;
		visiting.add(file.path);

		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		const { recipe } = parseRecipeFromFrontmatter(frontmatter, file.basename);
		if (!recipe) continue;

		if (!recipe.madeBeforeTracking) {
			const updatedRecipe = { ...recipe, madeBeforeTracking: true };
			await app.vault.modify(file, buildRecipeMarkdown(updatedRecipe));
		}

		await propagateMadeBeforeTracking(app, recipesFolder, recipe.baseRecipes, visiting);
	}
}
