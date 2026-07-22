import { Recipe } from './recipe';

export function buildRecipeMarkdown(recipe: Recipe): string {
	const lines: string[] = ['---'];

	lines.push(`base_servings: ${recipe.baseServings}`);
	lines.push(`servings_label: ${escapeYamlString(recipe.servingsLabel)}`);

	if (recipe.preparationDurationMin != null) {
		lines.push(`preparation_duration_min: ${recipe.preparationDurationMin}`);
	}
	if (recipe.cookingDurationMin != null) {
		lines.push(`cooking_duration_min: ${recipe.cookingDurationMin}`);
	}

	if (recipe.ingredients.length === 0) {
		lines.push('ingredients: []');
	} else {
		lines.push('ingredients:');
		for (const entry of recipe.ingredients) {
			lines.push(`  - ingredient_name: ${escapeYamlString(entry.ingredientName)}`);
			if (entry.complement) {
				lines.push(`    complement: ${escapeYamlString(entry.complement)}`);
			}
			lines.push(`    quantity: ${entry.quantity ?? ''}`);
			lines.push(`    unit: ${escapeYamlString(entry.unit)}`);
			if (entry.form) {
				lines.push(`    form: ${escapeYamlString(entry.form)}`);
			}
			if (entry.form) {
				lines.push(`    form: ${escapeYamlString(entry.form)}`);
			}
		}
	}

	// base_recipes: only written if non-empty, since it's an optional feature
	// most recipes won't use.
	if (recipe.baseRecipes.length > 0) {
		lines.push('base_recipes:');
		for (const entry of recipe.baseRecipes) {
			lines.push(`  - recipe_name: ${escapeYamlString(entry.recipeName)}`);
			lines.push(`    quantity: ${entry.quantity}`);
			lines.push(`    unit: ${escapeYamlString(entry.unit)}`);
		}
	}

	lines.push('instructions: |');
	for (const line of recipe.instructions.split('\n')) {
		lines.push(`  ${line}`);
	}

	if (recipe.notes) {
		lines.push('notes: |');
		for (const notesLine of recipe.notes.split('\n')) {
			lines.push(`  ${notesLine}`);
		}
	}

	if (recipe.source) {
		lines.push(`source: ${escapeYamlString(recipe.source)}`);
	}

	if (recipe.image) {
		lines.push(`image: ${escapeYamlString(recipe.image)}`);
	}

	if (recipe.totalWeightG != null) {
		lines.push(`total_weight_g: ${recipe.totalWeightG}`);
	}

	if (recipe.tags.length > 0) {
		lines.push('tags:');
		for (const tag of recipe.tags) {
			lines.push(`  - ${escapeYamlString(tag)}`);
		}
	}

	lines.push('---');
	lines.push('');

	return lines.join('\n');
}

function escapeYamlString(value: string): string {
	return `"${value.replace(/"/g, '\\"')}"`;
}
