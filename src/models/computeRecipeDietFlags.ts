import { App, TFile } from 'obsidian';
import { Recipe } from './recipe';
import { parseRecipeFromFrontmatter } from './parseRecipe';
import { findRecipeFileByName } from './findRecipeFile';
import { findIngredientFileByName } from './findIngredientFile';

export interface DietFlagsResult {
	flags: Set<string>; // union of every diet flag found anywhere in the recipe's composition
	hasUncertainIngredients: boolean; // true if at least one ingredient has no fiche (flags might be incomplete)
}

// Recursively collects every diet flag present anywhere in a recipe's
// composition — its own ingredients, plus (recursively) any base recipes it
// uses. Ingredients without a fiche are silently skipped (their flags are
// simply unknown), but hasUncertainIngredients is set so callers can signal
// that the result might be incomplete. Same circular-reference guard as
// computeRecipeNutrition/flattenRecipeIngredients.
export function computeRecipeDietFlags(
	app: App,
	ingredientsFolder: string,
	recipesFolder: string,
	recipe: Recipe,
	visiting: Set<string> = new Set()
): DietFlagsResult {
	const flags = new Set<string>();
	let hasUncertainIngredients = false;

	for (const entry of recipe.ingredients) {
		const file = findIngredientFileByName(app, ingredientsFolder, entry.ingredientName);
		if (!file) {
			hasUncertainIngredients = true;
			continue;
		}

		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		const dietFlags = frontmatter?.diet_flags;
		if (Array.isArray(dietFlags)) {
			for (const flag of dietFlags) {
				if (typeof flag === 'string') flags.add(flag);
			}
		}
	}

	for (const entry of recipe.baseRecipes) {
		if (visiting.has(entry.recipeName)) continue;

		const file = findRecipeFileByName(app, recipesFolder, entry.recipeName);
		if (!file) continue;

		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		const { recipe: baseRecipe } = parseRecipeFromFrontmatter(frontmatter, file.basename);
		if (!baseRecipe) continue;

		const nextVisiting = new Set(visiting);
		nextVisiting.add(recipe.name);
		const baseResult = computeRecipeDietFlags(app, ingredientsFolder, recipesFolder, baseRecipe, nextVisiting);

		for (const flag of baseResult.flags) flags.add(flag);
		if (baseResult.hasUncertainIngredients) hasUncertainIngredients = true;
	}

	return { flags, hasUncertainIngredients };
}
