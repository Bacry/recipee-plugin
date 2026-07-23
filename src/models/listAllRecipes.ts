import { App, TFile } from 'obsidian';
import { parseRecipeFromFrontmatter } from './parseRecipe';

// A lightweight summary of a recipe, just enough for the recipe list view —
// not the full Recipe object, since we don't need ingredients/instructions
// here, just what's needed for display + filtering.
export interface RecipeSummary {
	name: string;
	filePath: string;
	tags: string[];
	image?: string;
	ingredientNames: string[]; // used to filter the recipe list by ingredient
}

// Lists every recipe in the vault (recursively, any subfolder under
// recipesFolder — e.g. "Recettes/Cocktails" included automatically).
// Malformed recipes are silently skipped rather than breaking the whole list.
export function listAllRecipes(app: App, recipesFolder: string): RecipeSummary[] {
	const files = app.vault
		.getMarkdownFiles()
		.filter((f: TFile) => f.path.startsWith(recipesFolder + '/'));

	const summaries: RecipeSummary[] = [];

	for (const file of files) {
		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		const { recipe } = parseRecipeFromFrontmatter(frontmatter, file.basename);
		if (!recipe) continue;

		summaries.push({
			name: recipe.name,
			filePath: file.path,
			tags: recipe.tags,
			image: recipe.image,
			ingredientNames: recipe.ingredients.map((e) => e.ingredientName),
		});
	}

	return summaries.sort((a, b) => a.name.localeCompare(b));
}
