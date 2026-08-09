import { App } from 'obsidian';
import { ParsedQuantity, findUnit, convertQuantity, roundQuantityForUnit } from './units';
import { findIngredientFileByName } from './findIngredientFile';
import { readIngredientForCalc } from './computeRecipeNutrition';

export function normalizeParsedQuantity(
	app: App,
	ingredientsFolder: string,
	ingredientName: string,
	parsed: ParsedQuantity
): ParsedQuantity {
	const unit = parsed.unit;
	if (!unit || !unit.autoConvertTo) return parsed;

	const file = findIngredientFileByName(app, ingredientsFolder, ingredientName);
	if (file) {
		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		const ingredientData = readIngredientForCalc(frontmatter);
		if (ingredientData?.densityGMl != null) {
			const gramsUnit = findUnit('g');
			const grams = convertQuantity(parsed.quantity, unit, gramsUnit, {
				densityGMl: ingredientData.densityGMl,
			});
			if (grams !== null) {
				return { quantity: roundQuantityForUnit(grams, gramsUnit), unit: gramsUnit };
			}
		}
	}

	const targetUnit = findUnit(unit.autoConvertTo);
	if (!targetUnit) return parsed;

	const converted = convertQuantity(parsed.quantity, unit, targetUnit);
	if (converted === null) return parsed;

	return { quantity: roundQuantityForUnit(converted, targetUnit), unit: targetUnit };
}
