import { ShoppingListItem } from '../models/ShoppingList';
import { AggregationResult } from '../models/aggregateContributions';

export interface ResolvedItem {
	item: ShoppingListItem;
	shopSection: string;
	aggregation: AggregationResult;
	isKnownIngredient: boolean;
}

interface ShoppingListDisplayProps {
	resolvedItems: ResolvedItem[];
	onToggleChecked: (itemId: string) => void;
	onDelete: (itemId: string) => void;
	onSetSection: (itemId: string, event: React.MouseEvent) => void; // needs the click event to anchor the menu
}

function groupBySection(resolvedItems: ResolvedItem[]): Map<string, ResolvedItem[]> {
	const groups = new Map<string, ResolvedItem[]>();

	for (const resolved of resolvedItems) {
		const existing = groups.get(resolved.shopSection) ?? [];
		existing.push(resolved);
		groups.set(resolved.shopSection, existing);
	}

	return groups;
}
// Rounds a number to at most 2 decimal places, without leaving trailing zeros
// (e.g. 0.5 stays "0.5", not "0.50"; 500 stays "500", not "500.00").
function formatNumber(value: number): string {
	return Number(value.toFixed(2)).toString();
}

// Rounds to 2 decimals when a unit is present (e.g. weights/volumes),
// or rounds up to the next whole number when there's no unit at all
// (countable items, like "4" courgettes — never a fractional count).
function formatQuantity(value: number, unit: string): string {
	if (unit === '') {
		return Math.ceil(value).toString();
	}
	return Number(value.toFixed(2)).toString();
}

// Formats the aggregated total, plus any leftover contributions that
// couldn't be merged into it (shown separately with a "+", so nothing
// is silently lost from the display). Omits the total entirely if there
// was no real contribution to sum (an empty contributions array still
// produces totalQuantity = 0, which isn't meaningful to show).
function formatAggregation(aggregation: AggregationResult): string {
	const parts: string[] = [];
	const hasRealTotal = aggregation.totalQuantity > 0;

	if (hasRealTotal) {
		const formatted = formatQuantity(aggregation.totalQuantity, aggregation.totalUnit);
		parts.push(aggregation.totalUnit ? `${formatted}${aggregation.totalUnit}` : formatted);
	}

	for (const c of aggregation.unmerged) {
		const formatted = formatQuantity(c.quantity, c.unit);
		parts.push(c.unit ? `${formatted}${c.unit}` : formatted);
	}

	return parts.join(' + ');
}
export function ShoppingListDisplay({ resolvedItems, onToggleChecked, onDelete, onSetSection }: ShoppingListDisplayProps) {
	const groups = groupBySection(resolvedItems);

	// Sort sections alphabetically, but force "Autres rayons" to always come last —
	// it's a fallback bucket, not a real shop section, so it shouldn't be
	// interleaved with the actual ones.
	const sortedSections = Array.from(groups.entries()).sort(([a], [b]) => {
		if (a === 'Autres rayons') return 1;
		if (b === 'Autres rayons') return -1;
		return a.localeCompare(b);
	});

	return (
		<div className="shopping-list">
			{sortedSections.map(([section, sectionItems]) => (
				<div key={section} className="shopping-list-section">
					<h4>{section}</h4>
					<ul>
						{sectionItems.map((resolved) => (
							<li key={resolved.item.id} className={resolved.item.checked ? 'shopping-list-item-checked' : ''}>
								<span className="shopping-list-item-text">
{resolved.item.name}
									{resolved.item.complement && ` (${resolved.item.complement})`}
									{formatAggregation(resolved.aggregation) && ` — ${formatAggregation(resolved.aggregation)}`}								</span>
								<span className="shopping-list-item-actions">
									{!resolved.isKnownIngredient && resolved.shopSection === 'Autres rayons' && (
										<button onClick={(e) => onSetSection(resolved.item.id, e)} title="Définir le rayon">📚</button>
									)}
									<button onClick={() => onToggleChecked(resolved.item.id)} title="Marquer comme acheté">✓</button>
									<button onClick={() => onDelete(resolved.item.id)} title="Supprimer">✕</button>
								</span>
							</li>
						))}
					</ul>
				</div>
			))}
		</div>
	);
}
