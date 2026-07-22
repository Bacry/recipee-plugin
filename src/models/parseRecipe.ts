import { Recipe, RecipeIngredientEntry, RecipeInstructionSection } from './Recipe';

export interface RecipeParseResult {
	recipe: Recipe | null;
	errors: string[]; // blocking — recipe is null if any of these exist
	warnings: string[]; // non-blocking — e.g. a malformed ingredient entry, skipped
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

	// Optional duration fields — validated only if present.
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

	// Optional notes field — a single free-form markdown block, validated only if present.
	let notes: string | undefined;
	if (frontmatter.notes !== undefined && frontmatter.notes !== null) {
		if (typeof frontmatter.notes !== 'string') {
			errors.push('"notes" est présent mais n\'est pas un texte valide.');
		} else {
			notes = frontmatter.notes;
		}
	}

	// Optional source field — free text, or a URL.
	let source: string | undefined;
	if (frontmatter.source !== undefined && frontmatter.source !== null) {
		if (typeof frontmatter.source !== 'string') {
			errors.push('"source" est présent mais n\'est pas un texte valide.');
		} else {
			source = frontmatter.source;
		}
	}

	// Optional image field — the filename of a vault attachment, resolved to a
// real path at display time via app.vault.getResourcePath.
	let image: string | undefined;
	if (frontmatter.image !== undefined && frontmatter.image !== null) {
		if (typeof frontmatter.image !== 'string') {
			errors.push('"image" est présent mais n\'est pas un texte valide.');
		} else {
			image = frontmatter.image;
		}
	}

	// Tags — always an array; malformed entries are silently dropped rather than
// blocking the whole recipe, since they're purely decorative/organizational.
	let tags: string[] = [];
	if (frontmatter.tags !== undefined && frontmatter.tags !== null) {
		if (!Array.isArray(frontmatter.tags)) {
			errors.push('"tags" est présent mais n\'est pas une liste.');
		} else {
			tags = frontmatter.tags.filter((t): t is string => typeof t === 'string');
		}
	}

	// Ingredients: malformed entries are skipped individually (warning),
	// not treated as a blocking error for the whole recipe.
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

	// Instructions: same approach — malformed sections are skipped with a warning.
	const instructions: RecipeInstructionSection[] = [];
	if (!Array.isArray(frontmatter.instructions)) {
		errors.push('"instructions" est manquant ou n\'est pas une liste.');
	} else {
		for (const raw of frontmatter.instructions) {
			const parsed = parseInstructionSection(raw);
			if (parsed === null) {
				warnings.push(`Une section d'instructions est mal formée et a été ignorée : ${JSON.stringify(raw)}`);
				continue;
			}
			instructions.push(parsed);
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

	// quantity can be a number, or null/undefined (meaning "no specific amount")
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

	return { ingredientName: obj.ingredient_name, quantity, unit: obj.unit, form };
}

// Parses one instruction section: a title plus a single free-form markdown
// block (not a list of steps anymore — the user writes bullets/formatting
// themselves directly in the content string).
function parseInstructionSection(raw: unknown): RecipeInstructionSection | null {
	if (typeof raw !== 'object' || raw === null) return null;
	const obj = raw as Record<string, unknown>;

	if (typeof obj.title !== 'string' || obj.title.trim() === '') return null;
	if (typeof obj.content !== 'string') return null;

	return { title: obj.title, content: obj.content };
}
