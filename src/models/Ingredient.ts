export interface NutritionPer100g {
	kcal: number;
	lipids: number;
	non_saturated_lipids: number;
	glucids: number;
	sugar: number;
	proteins: number;
	salt: number;
	fibers: number;
	cholesterol: number;
}

export interface Ingredient {
	name: string; // dérivé du nom de fichier, pas du frontmatter
	type: string; // validé dynamiquement contre PluginSettings.ingredientTypes
	density_g_ml?: number;
	entity_weight_g?: number;
	shop_section: string; // validé dynamiquement contre PluginSettings.shopSections
	source?: string;
	possible_forms?: string[];
	nutrition_per_100g: NutritionPer100g;
}
