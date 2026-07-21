import { requestUrl } from 'obsidian';

export interface UsdaResult {
	description: string;
	dataType?: string;
	kcal?: number;
	lipids?: number;
	saturatedLipids?: number;
	glucids?: number;
	sugar?: number;
	proteins?: number;
	salt?: number;
	fibers?: number;
	cholesterol?: number;
}

const NUTRIENT_NAME_MAP: Record<string, keyof Omit<UsdaResult, 'description' | 'dataType'>> = {
	'Energy': 'kcal',
	'Total lipid (fat)': 'lipids',
	'Fatty acids, total saturated': 'saturatedLipids',
	'Carbohydrate, by difference': 'glucids',
	'Sugars, total including NLEA': 'sugar',
	'Sugars, total NLEA': 'sugar', // USDA uses this shorter label in some data types (e.g. Foundation)
	'Total Sugars': 'sugar', // yet another label variant used for this food entry
	'Protein': 'proteins',
	'Sodium, Na': 'salt',
	'Fiber, total dietary': 'fibers',
	'Cholesterol': 'cholesterol',
};


export async function searchUsda(query: string, apiKey: string): Promise<UsdaResult[]> {
	const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&dataType=Foundation,SR%20Legacy&pageSize=10&api_key=${apiKey}`;

	const response = await requestUrl({ url });
	const data = response.json;


	return (data.foods ?? []).map((food: any) => {
		const result: UsdaResult = { description: food.description, dataType: food.dataType };

		for (const nutrient of food.foodNutrients ?? []) {
			// Energy appears twice in USDA data (kcal and kJ) — only trust the kcal one.
			if (nutrient.nutrientName === 'Energy' && nutrient.unitName !== 'KCAL') {
				continue;
			}

			const key = NUTRIENT_NAME_MAP[nutrient.nutrientName];
			if (!key) continue;

			// USDA reports sodium in mg, not salt in g. Convert: mg → g (÷1000),
			// then sodium → salt (×2.5, standard conversion factor).
			if (key === 'salt') {
				result.salt = (nutrient.value / 1000) * 2.5;
			} else {
				result[key] = nutrient.value;
			}
		}

		return result;
	});
}
