import { App, TFile } from 'obsidian';
import { parseRecipeFromFrontmatter } from './parseRecipe';
import { findRecipeFileByName } from './findRecipeFile';
import { recordRecipeCookedToday } from './recordRecipeCooked';

export interface RecordCookedTodayRecursiveResult {
	recordedNames: string[]; // basenames of every recipe actually updated today (this one + base recipes)
}

// Records "cooked today" on this recipe, then recursively does the same for
// every base recipe it uses (and their own base recipes, etc.) — making a
// top-level recipe today implies its components were made today too.
// `visiting` (by file path) guards against circular base-recipe references,
// same pattern as computeRecipeNutrition.
export async function recordRecipeCookedTodayRecursive(
	app: App,
	recipesFolder: string,
	file: TFile,
	visiting: Set<string> = new Set()
): Promise<RecordCookedTodayRecursiveResult> {
	if (visiting.has(file.path)) return { recordedNames: [] };
	visiting.add(file.path);

	const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
	const { recipe } = parseRecipeFromFrontmatter(frontmatter, file.basename);

	const result = await recordRecipeCookedToday(app, file);
	const recordedNames = result.success ? [file.basename] : [];

	if (!recipe) return { recordedNames };

	for (const entry of recipe.baseRecipes) {
		const baseFile = findRecipeFileByName(app, recipesFolder, entry.recipeName);
		if (!baseFile) continue;
		const subResult = await recordRecipeCookedTodayRecursive(app, recipesFolder, baseFile, visiting);
		recordedNames.push(...subResult.recordedNames);
	}

	return { recordedNames };
}
