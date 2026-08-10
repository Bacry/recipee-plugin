import { useEffect, useRef, useState } from 'react';
import { App, Component, MarkdownRenderer } from 'obsidian';
import { Recipe } from '../models/recipe';
import { MarkdownEditableBlock } from './MarkdownEditableBlock';
import { computeRecipeNutrition } from '../models/computeRecipeNutrition';
import { NutritionTable } from './NutritionTable';
import { findIngredientFileByName } from '../models/findIngredientFile';
import { readIngredientForCalc } from '../models/computeRecipeNutrition';
import { findUnit, roundQuantityForUnit, convertQuantity, UNITS, Unit, formatRoundedQuantity } from '../models/units';


interface RecipeDetailsProps {
	app: App;
	recipe: Recipe;
	ingredientsFolder: string;
	recipesFolder: string;
	initialServings?: number;
	onIngredientClick: (ingredientName: string) => void;
	ingredientExists: (ingredientName: string) => boolean;
	onBaseRecipeClick: (recipeName: string, scaledQuantity: number, unit: string) => void;
	onSaveNotes: (newContent: string) => void;
	onShop: (servings: number) => void;
	onMarkCookedToday: () => void;
}

function formatDuration(minutes: number): string {
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	if (hours === 0) return `${rest}min`;
	return rest === 0 ? `${hours}h` : `${hours}h ${rest}min`;
}

function formatScaledQuantity(quantity: number, unit: string, factor: number): string {
	const scaled = quantity * factor;
	const unitObj = unit === '' ? null : findUnit(unit);
	const rounded = roundQuantityForUnit(scaled, unitObj);
	return Number(rounded.toFixed(4)).toString(); // toFixed(4) puis toString() évite les artefacts de virgule flottante (ex: 2.0000000004) sans réintroduire un arrondi fixe
}

function isUrl(text: string): boolean {
	return /^https?:\/\//.test(text.trim());
}

function resolveImagePath(app: App, filename: string): string | null {
	const file = app.vault.getFiles().find((f) => f.name === filename);
	if (!file) return null;
	return app.vault.getResourcePath(file);
}

function InstructionsPreview({ app, content }: { app: App; content: string }) {
	const previewRef = useRef<HTMLDivElement>(null);
	const componentRef = useRef(new Component());

	useEffect(() => {
		if (!previewRef.current) return;
		previewRef.current.empty();
		MarkdownRenderer.render(app, content, previewRef.current, '', componentRef.current);
	}, [content, app]);

	return <div ref={previewRef} />;
}

