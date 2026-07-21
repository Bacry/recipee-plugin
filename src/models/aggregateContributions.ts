import { ShoppingListContribution } from './ShoppingList';
import { convertQuantity, findUnit } from './units';

export interface AggregationResult {
	totalQuantity: number;
	totalUnit: string; // matches the first contribution's unit — that's our merge target
	// Contributions that couldn't be converted into totalUnit (e.g. mixing
	// volume and mass without a known density) are kept separate here,
	// rather than silently dropped or wrongly summed.
	unmerged: ShoppingListContribution[];
}

export interface DensityInfo {
	densityGMl?: number;
	entityWeightG?: number;
}

// Sums all contributions into a single quantity, expressed in the unit of
// the FIRST contribution (as requested — no "smart" choice of best unit).
// Any contribution that can't be converted (missing density/entity weight)
// is left out of the sum and reported separately in `unmerged`.
export function aggregateContributions(
	contributions: ShoppingListContribution[],
	density: DensityInfo = {}
): AggregationResult {
	if (contributions.length === 0) {
		return { totalQuantity: 0, totalUnit: '', unmerged: [] };
	}

	const targetUnitName = contributions[0].unit;
	const targetUnit = targetUnitName === '' ? null : findUnit(targetUnitName);

	let total = 0;
	const unmerged: ShoppingListContribution[] = [];

	for (const contribution of contributions) {
		const fromUnit = contribution.unit === '' ? null : findUnit(contribution.unit);

		const converted = convertQuantity(contribution.quantity, fromUnit, targetUnit, {
			densityGMl: density.densityGMl,
			entityWeightG: density.entityWeightG,
		});

		if (converted === null) {
			unmerged.push(contribution);
		} else {
			total += converted;
		}
	}

	return { totalQuantity: total, totalUnit: targetUnitName, unmerged };
}
