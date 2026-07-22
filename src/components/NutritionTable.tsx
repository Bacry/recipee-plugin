import { NutritionPer100g } from '../models/Ingredient';

interface NutritionTableProps {
	per100g: NutritionPer100g;
	total: NutritionPer100g; // already scaled by the current servings factor
	totalWeightG: number; // already scaled by the current servings factor
	perServing: NutritionPer100g | null; // null when servingsLabel is a real unit (g/cl/...) — no middle column then
	servingsLabel: string;
	warnings: string[];
}

const ROWS: { key: keyof NutritionPer100g; label: string; unit: string; indent?: boolean }[] = [
	{ key: 'kcal', label: 'Calories', unit: 'kcal' },
	{ key: 'lipids', label: 'Lipides', unit: 'g' },
	{ key: 'non_saturated_lipids', label: 'dont insaturés', unit: 'g', indent: true },
	{ key: 'glucids', label: 'Glucides', unit: 'g' },
	{ key: 'sugar', label: 'dont sucres', unit: 'g', indent: true },
	{ key: 'proteins', label: 'Protéines', unit: 'g' },
	{ key: 'salt', label: 'Sel', unit: 'g' },
	{ key: 'fibers', label: 'Fibres', unit: 'g' },
	{ key: 'cholesterol', label: 'Cholestérol', unit: 'mg' },
];

function fmt(value: number): string {
	return Number(value.toFixed(2)).toString();
}

export function NutritionTable({ per100g, total, totalWeightG, perServing, servingsLabel, warnings }: NutritionTableProps) {
	return (
		<div>
			<h4>Nutrition</h4>
			<table>
				<thead>
				<tr>
					<th></th>
					<th>Pour 100g</th>
					{perServing && <th>Pour 1 {servingsLabel}</th>}
					<th>Total ({fmt(totalWeightG)}g)</th>
				</tr>
				</thead>
				<tbody>
				{ROWS.map((row) => (
					<tr key={row.key}>
						<td style={row.indent ? { paddingLeft: '1.5em' } : undefined}>{row.label}</td>
						<td>{fmt(per100g[row.key])} {row.unit}</td>
						{perServing && <td>{fmt(perServing[row.key])} {row.unit}</td>}
						<td>{fmt(total[row.key])} {row.unit}</td>
					</tr>
				))}
				</tbody>
			</table>

			{warnings.length > 0 && (
				<ul className="ingredient-validation-warnings">
					{warnings.map((warning, index) => (
						<li key={index}>{warning}</li>
					))}
				</ul>
			)}
		</div>
	);
}
