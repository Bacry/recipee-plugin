import { App, TFile } from 'obsidian';
import { parseIngredientFromFrontmatter } from './parseIngredientFromFrontmatter';
import { parseRecipeFromFrontmatter } from './parseRecipe';
import { findIngredientFileByName } from './findIngredientFile';

export interface IngredientSummary {
	name: string;
	filePath: string;
	type: string;
	shopSection: string;
	usedInRecipesCount: number;
}

// Counts, across every recipe, how many distinct recipes reference each
// ingredient by name (own ingredients only — base recipes are resolved
// recursively so a nested reference still counts toward the leaf ingredient,
// same recursion pattern as computeRecipeNutrition).
function countIngredientUsage(app: App, recipesFolder: string): Map<string, number> {
	const counts = new Map<string, number>();

	const files = app.vault
		.getMarkdownFiles()
		.filter((f: TFile) => f.path.startsWith(recipesFolder + '/'));

	for (const file of files) {
		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		const { recipe } = parseRecipeFromFrontmatter(frontmatter, file.basename);
		if (!recipe) continue;

		// A recipe using the same ingredient twice (e.g. two forms of the
		// same thing) should still only count once toward that recipe.
		const namesInThisRecipe = new Set(recipe.ingredients.filter((e) => !e.isSectionHeader).map((e) => e.ingredientName));
		for (const name of namesInThisRecipe) {
			counts.set(name, (counts.get(name) ?? 0) + 1);
		}
	}

	return counts;
}

export function listAllIngredients(
	app: App,
	ingredientsFolder: string,
	recipesFolder: string,
	ingredientTypes: string[],
	shopSections: string[]
): IngredientSummary[] {
	const files = app.vault
		.getMarkdownFiles()
		.filter((f: TFile) => f.path.startsWith(ingredientsFolder + '/'));

	const usageCounts = countIngredientUsage(app, recipesFolder);

	const summaries: IngredientSummary[] = [];
	for (const file of files) {
		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		const { ingredient } = parseIngredientFromFrontmatter(frontmatter, file.basename, ingredientTypes, shopSections);
		if (!ingredient) continue;

		summaries.push({
			name: ingredient.name,
			filePath: file.path,
			type: ingredient.type,
			shopSection: ingredient.shop_section,
			usedInRecipesCount: usageCounts.get(ingredient.name) ?? 0,
		});
	}

	return summaries.sort((a, b) => a.name.localeCompare(b.name));
}


export interface UndefinedIngredientUsage {
	name: string;
	usedInRecipes: string[];
}

// Every distinct ingredient name referenced by at least one recipe, but
// without a matching ingredient sheet — candidates to create.
export function listUndefinedIngredients(app: App, ingredientsFolder: string, recipesFolder: string): UndefinedIngredientUsage[] {
	const files = app.vault
		.getMarkdownFiles()
		.filter((f: TFile) => f.path.startsWith(recipesFolder + '/'));

	const usageByName = new Map<string, Set<string>>();

	for (const file of files) {
		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		const { recipe } = parseRecipeFromFrontmatter(frontmatter, file.basename);
		if (!recipe) continue;

		for (const entry of recipe.ingredients) {
			if (entry.isSectionHeader) continue;
			if (findIngredientFileByName(app, ingredientsFolder, entry.ingredientName)) continue;

			const existing = usageByName.get(entry.ingredientName) ?? new Set<string>();
			existing.add(file.basename);
			usageByName.set(entry.ingredientName, existing);
		}
	}

	return Array.from(usageByName.entries())
		.map(([name, recipes]) => ({ name, usedInRecipes: Array.from(recipes).sort((a, b) => a.localeCompare(b)) }))
		.sort((a, b) => a.name.localeCompare(b.name));
}
