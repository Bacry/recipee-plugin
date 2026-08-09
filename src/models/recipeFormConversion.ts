import { Recipe } from './recipe';
import { RecipeFormValues } from '../components/RecipeForm';

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

export function formValuesToRecipe(values: RecipeFormValues): { recipe: Recipe | null; errors: string[] } {
	const errors: string[] = [];

	if (values.name.trim() === '') {
		errors.push('Le nom est obligatoire.');
	}
	if (values.servingsLabel.trim() === '') {
		errors.push('L\'unité de portion est obligatoire.');
	}

	const baseServings = Number(values.baseServings);
	if (values.baseServings.trim() === '' || Number.isNaN(baseServings) || baseServings <= 0) {
		errors.push('"Portions de base" doit être un nombre positif.');
	}

	let preparationDurationMin: number | undefined;
	if (values.preparationDurationMin.trim() !== '') {
		const parsed = Number(values.preparationDurationMin);
		if (Number.isNaN(parsed)) {
			errors.push('"Préparation (min)" n\'est pas un nombre valide.');
		} else {
			preparationDurationMin = parsed;
		}
	}

	let totalWeightG: number | undefined;
	if (values.totalWeightG.trim() !== '') {
		const parsed = Number(values.totalWeightG);
		if (Number.isNaN(parsed)) {
			errors.push('"Poids total mesuré" n\'est pas un nombre valide.');
		} else {
			totalWeightG = parsed;
		}
	}

	let cookingDurationMin: number | undefined;
	if (values.cookingDurationMin.trim() !== '') {
		const parsed = Number(values.cookingDurationMin);
		if (Number.isNaN(parsed)) {
			errors.push('"Cuisson (min)" n\'est pas un nombre valide.');
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
		ingredients: values.ingredients,
		baseRecipes: values.baseRecipes,
		instructions: values.instructions,
		notes: values.notes.trim() || undefined,
		source: values.source.trim() || undefined,
		image: values.image.trim() || undefined,
		fryingOilName: values.fryingOilName.trim() || undefined,
		tags,
		totalWeightG,
		cookedDates: [], // new recipes/edits via the form never set this directly — only "Réalisée aujourd'hui" does, via recordRecipeCookedToday
	};

	return { recipe, errors: [] };
}
