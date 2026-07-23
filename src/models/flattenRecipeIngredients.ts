import { App, TFile } from 'obsidian';
import { Recipe } from './recipe';
import { parseRecipeFromFrontmatter } from './parseRecipe';
import { convertQuantity, findUnit } from './units';
import { sumRecipeIngredientWeightsG } from './computeRecipeNutrition';
import { findRecipeFileByName } from './findRecipeFile';

export interface FlattenedIngredient {
	ingredientName: string;
	quantity: number;
	unit: string;
}

export interface FlattenResult {
	ingredients: FlattenedIngredient[];
	warnings: string[];
}

// Recursively flattens a recipe's ingredients AND its base recipes' own
// ingredients (scaled by how much of each base recipe is used) into a
// single flat list of real ingredient contributions. `visiting` guards
// against circular base recipe references, same pattern as computeRecipeNutrition.
export function flattenRecipeIngredients(
	app: App,
	ingredientsFolder: string,
	recipesFolder: string,
	recipe: Recipe,
	scaleFactor: number,
	visiting: Set<string> = new Set()
): FlattenResult {
	const warnings: string[] = [];
	const ingredients: FlattenedIngredient[] = [];

	for (const entry of recipe.ingredients) {
		if (entry.quantity == null) continue;

		ingredients.push({
			ingredientName: entry.ingredientName,
			quantity: entry.quantity * scaleFactor,
			unit: entry.unit,
		});
	}

	for (const entry of recipe.baseRecipes) {
		if (visiting.has(entry.recipeName)) {
			warnings.push(`Référence circulaire détectée sur "${entry.recipeName}" — ignorée.`);
			continue;
		}

		const path = `${recipesFolder}/${entry.recipeName}.md`;
		const file = findRecipeFileByName(app, recipesFolder, entry.recipeName);
		if (!file) {
			warnings.push(`Recette de base "${entry.recipeName}" introuvable — ignorée.`);
			continue;
		}

		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		const { recipe: baseRecipe } = parseRecipeFromFrontmatter(frontmatter, file.basename);
		if (!baseRecipe) {
			warnings.push(`Recette de base "${entry.recipeName}" invalide — ignorée.`);
			continue;
		}

		const scaledEntryQuantity = entry.quantity * scaleFactor;
		const fromUnit = entry.unit === '' ? null : findUnit(entry.unit);
		const neededGrams = convertQuantity(scaledEntryQuantity, fromUnit, findUnit('g'));

		if (neededGrams === null) {
			warnings.push(`Impossible de convertir la quantité de "${entry.recipeName}" en grammes — ignorée.`);
			continue;
		}

		// Uses the SAME weight calculation as computeRecipeNutrition (via the
		// shared sumRecipeIngredientWeightsG helper), so both features always
		// agree on a base recipe's total batch weight.
		const baseTotalWeightG = baseRecipe.totalWeightG ?? sumRecipeIngredientWeightsG(app, ingredientsFolder, baseRecipe);
		if (baseTotalWeightG <= 0) {
			warnings.push(`Poids total inconnu pour "${entry.recipeName}" — impossible de calculer les proportions.`);
			continue;
		}

		const baseRecipeFactor = neededGrams / baseTotalWeightG;

		const nextVisiting = new Set(visiting);
		nextVisiting.add(recipe.name);
		const baseResult = flattenRecipeIngredients(app, ingredientsFolder, recipesFolder, baseRecipe, baseRecipeFactor, nextVisiting);
		warnings.push(...baseResult.warnings);
		ingredients.push(...baseResult.ingredients);
	}

	return { ingredients, warnings };
}
