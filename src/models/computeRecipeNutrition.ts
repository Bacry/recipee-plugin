import { App, TFile } from 'obsidian';
import { Recipe } from './recipe';
import { NutritionPer100g } from './Ingredient';
import { parseRecipeFromFrontmatter } from './parseRecipe';
import { convertQuantity, findUnit } from './units';
import { findRecipeFileByName } from './findRecipeFile';

const NUTRITION_KEYS: (keyof NutritionPer100g)[] = [
	'kcal', 'lipids', 'non_saturated_lipids', 'glucids',
	'sugar', 'proteins', 'salt', 'fibers', 'cholesterol',
];

function emptyNutrition(): NutritionPer100g {
	return { kcal: 0, lipids: 0, non_saturated_lipids: 0, glucids: 0, sugar: 0, proteins: 0, salt: 0, fibers: 0, cholesterol: 0 };
}

function addNutrition(a: NutritionPer100g, b: NutritionPer100g, factor: number): NutritionPer100g {
	const result = { ...a };
	for (const key of NUTRITION_KEYS) {
		result[key] += b[key] * factor;
	}
	return result;
}

// Minimal, permissive reading of just the fields needed for nutrition calc —
// unlike parseIngredientFromFrontmatter (used for the ingredient view), this
// doesn't validate type/shop_section against configured lists, since those
// don't matter for a nutrition calculation.
export function readIngredientForCalc(
	frontmatter: Record<string, unknown> | undefined
): { nutritionPer100g: NutritionPer100g; densityGMl?: number; entityWeightG?: number } | null {
	if (!frontmatter) return null;

	const nutritionRaw = frontmatter.nutrition_per_100g;
	if (typeof nutritionRaw !== 'object' || nutritionRaw === null) return null;

	const nutrition = nutritionRaw as Record<string, unknown>;
	const nutritionPer100g = {} as NutritionPer100g;
	for (const key of NUTRITION_KEYS) {
		const value = nutrition[key];
		if (typeof value !== 'number' || Number.isNaN(value)) return null;
		nutritionPer100g[key] = value;
	}

	return {
		nutritionPer100g,
		densityGMl: typeof frontmatter.density_g_ml === 'number' ? frontmatter.density_g_ml : undefined,
		entityWeightG: typeof frontmatter.entity_weight_g === 'number' ? frontmatter.entity_weight_g : undefined,
	};
}

export interface RecipeNutritionResult {
	totalWeightG: number;
	totalNutrition: NutritionPer100g;
	perServingNutrition: NutritionPer100g | null;
	warnings: string[];
}

// Converts a single ingredient entry's quantity into grams, reading its
// density/entity weight from its ingredient file. Returns null if the
// ingredient has no sheet, is invalid, or can't be converted (e.g. missing
// density for a volume unit). Shared by computeRecipeNutrition and
// flattenRecipeIngredients, so both agree on exactly how weight is computed.
export function convertIngredientEntryToGrams(
	app: App,
	ingredientsFolder: string,
	entry: RecipeIngredientEntry
): number | null {
	if (entry.quantity == null) return null;

	const path = `${ingredientsFolder}/${entry.ingredientName}.md`;
	const file = app.vault.getAbstractFileByPath(path);
	if (!(file instanceof TFile)) return null;

	const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
	const ingredientData = readIngredientForCalc(frontmatter);
	if (!ingredientData) return null;

	const fromUnit = entry.unit === '' ? null : findUnit(entry.unit);
	return convertQuantity(entry.quantity, fromUnit, findUnit('g'), {
		densityGMl: ingredientData.densityGMl,
		entityWeightG: ingredientData.entityWeightG,
	});
}

// Sums a recipe's total ingredient weight in grams (NOT including base
// recipes) — used as the fallback when a recipe has no explicit
// total_weight_g. Ingredients that can't be converted are simply skipped
// (their weight just isn't counted, consistent with computeRecipeNutrition's
// own behavior for the same case).
export function sumRecipeIngredientWeightsG(
	app: App,
	ingredientsFolder: string,
	recipe: Recipe
): number {
	let total = 0;
	for (const entry of recipe.ingredients) {
		const grams = convertIngredientEntryToGrams(app, ingredientsFolder, entry);
		if (grams !== null) total += grams;
	}
	return total;
}

