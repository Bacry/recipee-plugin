import { convertQuantity, findUnit } from './units';

export interface QuantityHintOptions {
	densityGMl?: number;
	entityWeightG?: number;
	juiceYieldMl?: number;
}

export interface QuantityWithHint {
	main: string;
	hint: string;
}

export function formatQuantity(value: number, unit: string): string {
	if (unit === '') {
		return Math.ceil(value).toString();
	}
	return Number(value.toFixed(2)).toString();
}
// Rounds a count up to the nearest quarter (e.g. 0.15 -> 0.25, 1.1 -> 1.25,
// 2.0 -> 2.0), formatted as a compact label using fraction glyphs — more
// useful in a kitchen context than a plain integer (e.g. "1¼ fruits" tells
// you to juice one whole fruit plus a quarter of another, rather than
// rounding up to a full 2 and overstating what's needed).
const QUARTER_GLYPHS: Record<number, string> = { 0.25: '¼', 0.5: '½', 0.75: '¾' };

function formatQuarterRoundedCount(value: number): string {
	const rounded = Math.max(0.25, Math.ceil(value * 4) / 4);
	const whole = Math.floor(rounded);
	const fraction = Number((rounded - whole).toFixed(2));

	if (fraction === 0) return whole.toString();
	const glyph = QUARTER_GLYPHS[fraction];
	return whole === 0 ? glyph : `${whole}${glyph}`;
}

export function formatQuantityWithHint(
	quantity: number,
	unit: string,
	options: QuantityHintOptions,
	t: (key: string) => string
): QuantityWithHint {
	const formatted = formatQuantity(quantity, unit);
	const main = unit ? `${formatted}${unit}` : formatted;

	let hint = '';

	if (unit !== '' && options.entityWeightG != null) {
		const fromUnit = findUnit(unit);
		const entityCount = convertQuantity(quantity, fromUnit, null, {
			densityGMl: options.densityGMl,
			entityWeightG: options.entityWeightG,
		});
		if (entityCount !== null) {
			hint = `(~ ${formatQuarterRoundedCount(entityCount)})`;
		}
	}

	if (unit !== '' && options.juiceYieldMl != null) {
		const fromUnit = findUnit(unit);
		if (fromUnit?.isVolume) {
			const mlAmount = convertQuantity(quantity, fromUnit, findUnit('ml'));
			if (mlAmount !== null) {
				const fruitCount = mlAmount / options.juiceYieldMl;
				const label = formatQuarterRoundedCount(fruitCount);
				const isPlural = fruitCount > 1;
				hint = `(~ ${label} ${t('shoppingListDisplay.fruitCount').replace('{plural}', isPlural ? 's' : '')})`;
			}
		}
	}

	return { main, hint };
}
