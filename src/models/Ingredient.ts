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
	brand?: string; // optional — only meaningful for processed foods where brand affects nutrition (e.g. low-sodium soy sauce)
	possible_forms?: string[];
	juice_yield_ml?: number; // pour un jus : combien de mL équivalent à 1 fruit frais — utilisé uniquement pour suggérer une alternative d'achat dans la liste de courses, sans impact sur le calcul nutritionnel
	needs_review?: boolean; // true si générée en masse par l'IA et pas encore validée par l'utilisateur — absent/false = normale
	nutrition_per_100g: NutritionPer100g;
}
