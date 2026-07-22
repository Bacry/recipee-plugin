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

	let tags: string[] = [];
	if (frontmatter.tags !== undefined && frontmatter.tags !== null) {
		if (!Array.isArray(frontmatter.tags)) {
			errors.push('"tags" est présent mais n\'est pas une liste.');
		} else {
			tags = frontmatter.tags.filter((t): t is string => typeof t === 'string');
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
		cookingDurationMin,
		ingredients,
		baseRecipes,
		instructions,
		notes,
		source,
		image,
		tags,
	};

	return { recipe, errors: [], warnings };
}

function parseIngredientEntry(raw: unknown): RecipeIngredientEntry | null {
	if (typeof raw !== 'object' || raw === null) return null;
	const obj = raw as Record<string, unknown>;

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

	return { ingredientName: obj.ingredient_name, complement, quantity, unit: obj.unit, form };
}

// Unlike ingredients, quantity is required here (no null case) — a base
// recipe reference without an amount doesn't make sense.
function parseBaseRecipeEntry(raw: unknown): RecipeBaseRecipeEntry | null {
	if (typeof raw !== 'object' || raw === null) return null;
	const obj = raw as Record<string, unknown>;

	if (typeof obj.recipe_name !== 'string' || obj.recipe_name.trim() === '') return null;
	if (typeof obj.unit !== 'string') return null;
	if (typeof obj.quantity !== 'number' || Number.isNaN(obj.quantity)) return null;

	return { recipeName: obj.recipe_name, quantity: obj.quantity, unit: obj.unit };
}
