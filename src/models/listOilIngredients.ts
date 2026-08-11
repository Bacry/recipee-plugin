import { App, TFile } from 'obsidian';
import { parseIngredientFromFrontmatter } from './parseIngredientFromFrontmatter';

// An ingredient counts as "an oil" purely based on its type — no dedicated
// field needed, since every ingredient of an oil-flagged type is
// unconditionally usable for frying.
export function isOilIngredient(type: string, oilIngredientTypes: string[]): boolean {
	return oilIngredientTypes.includes(type);
}

// Lists the names of every ingredient whose type is flagged as an oil type
// (settings.oilIngredientTypes), for the oil selector in the recipe form's
// "Friture" section.
export function listOilIngredients(
	app: App,
	ingredientsFolder: string,
	ingredientTypes: string[],
	shopSections: string[],
	oilIngredientTypes: string[]
): string[] {
	const files = app.vault
		.getMarkdownFiles()
		.filter((f: TFile) => f.path.startsWith(ingredientsFolder + '/'));

	const names: string[] = [];
	for (const file of files) {
		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		const { ingredient } = parseIngredientFromFrontmatter(frontmatter, file.basename, ingredientTypes, shopSections);
		if (ingredient && isOilIngredient(ingredient.type, oilIngredientTypes)) {
			names.push(ingredient.name);
		}
	}

	return names.sort((a, b) => a.localeCompare(b));
}
