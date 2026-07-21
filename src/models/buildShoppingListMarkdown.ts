import { ShoppingList } from './ShoppingList';

// Serializes a ShoppingList back into the YAML frontmatter of the "Courses" note.
export function buildShoppingListMarkdown(list: ShoppingList): string {
	const lines: string[] = ['---'];

	if (list.items.length === 0) {
		lines.push('items: []');
	} else {
		lines.push('items:');
		for (const item of list.items) {
			lines.push(`  - id: "${item.id}"`);
			lines.push(`    name: "${escapeYamlString(item.name)}"`);
			lines.push(`    complement: "${escapeYamlString(item.complement)}"`);
			lines.push(`    checked: ${item.checked}`);
			if (item.contributions.length === 0) {
				lines.push('    contributions: []');
			} else {
				lines.push('    contributions:');
				for (const contribution of item.contributions) {
					lines.push(`      - quantity: ${contribution.quantity}`);
					lines.push(`        unit: "${escapeYamlString(contribution.unit)}"`);
					lines.push(`        source: "${escapeYamlString(contribution.source)}"`);
				}
			}
		}
	}

	lines.push('---');
	lines.push('');

	return lines.join('\n');
}

// Escapes double quotes inside a string value, so names/complements containing
// a " don't break the YAML structure when wrapped in double quotes.
function escapeYamlString(value: string): string {
	return value.replace(/"/g, '\\"');
}
