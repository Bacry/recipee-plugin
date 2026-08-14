import { NutritionPer100g } from '../models/Ingredient';
import { findUnit, roundQuantityForUnit } from '../models/units';
import { useT } from '../i18n/LanguageContext';

interface NutritionTableProps {
	titleClass?: string;
	contentClass?: string;
	per100g: NutritionPer100g;
	total: NutritionPer100g;
	totalWeightG: number;
	perServing: NutritionPer100g | null;
	servingsLabel: string;
	warnings: string[];
	measuredTotalWeightG?: number;
	per100gReliable: boolean;
	fryingInfo: { oilName: string; oilAbsorbedG: number; friedWeightG: number } | null;
	factor: number;
	absorptionPercent: number;
	onAbsorptionPercentChange: (value: number) => void;
}

function fmt(value: number): string {
	return Number(value.toFixed(0)).toString();
}

export function RecipeNutritionTable({ titleClass, contentClass, per100g, total, totalWeightG, perServing, servingsLabel, warnings, measuredTotalWeightG, per100gReliable, fryingInfo, factor,
										 absorptionPercent, onAbsorptionPercentChange }: NutritionTableProps) {
	const t = useT();

	const ROWS: { key: keyof NutritionPer100g; label: string; unit: string; indent?: boolean }[] = [
		{ key: 'kcal', label: t('recipeNutritionTable.row.kcal'), unit: 'kcal' },
		{ key: 'lipids', label: t('recipeNutritionTable.row.lipids'), unit: 'g' },
		{ key: 'non_saturated_lipids', label: t('recipeNutritionTable.row.nonSaturatedLipids'), unit: 'g', indent: true },
		{ key: 'glucids', label: t('recipeNutritionTable.row.glucids'), unit: 'g' },
		{ key: 'sugar', label: t('recipeNutritionTable.row.sugar'), unit: 'g', indent: true },
		{ key: 'proteins', label: t('recipeNutritionTable.row.proteins'), unit: 'g' },
		{ key: 'salt', label: t('recipeNutritionTable.row.salt'), unit: 'g' },
		{ key: 'fibers', label: t('recipeNutritionTable.row.fibers'), unit: 'g' },
		{ key: 'cholesterol', label: t('recipeNutritionTable.row.cholesterol'), unit: 'mg' },
	];

	return (
		<div>
			<div className={titleClass}>
				{t('recipeNutritionTable.title')}{' '}
				{measuredTotalWeightG != null
					? t('recipeNutritionTable.title.measured').replace('{weight}', fmt(totalWeightG))
					: t('recipeNutritionTable.title.calculated').replace('{weight}', fmt(totalWeightG))}
			</div>
			<div className={contentClass}>
				{fryingInfo && (
					<p className="recipe-frying-hypothesis">
						{t('recipeNutritionTable.frying.hypothesis').replace('{oilName}', fryingInfo.oilName)}{' '}
						<input
							type="number"
							min={0}
							max={100}
							value={absorptionPercent}
							onChange={(e) => onAbsorptionPercentChange(Number(e.target.value) || 0)}
							className="recipe-frying-percent-input"
						/>
						{t('recipeNutritionTable.frying.amount')
							.replace('{amount}', roundQuantityForUnit(fryingInfo.oilAbsorbedG * factor, findUnit('g')).toString())
							.replace('{oilName}', fryingInfo.oilName)}
					</p>
				)}
				{!per100gReliable && (
					<p className="ingredient-validation-warnings">
						{t('recipeNutritionTable.unreliable')}
					</p>
				)}
				<table>
					<thead>
					<tr>
						<th></th>
						<th>{t('recipeNutritionTable.column.per100g')}</th>
						{perServing && <th>{t('recipeNutritionTable.column.perServing').replace('{label}', servingsLabel)}</th>}
						<th>{t('recipeNutritionTable.column.total').replace('{weight}', fmt(totalWeightG))}</th>
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
					<ul>
						{warnings.map((warning, index) => (
							<li key={index}>{warning}</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
