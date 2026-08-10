export interface Unit {
	name: string;
	ratioToBaseline: number;
	isVolume: boolean;
	autoConvertTo?: string;
	roundToNearest: number;
	excludeFromPicker?: boolean;
}

export const UNITS: Unit[] = [
	{ name: 'kg', ratioToBaseline: 1000, isVolume: false, roundToNearest: 0.01 },
	{ name: 'g', ratioToBaseline: 1, isVolume: false, roundToNearest: 1 },
	{ name: 'l', ratioToBaseline: 1000, isVolume: true, roundToNearest: 0.01 },
	{ name: 'dl', ratioToBaseline: 100, isVolume: true, roundToNearest: 0.1 },
	{ name: 'cl', ratioToBaseline: 10, isVolume: true, roundToNearest: 0.1 },
	{ name: 'ml', ratioToBaseline: 1, isVolume: true, roundToNearest: 1 },
	{ name: 'cs', ratioToBaseline: 15, isVolume: true, roundToNearest: 1 },
	{ name: 'cc', ratioToBaseline: 5, isVolume: true, roundToNearest: 1 },
	{ name: 'dash', ratioToBaseline: 0.9, isVolume: true, roundToNearest: 1, excludeFromPicker: true },
	{ name: 'cup', ratioToBaseline: 236.588, isVolume: true, autoConvertTo: 'cl', roundToNearest: 0.1 },
	{ name: 'tbsp', ratioToBaseline: 14.787, isVolume: true, autoConvertTo: 'cs', roundToNearest: 1 },
	{ name: 'tsp', ratioToBaseline: 4.929, isVolume: true, autoConvertTo: 'cc', roundToNearest: 1 },
];

export function findUnit(name: string): Unit | null {
	const normalized = name.toLowerCase().trim();
	return UNITS.find((u) => u.name === normalized) ?? null;
}

export interface ConversionOptions {
	densityGMl?: number;
	entityWeightG?: number;
}

export function convertQuantity(
	quantity: number,
	fromUnit: Unit | null,
	toUnit: Unit | null,
	options: ConversionOptions = {}
): number | null {
	if (fromUnit?.name === toUnit?.name) return quantity;

	let baseline: number;
	let baselineIsVolume: boolean;

	if (fromUnit === null) {
		if (options.entityWeightG == null) return null;
		baseline = quantity * options.entityWeightG;
		baselineIsVolume = false;
	} else {
		baseline = quantity * fromUnit.ratioToBaseline;
		baselineIsVolume = fromUnit.isVolume;
	}

	if (toUnit === null) {
		if (options.entityWeightG == null) return null;
		let grams = baseline;
		if (baselineIsVolume) {
			if (options.densityGMl == null) return null;
			grams = baseline * options.densityGMl;
		}
		return grams / options.entityWeightG;
	}

	if (baselineIsVolume === toUnit.isVolume) {
		return baseline / toUnit.ratioToBaseline;
	}

	if (options.densityGMl == null) return null;

	if (baselineIsVolume && !toUnit.isVolume) {
		return (baseline * options.densityGMl) / toUnit.ratioToBaseline;
	} else {
		return (baseline / options.densityGMl) / toUnit.ratioToBaseline;
	}
}

export interface ParsedQuantity {
	quantity: number;
	unit: Unit | null;
}

export function parseQuantityString(input: string): ParsedQuantity | null {
	const trimmed = input.trim();
	if (trimmed.length === 0) return null;
	if (!/^[0-9]/.test(trimmed)) return null;

	const match = trimmed.match(/^[0-9]+(\.[0-9]+)?/);
	if (!match) return null;

	const numberPart = match[0];
	const rest = trimmed.slice(numberPart.length).trim();
	const quantity = Number(numberPart);
	if (Number.isNaN(quantity)) return null;

	if (rest === '') {
		return { quantity, unit: null };
	}

	const unit = findUnit(rest);
	if (!unit) return null;

	return { quantity, unit };
}

export function roundQuantityForUnit(quantity: number, unit: Unit | null): number {
	const step = unit?.roundToNearest ?? 0.01;
	return Math.round(quantity / step) * step;
}

// Formats a quantity for display, capped at 2 decimals and stripped of
// floating-point noise (e.g. 0.1 * 3 = 0.30000000000000004).
export function formatRoundedQuantity(value: number): string {
	return Number(value.toFixed(2)).toString();
}
