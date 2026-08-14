import { App } from 'obsidian';
import { ParsedQuantity, findUnit, convertQuantity, roundQuantityForUnit } from './units';
import { findIngredientFileByName } from './findIngredientFile';
import { readIngredientForCalc } from './computeRecipeNutrition';

export function normalizeParsedQuantity(
	app: App,
	ingredientsFolder: string,
	ingredientName: string,
	parsed: ParsedQuantity,
	unitSystem: 'metric' | 'us' = 'metric'
): ParsedQuantity {
	const unit = parsed.unit;
	// No unit at all (a bare count, e.g. "2 eggs"), or a unit with no
	// system tagged (neutral units like kg/l/dl/ml, never auto-converted) —
	// nothing to normalize.
	if (!unit || !unit.system || !unit.equivalentUnit) return parsed;

	// Already in the user's preferred system — nothing to do.
	if (unit.system === unitSystem) return parsed;

	// Prefer converting to grams directly when the ingredient's density is
	// known — more useful for nutrition calc than a generic volume/weight
	// swap, and matches the ingredient's real unit weight rather than a
	// fixed equivalence table entry.
	const file = findIngredientFileByName(app, ingredientsFolder, ingredientName);
	if (file && unitSystem === 'metric') {
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

	const targetUnit = findUnit(unit.equivalentUnit);
	if (!targetUnit) return parsed;

	const converted = convertQuantity(parsed.quantity, unit, targetUnit);
	if (converted === null) return parsed;

	return { quantity: roundQuantityForUnit(converted, targetUnit), unit: targetUnit };
}
