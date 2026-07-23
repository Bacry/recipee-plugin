import { useState } from 'react';
import { ShoppingListItem, ShoppingListRecipeEntry } from '../models/ShoppingList';
import { AggregationResult } from '../models/aggregateContributions';
import { parseQuantityString } from '../models/units';

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
	onSetAlreadyOwned: (itemId: string, owned: { quantity: number; unit: string } | null) => void;
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

// A resolved item's remaining quantity is "zero" (fully covered by what the
// user already owns) when there's no real total and no unmerged leftovers —
// used to decide whether to render the line as struck-through.
function isFullyCovered(resolved: ResolvedItem): boolean {
	return resolved.aggregation.totalQuantity === 0 && resolved.aggregation.unmerged.length === 0 && !!resolved.item.alreadyOwned;
}

export function ShoppingListDisplay({
										resolvedItems,
										recipeEntries,
										onToggleChecked,
										onDelete,
										onSetSection,
										onRemoveRecipe,
										onSetAlreadyOwned,
									}: ShoppingListDisplayProps) {
	// Tracks which single item's name is currently showing the inline
	// "j'en ai déjà" input, and its current draft text.
	const [editingItemId, setEditingItemId] = useState<string | null>(null);
	const [draftInput, setDraftInput] = useState('');

	function startEditing(resolved: ResolvedItem) {
		setEditingItemId(resolved.item.id);
		const owned = resolved.item.alreadyOwned;
		setDraftInput(owned ? `${owned.quantity}${owned.unit}` : '');
	}

	function commitEditing(itemId: string) {
		const trimmed = draftInput.trim();
		if (trimmed === '') {
			onSetAlreadyOwned(itemId, null);
		} else {
			const parsed = parseQuantityString(trimmed);
			if (parsed) {
				onSetAlreadyOwned(itemId, { quantity: parsed.quantity, unit: parsed.unit?.name ?? '' });
			}
			// Invalid input: silently ignore, keep the previous value (no state change).
		}
		setEditingItemId(null);
		setDraftInput('');
	}

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
							{sectionItems.map((resolved) => {
								const covered = isFullyCovered(resolved);
								const isEditing = editingItemId === resolved.item.id;

								return (
									<li key={resolved.item.id} className={(resolved.item.checked || covered) ? 'shopping-list-item-checked' : ''}>
										<span className="shopping-list-item-text">
											{isEditing ? (
												<input
													autoFocus
													value={draftInput}
													onChange={(e) => setDraftInput(e.target.value)}
													onBlur={() => commitEditing(resolved.item.id)}
													onKeyDown={(e) => {
														if (e.key === 'Enter') commitEditing(resolved.item.id);
														if (e.key === 'Escape') { setEditingItemId(null); setDraftInput(''); }
													}}
													placeholder="J'en ai déjà..."
													className="shopping-list-owned-input"
												/>
											) : (
												<span
													onClick={() => startEditing(resolved)}
													className="shopping-list-item-name-clickable"
													title="Cliquer pour indiquer ce que vous avez déjà"
												>
													{resolved.item.name}
												</span>
											)}
											{resolved.item.complement && ` (${resolved.item.complement})`}
											{formatAggregation(resolved.aggregation) && ` — ${formatAggregation(resolved.aggregation)}`}
											{resolved.aggregation.ownedSubtractionFailed && (
												<span className="ingredient-validation-error"> (unité incompatible)</span>
											)}
										</span>
										<span className="shopping-list-item-actions">
											{!resolved.isKnownIngredient && resolved.shopSection === 'Autres rayons' && (
												<button onClick={(e) => onSetSection(resolved.item.id, e)} title="Définir le rayon">📚</button>
											)}
											<button onClick={() => onToggleChecked(resolved.item.id)} title="Marquer comme acheté">✓</button>
											<button onClick={() => onDelete(resolved.item.id)} title="Supprimer">✕</button>
										</span>
									</li>
								);
							})}
						</ul>
					</div>
				))}
			</div>
		</div>
	);
}
