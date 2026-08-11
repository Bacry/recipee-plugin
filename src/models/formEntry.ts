import { RecipeIngredientEntry, RecipeBaseRecipeEntry } from './recipe';

export type FormEntry =
	| ({ kind: 'ingredient' } & RecipeIngredientEntry)
	| ({ kind: 'baseRecipe' } & RecipeBaseRecipeEntry);
