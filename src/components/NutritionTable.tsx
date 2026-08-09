import { NutritionPer100g } from '../models/Ingredient';
import { findUnit, roundQuantityForUnit } from '../models/units';

interface NutritionTableProps {
	per100g: NutritionPer100g;
	total: NutritionPer100g; // already scaled by the current servings factor
	totalWeightG: number; // already scaled by the current servings factor
	perServing: NutritionPer100g | null; // null when servingsLabel is a real unit (g/cl/...) — no middle column then
	servingsLabel: string;
	warnings: string[];
	measuredTotalWeightG?: number; // the recipe's manually measured weight, if set
	per100gReliable: boolean; // false = cuisson + pas de poids mesuré → colonne "Pour 100g" non fiable
	fryingInfo: { oilName: string; oilAbsorbedG: number; friedWeightG: number } | null;
	factor: number;
	absorptionPercent: number;
	onAbsorptionPercentChange: (value: number) => void;
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
	return Number(value.toFixed(1)).toString();
}

export function NutritionTable({ per100g, total, totalWeightG, perServing, servingsLabel, warnings, measuredTotalWeightG, per100gReliable, fryingInfo, factor,
								   absorptionPercent, onAbsorptionPercentChange }: NutritionTableProps) {
	return (
		<div>
			<h4>
				Nutrition{' '}
				{measuredTotalWeightG != null
					? `(poids total mesuré : ${totalWeightG}g)`
					: `(poids total calulé : ${totalWeightG}g)`}
			</h4>
			{fryingInfo && (
				<p className="recipe-frying-hypothesis">
					Hypothèse d'absorption de {fryingInfo.oilName} par les aliments frits :{' '}
					<input
						type="number"
						min={0}
						max={100}
						value={absorptionPercent}
						onChange={(e) => onAbsorptionPercentChange(Number(e.target.value) || 0)}
						className="recipe-frying-percent-input"
					/>
					% (= {roundQuantityForUnit(fryingInfo.oilAbsorbedG * factor, findUnit('g'))}g de {fryingInfo.oilName})
				</p>
			)}
			{!per100gReliable && (
				<p className="ingredient-validation-warnings">
					Cette recette nécessite une cuisson et son poids final n'a pas été mesuré — la colonne "Pour 100g" n'est pas fiable.
				</p>
			)}
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
						<td>{per100gReliable ? `${fmt(per100g[row.key])} ${row.unit}` : '-'}</td>
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
