import { Recipe } from './recipe';
import { RecipeFormValues } from '../components/RecipeForm';
import { t } from '../i18n/strings';
import type { Language } from '../i18n/strings';

export function recipeToFormValues(recipe: Recipe, filePath: string, recipesFolder: string): RecipeFormValues {
	// Derives the subfolder from the file's actual path — e.g. if filePath is
	// "Recettes/Cocktails/mojito.md" and recipesFolder is "Recettes", subfolder is "Cocktails".
	const relativePath = filePath.startsWith(recipesFolder + '/') ? filePath.slice(recipesFolder.length + 1) : filePath;
	const lastSlash = relativePath.lastIndexOf('/');
	const subfolder = lastSlash === -1 ? '' : relativePath.slice(0, lastSlash);

	return {
		name: recipe.name,
		baseServings: recipe.baseServings.toString(),
		servingsLabel: recipe.servingsLabel,
		preparationDurationMin: recipe.preparationDurationMin?.toString() ?? '',
		cookingDurationMin: recipe.cookingDurationMin?.toString() ?? '',
		requiresCooking: recipe.requiresCooking,
		madeBeforeTracking: recipe.madeBeforeTracking,
		isBaseRecipe: recipe.isBaseRecipe,
		variants: recipe.variants,
		ingredients: recipe.ingredients,
		baseRecipes: recipe.baseRecipes,
		instructions: recipe.instructions,
		notes: recipe.notes ?? '',
		source: recipe.source ?? '',
		image: recipe.image ?? '',
		tags: recipe.tags.join(', '),
		totalWeightG: recipe.totalWeightG?.toString() ?? '',
		fryingOilName: recipe.fryingOilName ?? '',
		subfolder,
	};
}

export function formValuesToRecipe(values: RecipeFormValues, language: Language = 'fr'): { recipe: Recipe | null; errors: string[] } {
	const errors: string[] = [];

	if (values.name.trim() === '') {
		errors.push(t('recipeFormConversion.nameRequired', language));
	}
	if (values.servingsLabel.trim() === '') {
		errors.push(t('recipeFormConversion.servingsLabelRequired', language));
	}

	const baseServings = Number(values.baseServings);
	if (values.baseServings.trim() === '' || Number.isNaN(baseServings) || baseServings <= 0) {
		errors.push(t('recipeFormConversion.baseServingsInvalid', language));
	}

	let preparationDurationMin: number | undefined;
	if (values.preparationDurationMin.trim() !== '') {
		const parsed = Number(values.preparationDurationMin);
		if (Number.isNaN(parsed)) {
			errors.push(t('recipeFormConversion.preparationDurationInvalid', language));
		} else {
			preparationDurationMin = parsed;
		}
	}

	let totalWeightG: number | undefined;
	if (values.totalWeightG.trim() !== '') {
		const parsed = Number(values.totalWeightG);
		if (Number.isNaN(parsed)) {
			errors.push(t('recipeFormConversion.totalWeightInvalid', language));
		} else {
			totalWeightG = parsed;
		}
	}

	let cookingDurationMin: number | undefined;
	if (values.cookingDurationMin.trim() !== '') {
		const parsed = Number(values.cookingDurationMin);
		if (Number.isNaN(parsed)) {
			errors.push(t('recipeFormConversion.cookingDurationInvalid', language));
		} else {
			cookingDurationMin = parsed;
		}
	}

	if (errors.length > 0) {
		return { recipe: null, errors };
	}

	const tags = values.tags
		.split(',')
		.map((t) => t.trim())
		.filter((t) => t !== '');

	const recipe: Recipe = {
		name: values.name.trim(),
		baseServings,
		servingsLabel: values.servingsLabel.trim(),
		preparationDurationMin,
		cookingDurationMin,
		requiresCooking: values.requiresCooking,
		madeBeforeTracking: values.madeBeforeTracking,
		isBaseRecipe: values.isBaseRecipe,
		variants: values.variants,
		ratings: {},
		ingredients: values.ingredients,
		baseRecipes: values.baseRecipes,
		instructions: values.instructions,
		notes: values.notes.trim() || undefined,
		source: values.source.trim() || undefined,
		image: values.image.trim() || undefined,
		fryingOilName: values.fryingOilName.trim() || undefined,
		tags,
		totalWeightG,
		cookedDates: [],
	};

	return { recipe, errors: [] };
}
