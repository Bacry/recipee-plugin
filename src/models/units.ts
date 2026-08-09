export interface Unit {
	name: string; // canonical short name, e.g. "g", "kg", "cl"
	ratioToBaseline: number; // ratio to 1g if mass, ratio to 1mL if volume
	isVolume: boolean;
	autoConvertTo?: string; // si présent, cette unité ne doit jamais être stockée telle quelle — toujours convertie vers l'unité nommée ici (ou vers un poids si la densité de l'ingrédient est connue)
	roundToNearest: number; // ex: 1 = arrondi à l'entier, 0.1 = arrondi au dixième, 0
}

// Ratio is:
// - the ratio to 1g if the unit measures mass
// - the ratio to 1mL if the unit measures volume
export const UNITS: Unit[] = [
	{ name: 'kg', ratioToBaseline: 1000, isVolume: false, roundToNearest: 0.01 },
	{ name: 'g', ratioToBaseline: 1, isVolume: false, roundToNearest: 1 },
	{ name: 'l', ratioToBaseline: 1000, isVolume: true, roundToNearest: 0.01 },
	{ name: 'dl', ratioToBaseline: 100, isVolume: true, roundToNearest: 0.1 },
	{ name: 'cl', ratioToBaseline: 10, isVolume: true, roundToNearest: 0.1 },
	{ name: 'ml', ratioToBaseline: 1, isVolume: true, roundToNearest: 1 },
	{ name: 'cs', ratioToBaseline: 15, isVolume: true, roundToNearest: 1 },
	{ name: 'cc', ratioToBaseline: 5, isVolume: true, roundToNearest: 1 },
	{ name: 'dash', ratioToBaseline: 0.9, isVolume: true, roundToNearest: 1 },
	{ name: 'cup', ratioToBaseline: 236.588, isVolume: true, autoConvertTo: 'cl', roundToNearest: 0.1 },
	{ name: 'tbsp', ratioToBaseline: 14.787, isVolume: true, autoConvertTo: 'cs', roundToNearest: 1 },
	{ name: 'tsp', ratioToBaseline: 4.929, isVolume: true, autoConvertTo: 'cc', roundToNearest: 1 },
];

// Looks up a unit by its exact name (case-insensitive). Returns null if unknown —
// callers must handle "not a real unit" explicitly, we never invent one.
export function findUnit(name: string): Unit | null {
	const normalized = name.toLowerCase().trim();
	return UNITS.find((u) => u.name === normalized) ?? null;
}

export interface ConversionOptions {
	densityGMl?: number; // required when converting between mass and volume
	entityWeightG?: number; // required when converting to/from an entity (null unit)
}

// Converts a quantity from one unit to another.
// unit = null means "entity" (a countable item with no unit, e.g. "3 eggs").
// Returns null if the conversion can't be done without missing data
// (e.g. converting volume <-> mass without a density).
export function convertQuantity(
	quantity: number,
	fromUnit: Unit | null,
	toUnit: Unit | null,
	options: ConversionOptions = {}
): number | null {
	if (fromUnit?.name === toUnit?.name) return quantity;

	// Step 1: convert the source quantity into a common baseline —
	// grams if fromUnit is a mass unit, mL if it's a volume unit — WITHOUT
	// involving density yet. Density is only ever needed when crossing
	// between mass and volume, handled separately in step 3.
	let baseline: number; // grams if mass, mL if volume
	let baselineIsVolume: boolean;

	if (fromUnit === null) {
		if (options.entityWeightG == null) return null;
		baseline = quantity * options.entityWeightG; // grams
		baselineIsVolume = false;
	} else {
		baseline = quantity * fromUnit.ratioToBaseline;
		baselineIsVolume = fromUnit.isVolume;
	}

	// Step 2: if converting to an entity, we need grams specifically —
	// convert baseline to grams first if it's currently in mL (needs density).
	if (toUnit === null) {
		if (options.entityWeightG == null) return null;
		let grams = baseline;
		if (baselineIsVolume) {
			if (options.densityGMl == null) return null;
			grams = baseline * options.densityGMl;
		}
		return grams / options.entityWeightG;
	}

	// Step 3: convert baseline into the target unit's own family. Density is
	// ONLY needed here if we're crossing between mass and volume — same
	// family (volume->volume or mass->mass) never touches density at all.
	if (baselineIsVolume === toUnit.isVolume) {
		return baseline / toUnit.ratioToBaseline;
	}

	if (options.densityGMl == null) return null;

	if (baselineIsVolume && !toUnit.isVolume) {
		// mL -> grams -> target mass unit
		return (baseline * options.densityGMl) / toUnit.ratioToBaseline;
	} else {
		// grams -> mL -> target volume unit
		return (baseline / options.densityGMl) / toUnit.ratioToBaseline;
	}
}

export interface ParsedQuantity {
	quantity: number;
	unit: Unit | null; // null = entity (no unit), e.g. "3" means "3 units"
}

// Parses a string like "200g", "1.5kg", or "3" (entity) into a quantity + unit.
// Returns null if the string doesn't start with a digit, or if the text after
// the number doesn't match any known unit — callers should treat that as
// "not a valid quantity token yet", not silently accept it as a made-up unit.
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

// Rounds a quantity according to its unit's own precision rule (e.g. grams
// round to whole numbers, cl to tenths, cs/cc to quarters). Falls back to a
// generic 2-decimal rounding for entities (unit === null), since they have
// no rounding rule of their own — a "3.7 eggs" situation only ever arises
// from a scaling factor, and 2 decimals is a reasonable generic default.
export function roundQuantityForUnit(quantity: number, unit: Unit | null): number {
	const step = unit?.roundToNearest ?? 0.01;
	return Math.round(quantity / step) * step;
}
