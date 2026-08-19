import { Recipe, RecipeIngredientEntry, RecipeBaseRecipeEntry } from './recipe';

export interface RecipeParseResult {
	recipe: Recipe | null;
	errors: string[];
	warnings: string[];
}

export function parseRecipeFromFrontmatter(
	frontmatter: Record<string, unknown> | undefined,
	fileName: string
): RecipeParseResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	if (!frontmatter) {
		return { recipe: null, errors: ['Aucun frontmatter trouvé dans la note.'], warnings: [] };
	}

	const baseServings = frontmatter.base_servings;
	if (typeof baseServings !== 'number' || Number.isNaN(baseServings) || baseServings <= 0) {
		errors.push('"base_servings" est manquant ou n\'est pas un nombre valide.');
	}

	const servingsLabel = frontmatter.servings_label;
	if (typeof servingsLabel !== 'string' || servingsLabel.trim() === '') {
		errors.push('"servings_label" est manquant ou n\'est pas un texte valide.');
	}

	let preparationDurationMin: number | undefined;
	if (frontmatter.preparation_duration_min !== undefined && frontmatter.preparation_duration_min !== null) {
		if (typeof frontmatter.preparation_duration_min !== 'number') {
			errors.push('"preparation_duration_min" est présent mais n\'est pas un nombre valide.');
		} else {
			preparationDurationMin = frontmatter.preparation_duration_min;
		}
	}

	let cookingDurationMin: number | undefined;
	if (frontmatter.cooking_duration_min !== undefined && frontmatter.cooking_duration_min !== null) {
		if (typeof frontmatter.cooking_duration_min !== 'number') {
			errors.push('"cooking_duration_min" est présent mais n\'est pas un nombre valide.');
		} else {
			cookingDurationMin = frontmatter.cooking_duration_min;
		}
	}

	let notes: string | undefined;
	if (frontmatter.notes !== undefined && frontmatter.notes !== null) {
		if (typeof frontmatter.notes !== 'string') {
			errors.push('"notes" est présent mais n\'est pas un texte valide.');
		} else {
			notes = frontmatter.notes;
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

	let image: string | undefined;
	if (frontmatter.image !== undefined && frontmatter.image !== null) {
		if (typeof frontmatter.image !== 'string') {
			errors.push('"image" est présent mais n\'est pas un texte valide.');
		} else {
			image = frontmatter.image;
		}
	}

	let fryingOilName: string | undefined;
	if (frontmatter.frying_oil_name !== undefined && frontmatter.frying_oil_name !== null) {
		if (typeof frontmatter.frying_oil_name !== 'string') {
			errors.push('"frying_oil_name" est présent mais n\'est pas un texte valide.');
		} else {
			fryingOilName = frontmatter.frying_oil_name;
		}
	}

	let totalWeightG: number | undefined;
	if (frontmatter.total_weight_g !== undefined && frontmatter.total_weight_g !== null) {
		if (typeof frontmatter.total_weight_g !== 'number' || Number.isNaN(frontmatter.total_weight_g)) {
			errors.push('"total_weight_g" est présent mais n\'est pas un nombre valide.');
		} else {
			totalWeightG = frontmatter.total_weight_g;
		}
	}
	let requiresCooking = false;
	if (frontmatter.requires_cooking !== undefined && frontmatter.requires_cooking !== null) {
		if (typeof frontmatter.requires_cooking === 'boolean') {
			requiresCooking = frontmatter.requires_cooking;
		} else if (frontmatter.requires_cooking === 'true' || frontmatter.requires_cooking === 'false') {
			requiresCooking = frontmatter.requires_cooking === 'true';
		} else {
			errors.push('"requires_cooking" est présent mais n\'est pas un booléen valide.');
		}
	}

	let madeBeforeTracking = false;
	if (frontmatter.made_before_tracking !== undefined && frontmatter.made_before_tracking !== null) {
		if (typeof frontmatter.made_before_tracking === 'boolean') {
			madeBeforeTracking = frontmatter.made_before_tracking;
		} else if (frontmatter.made_before_tracking === 'true' || frontmatter.made_before_tracking === 'false') {
			madeBeforeTracking = frontmatter.made_before_tracking === 'true';
		} else {
			errors.push('"made_before_tracking" est présent mais n\'est pas un booléen valide.');
		}
	}

	let isBaseRecipe = false;
	if (frontmatter.is_base_recipe !== undefined && frontmatter.is_base_recipe !== null) {
		if (typeof frontmatter.is_base_recipe === 'boolean') {
			isBaseRecipe = frontmatter.is_base_recipe;
		} else if (frontmatter.is_base_recipe === 'true' || frontmatter.is_base_recipe === 'false') {
			isBaseRecipe = frontmatter.is_base_recipe === 'true';
		} else {
			errors.push('"is_base_recipe" est présent mais n\'est pas un booléen valide.');
		}
	}

	let tags: string[] = [];
	if (frontmatter.tags !== undefined && frontmatter.tags !== null) {
		if (!Array.isArray(frontmatter.tags)) {
			errors.push('"tags" est présent mais n\'est pas une liste.');
		} else {
			tags = frontmatter.tags.filter((t): t is string => typeof t === 'string');
		}
	}

	let variants: string[] = [];
	if (frontmatter.variants !== undefined && frontmatter.variants !== null) {
		if (!Array.isArray(frontmatter.variants)) {
			errors.push('"variants" est présent mais n\'est pas une liste.');
		} else {
			variants = frontmatter.variants.filter((v): v is string => typeof v === 'string');
		}
	}

	let ratings: Record<string, number> = {};
	if (frontmatter.ratings !== undefined && frontmatter.ratings !== null) {
		if (typeof frontmatter.ratings !== 'object' || Array.isArray(frontmatter.ratings)) {
			errors.push('"ratings" est présent mais n\'est pas un objet valide.');
		} else {
			const raw = frontmatter.ratings as Record<string, unknown>;
			for (const [key, value] of Object.entries(raw)) {
				if (typeof value === 'number' && value >= 1 && value <= 5) {
					ratings[key] = value;
				}
			}
		}
	}

	let cookedDates: string[] = [];
	if (frontmatter.cooked_dates !== undefined && frontmatter.cooked_dates !== null) {
		if (!Array.isArray(frontmatter.cooked_dates)) {
			errors.push('"cooked_dates" est présent mais n\'est pas une liste.');
		} else {
			cookedDates = frontmatter.cooked_dates.filter((d): d is string => typeof d === 'string');
		}
	}

	let instructions = '';
	if (frontmatter.instructions !== undefined && frontmatter.instructions !== null) {
		if (typeof frontmatter.instructions !== 'string') {
			errors.push('"instructions" est présent mais n\'est pas un texte valide.');
		} else {
			instructions = frontmatter.instructions;
		}
	}

	const ingredients: RecipeIngredientEntry[] = [];
	if (!Array.isArray(frontmatter.ingredients)) {
		errors.push('"ingredients" est manquant ou n\'est pas une liste.');
	} else {
		for (const raw of frontmatter.ingredients) {
			const parsed = parseIngredientEntry(raw);
			if (parsed === null) {
				warnings.push(`Un ingrédient de la recette est mal formé et a été ignoré : ${JSON.stringify(raw)}`);
				continue;
			}
			ingredients.push(parsed);
		}
	}

	// base_recipes: optional — absent entirely means "no base recipes used".
	// Malformed entries are skipped individually with a warning, same
	// approach as ingredients.
	const baseRecipes: RecipeBaseRecipeEntry[] = [];
	if (frontmatter.base_recipes !== undefined && frontmatter.base_recipes !== null) {
		if (!Array.isArray(frontmatter.base_recipes)) {
			errors.push('"base_recipes" est présent mais n\'est pas une liste.');
		} else {
			for (const raw of frontmatter.base_recipes) {
				const parsed = parseBaseRecipeEntry(raw);
				if (parsed === null) {
					warnings.push(`Une recette de base est mal formée et a été ignorée : ${JSON.stringify(raw)}`);
					continue;
				}
				baseRecipes.push(parsed);
			}
		}
	}

	if (errors.length > 0) {
		return { recipe: null, errors, warnings };
	}

	const recipe: Recipe = {
		name: fileName,
		baseServings: baseServings as number,
		servingsLabel: servingsLabel as string,
		preparationDurationMin,
		requiresCooking,
		madeBeforeTracking,
		isBaseRecipe,
		variants,
		ratings,
		cookingDurationMin,
		fryingOilName,
		ingredients,
		baseRecipes,
		instructions,
		notes,
		source,
		image,
		tags,
		totalWeightG,
		cookedDates,
	};

	return { recipe, errors: [], warnings };
}

function parseIngredientEntry(raw: unknown): RecipeIngredientEntry | null {
	if (typeof raw !== 'object' || raw === null) return null;
	const obj = raw as Record<string, unknown>;

	if (obj.is_section_header === true) {
		// Empty title is valid — it's used as a deliberate "reset" marker to
		// de-indent back out of a section, not just a malformed header.
		if (typeof obj.section_title !== 'string') return null;
		return {
			ingredientName: '',
			quantity: null,
			unit: '',
			isSectionHeader: true,
			sectionTitle: obj.section_title,
			order: typeof obj.order === 'number' ? obj.order : undefined,
		};
	}

	if (typeof obj.ingredient_name !== 'string' || obj.ingredient_name.trim() === '') return null;
	if (typeof obj.unit !== 'string') return null;

	let quantity: number | null = null;
	if (obj.quantity !== undefined && obj.quantity !== null) {
		if (typeof obj.quantity !== 'number' || Number.isNaN(obj.quantity)) return null;
		quantity = obj.quantity;
	}

	let form: string | undefined;
	if (obj.form !== undefined && obj.form !== null) {
		if (typeof obj.form !== 'string') return null;
		form = obj.form;
	}

	let complement: string | undefined;
	if (obj.complement !== undefined && obj.complement !== null) {
		if (typeof obj.complement !== 'string') return null;
		complement = obj.complement;
	}

	let fried: boolean | undefined;
	if (obj.fried !== undefined && obj.fried !== null) {
		if (typeof obj.fried !== 'boolean') return null;
		fried = obj.fried;
	}

	let variant: string | undefined;
	if (obj.variant !== undefined && obj.variant !== null) {
		if (typeof obj.variant !== 'string') return null;
		variant = obj.variant;
	}

	return {
		ingredientName: obj.ingredient_name,
		complement,
		quantity,
		unit: obj.unit,
		form,
		fried,
		order: typeof obj.order === 'number' ? obj.order : undefined,
		variant,
	};
}

// Unlike ingredients, quantity is required here (no null case) — a base
// recipe reference without an amount doesn't make sense.
function parseBaseRecipeEntry(raw: unknown): RecipeBaseRecipeEntry | null {
	if (typeof raw !== 'object' || raw === null) return null;
	const obj = raw as Record<string, unknown>;

	if (typeof obj.recipe_name !== 'string' || obj.recipe_name.trim() === '') return null;
	if (typeof obj.unit !== 'string') return null;
	if (typeof obj.quantity !== 'number' || Number.isNaN(obj.quantity)) return null;

	return {
		recipeName: obj.recipe_name,
		quantity: obj.quantity,
		unit: obj.unit,
		order: typeof obj.order === 'number' ? obj.order : undefined,
		variant: typeof obj.variant === 'string' ? obj.variant : undefined,
	};
}

// Permissive reading of a template file — unlike parseRecipeFromFrontmatter,
// missing/invalid fields are simply left empty/undefined rather than
// rejecting the whole file. Templates are partial by design; any subset of
// fields can be filled in.
export function parseRecipeTemplate(
	frontmatter: Record<string, unknown> | undefined,
	fileName: string
): Recipe {
	const baseServings = typeof frontmatter?.base_servings === 'number' ? frontmatter.base_servings : 0;
	const servingsLabel = typeof frontmatter?.servings_label === 'string' ? frontmatter.servings_label : '';

	const preparationDurationMin = typeof frontmatter?.preparation_duration_min === 'number'
		? frontmatter.preparation_duration_min : undefined;
	const cookingDurationMin = typeof frontmatter?.cooking_duration_min === 'number'
		? frontmatter.cooking_duration_min : undefined;

	const notes = typeof frontmatter?.notes === 'string' ? frontmatter.notes : undefined;
	const source = typeof frontmatter?.source === 'string' ? frontmatter.source : undefined;
	const image = typeof frontmatter?.image === 'string' ? frontmatter.image : undefined;
	const instructions = typeof frontmatter?.instructions === 'string' ? frontmatter.instructions : '';
	const requiresCooking = typeof frontmatter?.requires_cooking === 'boolean' ? frontmatter.requires_cooking : false;
	const madeBeforeTracking = typeof frontmatter?.made_before_tracking === 'boolean' ? frontmatter.made_before_tracking : false;
	const isBaseRecipe = typeof frontmatter?.is_base_recipe === 'boolean' ? frontmatter.is_base_recipe : false;

	const tags = Array.isArray(frontmatter?.tags)
		? frontmatter.tags.filter((t): t is string => typeof t === 'string')
		: [];
	const variants = Array.isArray(frontmatter?.variants)
		? frontmatter.variants.filter((v): v is string => typeof v === 'string')
		: [];
	const ratings: Record<string, number> = {};
	if (frontmatter?.ratings && typeof frontmatter.ratings === 'object' && !Array.isArray(frontmatter.ratings)) {
		for (const [key, value] of Object.entries(frontmatter.ratings as Record<string, unknown>)) {
			if (typeof value === 'number' && value >= 1 && value <= 5) {
				ratings[key] = value;
			}
		}
	}
	const ingredients = Array.isArray(frontmatter?.ingredients)
		? frontmatter.ingredients
			.map((raw: unknown) => {
				if (typeof raw !== 'object' || raw === null) return null;
				const obj = raw as Record<string, unknown>;

				if (obj.is_section_header === true) {
					return {
						ingredientName: '',
						quantity: null,
						unit: '',
						isSectionHeader: true,
						sectionTitle: typeof obj.section_title === 'string' ? obj.section_title : '',
						order: typeof obj.order === 'number' ? obj.order : undefined,
					};
				}

				if (typeof obj.ingredient_name !== 'string') return null;
				return {
					ingredientName: obj.ingredient_name,
					complement: typeof obj.complement === 'string' ? obj.complement : undefined,
					quantity: typeof obj.quantity === 'number' ? obj.quantity : null,
					unit: typeof obj.unit === 'string' ? obj.unit : '',
					form: typeof obj.form === 'string' ? obj.form : undefined,
					fried: typeof obj.fried === 'boolean' ? obj.fried : undefined,
					order: typeof obj.order === 'number' ? obj.order : undefined,
					variant: typeof obj.variant === 'string' ? obj.variant : undefined,
				};
			})
			.filter((entry): entry is NonNullable<typeof entry> => entry !== null)
		: [];

	const baseRecipes = Array.isArray(frontmatter?.base_recipes)
		? frontmatter.base_recipes
			.map((raw: unknown) => {
				if (typeof raw !== 'object' || raw === null) return null;
				const obj = raw as Record<string, unknown>;
				if (typeof obj.recipe_name !== 'string' || typeof obj.quantity !== 'number' || typeof obj.unit !== 'string') return null;
				return {
					recipeName: obj.recipe_name,
					quantity: obj.quantity,
					unit: obj.unit,
					order: typeof obj.order === 'number' ? obj.order : undefined,
					variant: typeof obj.variant === 'string' ? obj.variant : undefined,
				};
			})
			.filter((entry): entry is NonNullable<typeof entry> => entry !== null)
		: [];
	const fryingOilName = typeof frontmatter?.frying_oil_name === 'string' ? frontmatter.frying_oil_name : undefined;

	return {
		name: fileName,
		baseServings,
		servingsLabel,
		preparationDurationMin,
		cookingDurationMin,
		requiresCooking,
		madeBeforeTracking,
		isBaseRecipe,
		variants,
		ratings,
		fryingOilName,
		ingredients,
		baseRecipes,
		instructions,
		notes,
		source,
		image,
		tags,
		cookedDates: [],
	};
}
