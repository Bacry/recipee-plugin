export interface Unit {
	name: string; // canonical short name, e.g. "g", "kg", "cl"
	ratioToBaseline: number; // ratio to 1g if mass, ratio to 1mL if volume
	isVolume: boolean;
}

// Ratio is:
// - the ratio to 1g if the unit measures mass
// - the ratio to 1mL if the unit measures volume
export const UNITS: Unit[] = [
	{ name: 'kg', ratioToBaseline: 1000, isVolume: false },
	{ name: 'g', ratioToBaseline: 1, isVolume: false },
	{ name: 'l', ratioToBaseline: 1000, isVolume: true },
	{ name: 'dl', ratioToBaseline: 100, isVolume: true },
	{ name: 'cl', ratioToBaseline: 10, isVolume: true },
	{ name: 'ml', ratioToBaseline: 1, isVolume: true },
	{ name: 'cs', ratioToBaseline: 15, isVolume: true }, // cuillère à soupe
	{ name: 'cc', ratioToBaseline: 5, isVolume: true }, // cuillère à café
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
	if (fromUnit?.name === toUnit?.name) return quantity; // handles null === null too

	// Step 1: convert the source quantity into grams, our common baseline.
	let grams: number;
	if (fromUnit === null) {
		if (options.entityWeightG == null) return null;
		grams = quantity * options.entityWeightG;
	} else if (!fromUnit.isVolume) {
		grams = quantity * fromUnit.ratioToBaseline;
	} else {
		if (options.densityGMl == null) return null;
		grams = quantity * fromUnit.ratioToBaseline * options.densityGMl;
	}

	// Step 2: convert grams into the target unit.
	if (toUnit === null) {
		if (options.entityWeightG == null) return null;
		return grams / options.entityWeightG;
	}
	if (!toUnit.isVolume) {
		return grams / toUnit.ratioToBaseline;
	}
	if (options.densityGMl == null) return null;
	return grams / options.densityGMl / toUnit.ratioToBaseline;
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
