import { ShoppingListItem, ShoppingListRecipeEntry } from '../models/ShoppingList';
import { AggregationResult } from '../models/aggregateContributions';

export interface ResolvedItem {
	item: ShoppingListItem;
	shopSection: string;
	aggregation: AggregationResult;
	isKnownIngredient: boolean;
}

interface ShoppingListDisplayProps {
	resolvedItems: ResolvedItem[];
	recipeEntries: ShoppingListRecipeEntry[];
	onToggleChecked: (itemId: string) => void;
	onDelete: (itemId: string) => void;
	onSetSection: (itemId: string, event: React.MouseEvent) => void;
	onRemoveRecipe: (recipeEntryId: string) => void;
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

function formatQuantity(value: number, unit: string): string {
	if (unit === '') {
		return Math.ceil(value).toString();
	}
	return Number(value.toFixed(2)).toString();
}

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

export function ShoppingListDisplay({
										resolvedItems,
										recipeEntries,
										onToggleChecked,
										onDelete,
										onSetSection,
										onRemoveRecipe,
									}: ShoppingListDisplayProps) {
	const groups = groupBySection(resolvedItems);

	const sortedSections = Array.from(groups.entries()).sort(([a], [b]) => {
		if (a === 'Autres rayons') return 1;
		if (b === 'Autres rayons') return -1;
		return a.localeCompare(b);
	});

	return (
		<div>
			{recipeEntries.length > 0 && (
				<div className="shopping-list-recipes-section">
					<h4>Recettes</h4>
					<ul>
						{recipeEntries.map((entry) => (
							<li key={entry.id}>
								<span>{entry.recipeName} — {entry.servings} personnes</span>
								<button onClick={() => onRemoveRecipe(entry.id)} title="Annuler">✕</button>
							</li>
						))}
					</ul>
				</div>
			)}

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
										{formatAggregation(resolved.aggregation) && ` — ${formatAggregation(resolved.aggregation)}`}
									</span>
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
		</div>
	);
}
