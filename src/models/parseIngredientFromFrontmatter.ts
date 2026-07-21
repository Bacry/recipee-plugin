import { Ingredient, NutritionPer100g } from './Ingredient';

export interface IngredientValidationResult {
	ingredient: Ingredient | null;
	errors: string[];
	warnings: string[];
}

const NUTRITION_KEYS: (keyof NutritionPer100g)[] = [
	'kcal', 'lipids', 'non_saturated_lipids', 'glucids',
	'sugar', 'proteins', 'salt', 'fibers', 'cholesterol',
];

export function parseIngredientFromFrontmatter(
	frontmatter: Record<string, unknown> | undefined,
	fileName: string,
	knownTypes: string[],
	knownShopSections: string[],
): IngredientValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	if (!frontmatter) {
		return { ingredient: null, errors: ['Aucun frontmatter trouvé dans la note.'], warnings: [] };
	}

	// --- Champs obligatoires ---
	const type = frontmatter.type;
	if (typeof type !== 'string' || type.trim() === '') {
		errors.push('"type" est manquant ou n\'est pas un texte valide.');
	} else if (!knownTypes.includes(type)) {
		warnings.push(`"type: ${type}" n'existe pas dans la liste des types configurés (Settings).`);
	}

	const shopSection = frontmatter.shop_section;
	if (typeof shopSection !== 'string' || shopSection.trim() === '') {
		errors.push('"shop_section" est manquant ou n\'est pas un texte valide.');
	} else if (!knownShopSections.includes(shopSection)) {
		warnings.push(`"shop_section: ${shopSection}" n'existe pas dans la liste des rayons configurés (Settings).`);
	}

	const nutritionRaw = frontmatter.nutrition_per_100g;
	const parsedNutrition = {} as NutritionPer100g;

	if (typeof nutritionRaw !== 'object' || nutritionRaw === null) {
		errors.push('"nutrition_per_100g" est manquant ou invalide.');
	} else {
		const nutrition = nutritionRaw as Record<string, unknown>;
		for (const key of NUTRITION_KEYS) {
			const value = nutrition[key];
			if (typeof value !== 'number' || Number.isNaN(value)) {
				errors.push(`"nutrition_per_100g.${key}" est manquant ou n'est pas un nombre valide.`);
			} else {
				parsedNutrition[key] = value;
			}
		}
	}

	// --- Champs optionnels ---
	let densityGMl: number | undefined;
	if (frontmatter.density_g_ml !== undefined && frontmatter.density_g_ml !== null) {
		if (typeof frontmatter.density_g_ml !== 'number' || Number.isNaN(frontmatter.density_g_ml)) {
			errors.push('"density_g_ml" est présent mais n\'est pas un nombre valide.');
		} else {
			densityGMl = frontmatter.density_g_ml;
		}
	}

	let entityWeightG: number | undefined;
	if (frontmatter.entity_weight_g !== undefined && frontmatter.entity_weight_g !== null) {
		if (typeof frontmatter.entity_weight_g !== 'number' || Number.isNaN(frontmatter.entity_weight_g)) {
			errors.push('"entity_weight_g" est présent mais n\'est pas un nombre valide.');
		} else {
			entityWeightG = frontmatter.entity_weight_g;
		}
	}

	let brand: string | undefined;
	if (frontmatter.brand !== undefined && frontmatter.brand !== null) {
		if (typeof frontmatter.brand !== 'string') {
			errors.push('"brand" est présent mais n\'est pas un texte valide.');
		} else {
			brand = frontmatter.brand;
		}
	}

	let source: string | undefined;
	if (frontmatter.source !== undefined && frontmatter.source !== null) {
		if (typeof frontmatter.source !== 'string') {
			errors.push('"source" est présent mais n\'est pas un texte valide.');
		} else {
			source = frontmatter.source;
		}
	}

	let possibleForms: string[] | undefined;
	if (frontmatter.possible_forms !== undefined && frontmatter.possible_forms !== null) {
		if (!Array.isArray(frontmatter.possible_forms) || !frontmatter.possible_forms.every((f) => typeof f === 'string')) {
			errors.push('"possible_forms" est présent mais n\'est pas une liste de textes valide.');
		} else {
			possibleForms = frontmatter.possible_forms as string[];
		}
	}

	if (errors.length > 0) {
		return { ingredient: null, errors, warnings };
	}

	const ingredient: Ingredient = {
		name: fileName,
		type: type as string,
		shop_section: shopSection as string,
		density_g_ml: densityGMl,
		entity_weight_g: entityWeightG,
		source,
		brand,
		possible_forms: possibleForms,
		nutrition_per_100g: parsedNutrition,
	};

	return { ingredient, errors: [], warnings };
}
