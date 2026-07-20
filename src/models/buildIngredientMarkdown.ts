import { IngredientFormValues } from '../components/IngredientForm';

export function buildIngredientMarkdown(values: IngredientFormValues): string {
	const lines: string[] = ['---'];

	lines.push(`type: ${values.type}`);

	const density = Number(values.densityGMl);
	if (values.densityGMl.trim() !== '' && !Number.isNaN(density)) {
		lines.push(`density_g_ml: ${density}`);
	}

	const entityWeight = Number(values.entityWeightG);
	if (values.entityWeightG.trim() !== '' && !Number.isNaN(entityWeight)) {
		lines.push(`entity_weight_g: ${entityWeight}`);
	}

	lines.push(`shop_section: ${values.shopSection}`);

	const forms = values.possibleForms
		.split(',')
		.map((f) => f.trim())
		.filter((f) => f !== '');

	if (forms.length > 0) {
		lines.push('possible_forms:');
		for (const form of forms) {
			lines.push(`  - ${form}`);
		}
	}

	lines.push('nutrition_per_100g:');
	lines.push(`  kcal: ${values.nutrition.kcal}`);
	lines.push(`  lipids: ${values.nutrition.lipids}`);
	lines.push(`  non_saturated_lipids: ${values.nutrition.non_saturated_lipids}`);
	lines.push(`  glucids: ${values.nutrition.glucids}`);
	lines.push(`  sugar: ${values.nutrition.sugar}`);
	lines.push(`  proteins: ${values.nutrition.proteins}`);
	lines.push(`  salt: ${values.nutrition.salt}`);
	lines.push(`  fibers: ${values.nutrition.fibers}`);
	lines.push(`  cholesterol: ${values.nutrition.cholesterol}`);

	lines.push('---');
	lines.push('');

	return lines.join('\n');
}