export function RecipeDetails({
								  app,
								  recipe,
								  ingredientsFolder,
								  recipesFolder,
								  initialServings,
								  onIngredientClick,
								  ingredientExists,
								  onBaseRecipeClick,
								  onSaveNotes,
								  onShop,
								  onMarkCookedToday,
							  }: RecipeDetailsProps) {
	const [servingsInput, setServingsInput] = useState((initialServings ?? recipe.baseServings).toString());
	const [absorptionPercent, setAbsorptionPercent] = useState(15);
	const ENTITY_SENTINEL = '__entity__';
	const [openUnitMenuIndex, setOpenUnitMenuIndex] = useState<number | null>(null);
	const [unitOverrides, setUnitOverrides] = useState<Record<number, string>>({});

	const prevBaseServingsRef = useRef(recipe.baseServings);
	useEffect(() => {
		if (recipe.baseServings !== prevBaseServingsRef.current) {
			setServingsInput(recipe.baseServings.toString());
			prevBaseServingsRef.current = recipe.baseServings;
		}
	}, [recipe.baseServings]);

	const servings = Number(servingsInput) || recipe.baseServings;
	const factor = servings / recipe.baseServings;

	const nutritionResult = computeRecipeNutrition(app, ingredientsFolder, recipesFolder, recipe, undefined, absorptionPercent);

	const scaledTotal = { ...nutritionResult.totalNutrition };
	for (const key of Object.keys(scaledTotal) as (keyof typeof scaledTotal)[]) {
		scaledTotal[key] *= factor;
	}
	const scaledTotalWeightG = nutritionResult.totalWeightG * factor;

	const per100g = { ...nutritionResult.totalNutrition };
	for (const key of Object.keys(per100g) as (keyof typeof per100g)[]) {
		per100g[key] = nutritionResult.totalWeightG > 0 ? nutritionResult.totalNutrition[key] / (nutritionResult.totalWeightG / 100) : 0;
	}

	const totalDuration = (recipe.preparationDurationMin ?? 0) + (recipe.cookingDurationMin ?? 0);

	function formatCookedDate(isoDate: string): string {
		const date = new Date(isoDate + 'T00:00:00');
		return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
	}

	function getIngredientData(ingredientName: string) {
		const file = findIngredientFileByName(app, ingredientsFolder, ingredientName);
		if (!file) return null;
		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		return readIngredientForCalc(frontmatter);
	}

	interface UnitOption {
		key: string;
		unit: Unit | null;
		quantity: number;
	}

// Every unit this ingredient's quantity could be converted to right now,
// given its known density/entity weight — excludes units flagged
// autoConvertTo (cup/tbsp/tsp are input conveniences, never a display
// target) and the ingredient's current unit itself.
	function getAvailableUnitOptions(entry: { ingredientName: string; quantity: number; unit: string }): UnitOption[] {
		const originalUnit = entry.unit === '' ? null : findUnit(entry.unit);
		const ingredientData = getIngredientData(entry.ingredientName);
		if (!ingredientData) return [];

		const candidates: (Unit | null)[] = originalUnit
			? UNITS.filter((u) => !u.autoConvertTo && !u.excludeFromPicker && u.isVolume !== originalUnit.isVolume)
			: UNITS.filter((u) => !u.autoConvertTo && !u.excludeFromPicker);
		if (ingredientData.entityWeightG != null) candidates.push(null);

		const options: UnitOption[] = [];
		for (const candidate of candidates) {
			if ((candidate?.name ?? null) === (originalUnit?.name ?? null)) continue;

			const converted = convertQuantity(entry.quantity, originalUnit, candidate, {
				densityGMl: ingredientData.densityGMl,
				entityWeightG: ingredientData.entityWeightG,
			});
			if (converted === null) continue;

			const rounded = roundQuantityForUnit(converted * factor, candidate);
			if (rounded < 1) continue;

			options.push({
				key: candidate?.name ?? ENTITY_SENTINEL,
				unit: candidate,
				quantity: rounded,
			});
		}

		return options;
	}

	function renderIngredientQuantity(entry: { ingredientName: string; quantity: number | null; unit: string }, index: number) {
		if (entry.quantity == null) return '';

		const originalUnit = entry.unit === '' ? null : findUnit(entry.unit);
		const override = unitOverrides[index];
		const ingredientData = getIngredientData(entry.ingredientName);

		let displayQuantity: number;
		let displayUnitName: string;

		if (override && ingredientData) {
			const targetUnit = override === ENTITY_SENTINEL ? null : findUnit(override);
			const converted = convertQuantity(entry.quantity, originalUnit, targetUnit, {
				densityGMl: ingredientData.densityGMl,
				entityWeightG: ingredientData.entityWeightG,
			});
			if (converted !== null) {
				displayQuantity = roundQuantityForUnit(converted * factor, targetUnit);
				displayUnitName = targetUnit?.name ?? '';
			} else {
				displayQuantity = Number(formatScaledQuantity(entry.quantity, entry.unit, factor));
				displayUnitName = entry.unit;
			}
		} else {
			displayQuantity = Number(formatScaledQuantity(entry.quantity, entry.unit, factor));
			displayUnitName = entry.unit;
		}

		const options = getAvailableUnitOptions(entry);
		const quantityText = `${formatRoundedQuantity(displayQuantity)}${displayUnitName}`;
		const suffix = displayUnitName ? ' de' : '';

		if (options.length === 0) {
			return quantityText + suffix;
		}

		return (
			<span className="recipe-unit-picker-wrapper">
		<span
			className="recipe-quantity-clickable"
			onClick={(e) => {
				e.preventDefault();
				setOpenUnitMenuIndex(openUnitMenuIndex === index ? null : index);
			}}
		>
			{quantityText}
		</span>
				{suffix}
				{openUnitMenuIndex === index && (
					<ul className="smart-shopping-suggestions recipe-unit-picker-menu">
						<li
							onClick={() => {
								setUnitOverrides((prev) => {
									const next = { ...prev };
									delete next[index];
									return next;
								});
								setOpenUnitMenuIndex(null);
							}}
						>
							{formatRoundedQuantity(Number(formatScaledQuantity(entry.quantity!, entry.unit, factor)))}{entry.unit} (original)
						</li>
						{options.map((opt) => (
							<li
								key={opt.key}
								onClick={() => {
									setUnitOverrides((prev) => ({ ...prev, [index]: opt.key }));
									setOpenUnitMenuIndex(null);
								}}
							>
								{formatRoundedQuantity(opt.quantity)}{opt.unit?.name ?? ' (pièce)'}
							</li>
						))}
					</ul>
				)}
	</span>
		);
	}

	return (
		<div>
			{recipe.tags.length > 0 && (
				<div className="recipe-tags-row">
					{recipe.tags.map((tag) => (
						<span key={tag} className="recipe-tag">{tag}</span>
					))}
				</div>
			)}

			<div className="recipe-top-row">
				<div className="recipe-top-row-column">
					<h4>Temps</h4>
					<ul>
						{recipe.preparationDurationMin != null && (
							<li>Préparation : {formatDuration(recipe.preparationDurationMin)}</li>
						)}
						{recipe.cookingDurationMin != null && (
							<li>Cuisson : {formatDuration(recipe.cookingDurationMin)}</li>
						)}
						{totalDuration > 0 && <li>Total : {formatDuration(totalDuration)}</li>}
						{recipe.preparationDurationMin == null && recipe.cookingDurationMin == null && (
							<li>Non renseigné</li>
						)}
					</ul>
				</div>

				<div className="recipe-top-row-column">
					<h4>
						Source{recipe.source ? (
						<>
							{' : '}
							{isUrl(recipe.source) ? (
								<a href={recipe.source} target="_blank" rel="noopener noreferrer">web</a>
							) : (
								recipe.source
							)}
						</>
					) : (
						' : Non renseignée'
					)}
					</h4>
					{recipe.image &&
						(() => {
							const imagePath = resolveImagePath(app, recipe.image);
							return imagePath ? (
								<img src={imagePath} alt={recipe.name} className="recipe-image" />
							) : (
								<p className="ingredient-validation-warnings">
									Image "{recipe.image}" introuvable dans le vault.
								</p>
							);
						})()}
				</div>
			</div>


			<div className="recipe-ingredients-header-row">
				<h4>
					Ingrédients (pour{' '}
					<input
						type="number"
						value={servingsInput}
						min={1}
						onChange={(e) => setServingsInput(e.target.value)}
						onBlur={() => {
							if (Number(servingsInput) <= 0 || servingsInput.trim() === '') {
								setServingsInput(recipe.baseServings.toString());
							}
						}}
						className="recipe-servings-input"
					/>{' '}
					{recipe.servingsLabel}{' '}
					<button
						type="button"
						onClick={() => setServingsInput(recipe.baseServings.toString())}
						title="Réinitialiser le nombre de portions"
						className="recipe-servings-reset"
					>
						↺
					</button>
					){' '}
					<button onClick={() => onShop(servings)} className="recipe-shop-inline-button">Shop</button>
				</h4>
			</div>

			{(() => {
				type UnifiedEntry =
					| { kind: 'baseRecipe'; recipeName: string; quantity: number; unit: string }
					| { kind: 'ingredient'; ingredientName: string; quantity: number | null; unit: string; form?: string; complement?: string; isFryingOil?: boolean; isSectionHeader?: boolean; sectionTitle?: string };
				const unifiedEntries: UnifiedEntry[] = [
					...recipe.baseRecipes.map((entry): UnifiedEntry => ({ kind: 'baseRecipe', ...entry })),
					...recipe.ingredients.map((entry): UnifiedEntry => ({ kind: 'ingredient', ...entry })),
					...(recipe.fryingOilName
						? [{ kind: 'ingredient' as const, ingredientName: recipe.fryingOilName, quantity: null, unit: '', isFryingOil: true }]
						: []),
				];

				return (
					<ul>
						{unifiedEntries.map((entry, index) => {
							if (entry.kind === 'ingredient' && entry.isSectionHeader) {
								return (
									<li key={index} className="recipe-section-header-item">
										{entry.sectionTitle}
									</li>
								);
							}
							if (entry.kind === 'baseRecipe') {
								const scaled = entry.quantity * factor;
								return (
									<li key={index}>
										{formatScaledQuantity(entry.quantity, entry.unit, factor)}{entry.unit} de{' '}
										<a
										href="#"
										onClick={(e) => {
										e.preventDefault();
										onBaseRecipeClick(entry.recipeName, scaled, entry.unit);
									}}
										>
										{entry.recipeName}
									</a>
								{' (recette de base)'}
							</li>
							);
							}

							const exists = ingredientExists(entry.ingredientName);
							const showAsLink = entry.quantity != null || exists;

							return (
								<li key={index}>
									{renderIngredientQuantity(entry, index)}{' '}
									{showAsLink ? (
									<a
											href="#"
										className={exists ? '' : 'recipe-ingredient-missing'}
										onClick={(e) => { e.preventDefault(); onIngredientClick(entry.ingredientName); }}
										>
									{entry.ingredientName}
										</a>
										) : (
										<span>{entry.ingredientName}</span>
							)}
						{entry.complement ? ' (' + entry.complement + ')' : ''}
						{entry.form ? ' (' + entry.form + ')' : ''}
									{entry.isFryingOil ? ' (pour la friture)' : ''}
							</li>
							);
						})}
		</ul>
	);
})()}

<InstructionsPreview app={app} content={recipe.instructions} />

<MarkdownEditableBlock
	app={app}
	title="Notes"
	content={recipe.notes ?? ''}
	onSave={(newContent) => onSaveNotes(newContent)}
/>

			<div className="recipe-history-header">
				<h4>Historique</h4>
				<button onClick={onMarkCookedToday} title="Marquer comme réalisée aujourd'hui">Réalisée aujourd'hui</button>
			</div>
			<p className="recipe-section-indent">
				{recipe.cookedDates.length === 0
					? (recipe.madeBeforeTracking
						? 'Déjà réalisée plusieurs fois par le passé (dates non enregistrées).'
						: 'Jamais réalisée pour l\'instant.')
					: `Réalisée au moins ${recipe.cookedDates.length} fois${recipe.madeBeforeTracking ? ' (+ plusieurs fois non datées avant)' : ''} — dernière fois le ${formatCookedDate([...recipe.cookedDates].sort().reverse()[0])}.`}
			</p>

<NutritionTable
	per100g={per100g}
	total={scaledTotal}
	totalWeightG={scaledTotalWeightG}
	perServing={nutritionResult.perServingNutrition}
	servingsLabel={recipe.servingsLabel}
	warnings={nutritionResult.warnings}
	measuredTotalWeightG={recipe.totalWeightG}
	per100gReliable={!recipe.requiresCooking || recipe.totalWeightG != null}
	fryingInfo={nutritionResult.fryingInfo}
	factor={factor}
	absorptionPercent={absorptionPercent}
	onAbsorptionPercentChange={setAbsorptionPercent}
/>
</div>
);
}
