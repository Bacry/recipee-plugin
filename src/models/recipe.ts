import { Recipe, RecipeIngredientEntry, RecipeBaseRecipeEntry } from '../models/recipe';

export interface RecipeIngredientEntry {
	ingredientName: string;
	quantity: number | null;
	unit: string;
	form?: string;
	complement?: string; // free text, e.g. a specific brand ("Gordon's") — not used to identify the ingredient itself
}

// A reference to another recipe (tagged "base") used as a component of this
// recipe — e.g. "100g of vinegar mix" inside a sushi rice recipe. Unlike
// regular ingredients, quantity is always required (no "à volonté" case
// makes sense here), and unit must be convertible to the base recipe's own
// servingsLabel unit (checked at form-submit time, not enforced by the type).
export interface RecipeBaseRecipeEntry {
	recipeName: string;
	quantity: number;
	unit: string;
}

export interface Recipe {
	name: string;
	baseServings: number;
	servingsLabel: string;
	preparationDurationMin?: number;
	cookingDurationMin?: number;
	ingredients: RecipeIngredientEntry[];
	baseRecipes: RecipeBaseRecipeEntry[]; // always an array, empty if none used
	instructions: string;
	notes?: string;
	source?: string;
	image?: string;
	tags: string[];
	totalWeightG?: number; // experimentally measured final weight in grams — if absent, computed as the sum of ingredient weights instead

}
