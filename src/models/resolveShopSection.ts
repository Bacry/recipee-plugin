import { App, TFile } from 'obsidian';
import { getOtherItemShopSection } from './otherItemsNote';
import { DensityInfo } from './aggregateContributions';

// Looks up the shop section for a shopping list item by name.
// Priority order:
// 1. A matching ingredient file's shop_section, if one exists.
// 2. A #rayon/xxx tag on the item's line in the "Autres" note, if tagged.
// 3. A generic fallback bucket, if neither is available yet.
export async function resolveShopSection(
	app: App,
	ingredientsFolder: string,
	otherItemsNotePath: string,
	itemName: string
): Promise<string> {
	const ingredientPath = `${ingredientsFolder}/${itemName}.md`;
	const file = app.vault.getAbstractFileByPath(ingredientPath);

	if (file instanceof TFile) {
		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		const shopSection = frontmatter?.shop_section;
		if (typeof shopSection === 'string' && shopSection.trim() !== '') {
			return shopSection;
		}
	}

	const otherSection = await getOtherItemShopSection(app, otherItemsNotePath, itemName);
	if (otherSection) return otherSection;

	return 'Autres rayons'; // no ingredient sheet, and no #rayon tag added yet in "Autres"
}

// Reads density_g_ml and entity_weight_g from an ingredient's frontmatter,
// if a matching ingredient file exists. Returns an empty object otherwise —
// callers (aggregation) will simply be unable to convert across unit types
// for items without a known density, which is the correct, safe behavior.
export function getIngredientDensityInfo(
	app: App,
	ingredientsFolder: string,
	itemName: string
): DensityInfo {
	const path = `${ingredientsFolder}/${itemName}.md`;
	const file = app.vault.getAbstractFileByPath(path);

	if (!(file instanceof TFile)) return {};

	const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
	if (!frontmatter) return {};

	return {
		densityGMl: typeof frontmatter.density_g_ml === 'number' ? frontmatter.density_g_ml : undefined,
		entityWeightG: typeof frontmatter.entity_weight_g === 'number' ? frontmatter.entity_weight_g : undefined,
	};
}
