import { App, TFile } from 'obsidian';
import { parseIngredientFromFrontmatter } from './parseIngredientFromFrontmatter';

// Lists the names of every ingredient flagged "can be used for frying",
// for the oil selector in the recipe form's "Friture" section.
export function listOilIngredients(
	app: App,
	ingredientsFolder: string,
	ingredientTypes: string[],
	shopSections: string[]
): string[] {
	const files = app.vault
		.getMarkdownFiles()
		.filter((f: TFile) => f.path.startsWith(ingredientsFolder + '/'));

	const names: string[] = [];
	for (const file of files) {
		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		const { ingredient } = parseIngredientFromFrontmatter(frontmatter, file.basename, ingredientTypes, shopSections);
		if (ingredient?.can_be_used_for_frying) {
			names.push(ingredient.name);
		}
	}

	return names.sort((a, b) => a.localeCompare(b));
}
