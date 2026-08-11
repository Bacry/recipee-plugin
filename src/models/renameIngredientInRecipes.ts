import { App, TFile } from 'obsidian';
import { parseRecipeFromFrontmatter } from './parseRecipe';
import { buildRecipeMarkdown } from './buildRecipeMarkdown';

// Counts how many recipes reference a given ingredient name — used before
// renaming, to decide whether a confirmation prompt is needed at all.
export function countRecipesUsingIngredient(app: App, recipesFolder: string, ingredientName: string): { count: number; recipeNames: string[] } {
	const files = app.vault
		.getMarkdownFiles()
		.filter((f: TFile) => f.path.startsWith(recipesFolder + '/'));

	const recipeNames: string[] = [];

	for (const file of files) {
		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		const { recipe } = parseRecipeFromFrontmatter(frontmatter, file.basename);
		if (!recipe) continue;

		const usesIt = recipe.ingredients.some((entry) => !entry.isSectionHeader && entry.ingredientName === ingredientName);
		if (usesIt) recipeNames.push(file.basename);
	}

	return { count: recipeNames.length, recipeNames };
}

// Rewrites every recipe referencing oldName so it references newName instead
// — every ingredient entry is updated, not just the first match, in case a
// recipe lists the same ingredient more than once (e.g. two forms of it).
export async function renameIngredientInRecipes(
	app: App,
	recipesFolder: string,
	oldName: string,
	newName: string
): Promise<number> {
	const files = app.vault
		.getMarkdownFiles()
		.filter((f: TFile) => f.path.startsWith(recipesFolder + '/'));

	let updatedCount = 0;

	for (const file of files) {
		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		const { recipe } = parseRecipeFromFrontmatter(frontmatter, file.basename);
		if (!recipe) continue;

		const usesIt = recipe.ingredients.some((entry) => !entry.isSectionHeader && entry.ingredientName === oldName);
		if (!usesIt) continue;

		const updatedIngredients = recipe.ingredients.map((entry) =>
			!entry.isSectionHeader && entry.ingredientName === oldName
				? { ...entry, ingredientName: newName }
				: entry
		);

		await app.vault.modify(file, buildRecipeMarkdown({ ...recipe, ingredients: updatedIngredients }));
		updatedCount++;
	}

	return updatedCount;
}
