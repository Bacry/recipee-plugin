import { ShoppingListContribution } from './ShoppingList';
import { convertQuantity, findUnit } from './units';

export interface AggregationResult {
	totalQuantity: number;
	totalUnit: string;
	unmerged: ShoppingListContribution[];
	// True if alreadyOwned couldn't be converted into totalUnit — the
	// subtraction was skipped in that case, so the displayed total doesn't
	// actually reflect what the user marked as already owned. Surfaced so
	// the UI can warn rather than silently showing a wrong number.
	ownedSubtractionFailed: boolean;
}

export interface DensityInfo {
	densityGMl?: number;
	entityWeightG?: number;
}

export function aggregateContributions(
	contributions: ShoppingListContribution[],
	density: DensityInfo = {},
	alreadyOwned?: { quantity: number; unit: string }
): AggregationResult {
	if (contributions.length === 0) {
		return { totalQuantity: 0, totalUnit: '', unmerged: [], ownedSubtractionFailed: false };
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

	let ownedSubtractionFailed = false;

	if (alreadyOwned) {
		const ownedFromUnit = alreadyOwned.unit === '' ? null : findUnit(alreadyOwned.unit);
		const ownedConverted = convertQuantity(alreadyOwned.quantity, ownedFromUnit, targetUnit, {
			densityGMl: density.densityGMl,
			entityWeightG: density.entityWeightG,
		});

		if (ownedConverted === null) {
			ownedSubtractionFailed = true;
		} else {
			total = Math.max(0, total - ownedConverted);
		}
	}

	return { totalQuantity: total, totalUnit: targetUnitName, unmerged, ownedSubtractionFailed };
}
