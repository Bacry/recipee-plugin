import { Ingredient } from './Ingredient';
import { IngredientFormValues } from '../components/IngredientForm';

// Converts a typed Ingredient (numbers) back into form values (strings),
// so the form can be prefilled when editing an existing ingredient note.
export function ingredientToFormValues(ingredient: Ingredient): IngredientFormValues {
	return {
		name: ingredient.name,
		nameEn: '', // not stored in the model, left empty — user can re-search if needed
		type: ingredient.type,
		shopSection: ingredient.shop_section,
		densityGMl: ingredient.density_g_ml?.toString() ?? '',
		entityWeightG: ingredient.entity_weight_g?.toString() ?? '',
		possibleForms: ingredient.possible_forms?.join(', ') ?? '',
		brand: ingredient.brand ?? '',
		nutrition: ingredient.nutrition_per_100g,
	};
}
