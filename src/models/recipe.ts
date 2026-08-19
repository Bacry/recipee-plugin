import { Recipe, RecipeIngredientEntry, RecipeBaseRecipeEntry } from '../models/recipe';

export interface RecipeIngredientEntry {
	ingredientName: string;
	quantity: number | null;
	unit: string;
	form?: string;
	complement?: string; // free text, e.g. a specific brand ("Gordon's") — not used to identify the ingredient itself
	fried?: boolean;
	isSectionHeader?: boolean; // si vrai, cette entrée n'est pas un ingrédient mais un titre de section (ex: "Pour la pâte") — les autres champs sont ignorés
	sectionTitle?: string;
	order?: number; // position dans la liste unifiée (ingrédients + recettes de base) affichée/éditée
	variant?: string; // nom de la variante à laquelle cet ingrédient est spécifique (doit correspondre à une entrée de Recipe.variants) — absent = commun à toutes les variantes
}


// A reference to another recipe (with isBaseRecipe: true) used as a component
// of this recipe — e.g. "100g of vinegar mix" inside a sushi rice recipe.
// Unlike regular ingredients, quantity is always required (no "à volonté"
// case makes sense here), and unit must be convertible to the base recipe's
// own servingsLabel unit (checked at form-submit time, not enforced by the type).
export interface RecipeBaseRecipeEntry {
	recipeName: string;
	quantity: number;
	unit: string;
	order?: number;
	variant?: string; // same meaning as RecipeIngredientEntry.variant
}

export interface Recipe {
	name: string;
	baseServings: number;
	servingsLabel: string;
	preparationDurationMin?: number;
	cookingDurationMin?: number;
	requiresCooking: boolean;
	madeBeforeTracking: boolean;
	ingredients: RecipeIngredientEntry[];
	baseRecipes: RecipeBaseRecipeEntry[]; // always an array, empty if none used
	isBaseRecipe: boolean; // if true, this recipe can be used as a component of other rec
	variants: string[]; // named variants declared for this recipe (e.g. "Chocolate", "Vanilla") — always an array, empty if the recipe has none. Ingredients/base recipes reference a variant by name via their own `variant` field.
	ratings: Record<string, number>; // 1-5 star rating, keyed by variant name — or RATING_DEFAULT_KEY for a recipe with no variants. Always an object, empty if nothing rated yet.
	instructions: string;
	notes?: string;
	source?: string;
	image?: string;
	tags: string[];
	totalWeightG?: number; // experimentally measured final weight in grams — if absent, computed as the sum of ingredient weights instead
	cookedDates: string[]; // ISO date strings (e.g. "2026-07-25"), one per day the recipe was made — always an array, empty if never
	fryingOilName?: string; // nom de l'ingrédient huile utilisée, absent = pas de friture
}

export const RATING_DEFAULT_KEY = 'default';
