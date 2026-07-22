import { Recipe } from './Recipe';

// Serializes a Recipe back into the YAML frontmatter of its note.
// Multiline content (instruction sections, notes) uses YAML's literal block
// scalar syntax ("|"), which preserves line breaks exactly as typed —
// necessary since content now holds free-form markdown, not a simple string.
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
			lines.push(`    quantity: ${entry.quantity ?? ''}`);
			lines.push(`    unit: ${escapeYamlString(entry.unit)}`);
			if (entry.form) {
				lines.push(`    form: ${escapeYamlString(entry.form)}`);
			}
		}
	}

	if (recipe.instructions.length === 0) {
		lines.push('instructions: []');
	} else {
		lines.push('instructions:');
		for (const section of recipe.instructions) {
			lines.push(`  - title: ${escapeYamlString(section.title)}`);
			lines.push('    content: |');
			for (const contentLine of section.content.split('\n')) {
				lines.push(`      ${contentLine}`);
			}
		}
	}

	if (recipe.tags.length > 0) {
		lines.push('tags:');
		for (const tag of recipe.tags) {
			lines.push(`  - ${escapeYamlString(tag)}`);
		}
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


	lines.push('---');
	lines.push('');

	return lines.join('\n');
}

// Wraps a string in double quotes only if needed (contains special YAML
// characters like ":" or "#"), and escapes embedded quotes. Kept simple:
// wraps everything in quotes for safety, consistent with buildIngredientMarkdown.
function escapeYamlString(value: string): string {
	return `"${value.replace(/"/g, '\\"')}"`;
}