// Recursively computes a recipe's total nutrition. `visiting` tracks recipe
// names currently being computed up the call stack, to detect circular base
// recipe references without infinite-looping or crashing.
export function computeRecipeNutrition(
	app: App,
	ingredientsFolder: string,
	recipesFolder: string,
	recipe: Recipe,
	visiting: Set<string> = new Set()
): RecipeNutritionResult {
	const warnings: string[] = [];
	let totalNutrition = emptyNutrition();
	let summedWeightG = 0;

	for (const entry of recipe.ingredients) {
		if (entry.quantity == null) continue;

		const path = `${ingredientsFolder}/${entry.ingredientName}.md`;
		const file = app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) {
			warnings.push(`Ingrédient "${entry.ingredientName}" sans fiche — exclu du calcul.`);
			continue;
		}

		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		const ingredientData = readIngredientForCalc(frontmatter);
		if (!ingredientData) {
			warnings.push(`Ingrédient "${entry.ingredientName}" invalide — exclu du calcul.`);
			continue;
		}

		const grams = convertIngredientEntryToGrams(app, ingredientsFolder, entry);
		if (grams === null) {
			warnings.push(`Impossible de convertir "${entry.ingredientName}" en grammes (densité/poids unitaire manquant) — exclu du calcul.`);
			continue;
		}

		summedWeightG += grams;
		totalNutrition = addNutrition(totalNutrition, ingredientData.nutritionPer100g, grams / 100);
	}

	for (const entry of recipe.baseRecipes) {
		if (visiting.has(entry.recipeName)) {
			warnings.push(`Référence circulaire détectée sur "${entry.recipeName}" — exclue du calcul.`);
			continue;
		}

		const file = findRecipeFileByName(app, recipesFolder, entry.recipeName);
		if (!file) {
			warnings.push(`Recette de base "${entry.recipeName}" introuvable — exclue du calcul.`);
			continue;
		}
		
		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		const { recipe: baseRecipe } = parseRecipeFromFrontmatter(frontmatter, file.basename);
		if (!baseRecipe) {
			warnings.push(`Recette de base "${entry.recipeName}" invalide — exclue du calcul.`);
			continue;
		}

		const fromUnit = entry.unit === '' ? null : findUnit(entry.unit);
		const grams = convertQuantity(entry.quantity, fromUnit, findUnit('g'));
		if (grams === null) {
			warnings.push(`Impossible de convertir la quantité de "${entry.recipeName}" en grammes — exclue du calcul.`);
			continue;
		}

		const nextVisiting = new Set(visiting);
		nextVisiting.add(recipe.name);
		const baseResult = computeRecipeNutrition(app, ingredientsFolder, recipesFolder, baseRecipe, nextVisiting);
		warnings.push(...baseResult.warnings);

		const baseNutritionPer100g = {} as NutritionPer100g;
		for (const key of NUTRITION_KEYS) {
			baseNutritionPer100g[key] = baseResult.totalWeightG > 0 ? baseResult.totalNutrition[key] / (baseResult.totalWeightG / 100) : 0;
		}

		summedWeightG += grams;
		totalNutrition = addNutrition(totalNutrition, baseNutritionPer100g, grams / 100);
	}

	const totalWeightG = recipe.totalWeightG ?? summedWeightG;

	const servingsUnit = findUnit(recipe.servingsLabel);
	let perServingNutrition: NutritionPer100g | null = null;
	if (servingsUnit === null && recipe.baseServings > 0) {
		perServingNutrition = {} as NutritionPer100g;
		for (const key of NUTRITION_KEYS) {
			perServingNutrition[key] = totalNutrition[key] / recipe.baseServings;
		}
	}

	return { totalWeightG, totalNutrition, perServingNutrition, warnings };
}
