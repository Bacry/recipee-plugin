import { useEffect, useRef, useState, useMemo } from 'react';
import { App, Component, MarkdownRenderer, setIcon } from 'obsidian';
import { Recipe } from '../models/recipe';
import { MarkdownEditableBlock } from './MarkdownEditableBlock';
import { computeRecipeNutrition } from '../models/computeRecipeNutrition';
import { RecipeNutritionTable } from './RecipeNutritionTable';
import { findIngredientFileByName } from '../models/findIngredientFile';
import { readIngredientForCalc } from '../models/computeRecipeNutrition';
import { findUnit, roundQuantityForUnit, convertQuantity, UNITS, Unit, formatRoundedQuantity } from '../models/units';
import { useT } from '../i18n/LanguageContext';
import { useContext } from 'react';
import { LanguageContext } from '../i18n/LanguageContext';
import { formatQuantityWithHint } from '../models/formatQuantityWithHint';
import { RATING_DEFAULT_KEY } from '../models/recipe';

interface RecipeDetailsProps {
	app: App;
	recipe: Recipe;
	ingredientsFolder: string;
	recipesFolder: string;
	initialServings?: number;
	selectedVariant: string | null;
	onVariantChange: (variant: string | null) => void;
	onRatingChange: (variantKey: string, rating: number) => void;
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

type UnifiedIngredientEntry = { kind: 'ingredient'; ingredientName: string; quantity: number | null; unit: string; form?: string; complement?: string; isFryingOil?: boolean; isSectionHeader?: boolean; sectionTitle?: string; variant?: string };

// Places the frying oil right after a randomly-picked fried ingredient (so it
// visually lands in the same section as what it's frying), instead of always
// tacking it onto the very end of the list. Falls back to appending at the
// end if nothing is marked fried yet.
function buildIngredientEntriesWithOil(recipe: Recipe): UnifiedIngredientEntry[] {
	const base: UnifiedIngredientEntry[] = recipe.ingredients.map((entry) => ({ kind: 'ingredient', ...entry }));

	if (!recipe.fryingOilName) return base;

	const friedIndices = base
		.map((e, i) => (!e.isSectionHeader && e.fried ? i : -1))
		.filter((i) => i !== -1);

	const oilEntry: UnifiedIngredientEntry = {
		kind: 'ingredient',
		ingredientName: recipe.fryingOilName,
		quantity: null,
		unit: '',
		isFryingOil: true,
	};

	if (friedIndices.length === 0) {
		return [...base, oilEntry];
	}

	const insertAfter = friedIndices[Math.floor(Math.random() * friedIndices.length)];
	const result = [...base];
	result.splice(insertAfter + 1, 0, oilEntry);
	return result;
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
								  selectedVariant,
								  onVariantChange,
								  onRatingChange,
								  onIngredientClick,
								  ingredientExists,
								  onBaseRecipeClick,
								  onSaveNotes,
								  onShop,
								  onMarkCookedToday,
							  }: RecipeDetailsProps) {
	const t = useT();
	const [servingsInput, setServingsInput] = useState((initialServings ?? recipe.baseServings).toString());
	const [absorptionPercent, setAbsorptionPercent] = useState(15);
	const ENTITY_SENTINEL = '__entity__';
	const [openUnitMenuIndex, setOpenUnitMenuIndex] = useState<number | null>(null);
	const [unitOverrides, setUnitOverrides] = useState<Record<number, string>>({});
	const ingredientEntriesWithOil = useMemo(() => buildIngredientEntriesWithOil(recipe), [recipe]);

	const prevBaseServingsRef = useRef(recipe.baseServings);
	useEffect(() => {
		if (recipe.baseServings !== prevBaseServingsRef.current) {
			setServingsInput(recipe.baseServings.toString());
			prevBaseServingsRef.current = recipe.baseServings;
		}
	}, [recipe.baseServings]);

	const servings = Number(servingsInput) || recipe.baseServings;
	const factor = servings / recipe.baseServings;

	const language = useContext(LanguageContext);
	const nutritionResult = computeRecipeNutrition(app, ingredientsFolder, recipesFolder, recipe, undefined, absorptionPercent, language, selectedVariant);

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

	const shopButtonRef = useRef<HTMLButtonElement>(null);
	useEffect(() => {
		if (shopButtonRef.current) {
			setIcon(shopButtonRef.current, 'shopping-cart');
		}
	}, []);


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


	function getIngredientHint(entry: { ingredientName: string; quantity: number | null; unit: string }): string {
		if (entry.quantity == null) return '';
		const ingredientData = getIngredientData(entry.ingredientName);
		if (!ingredientData) return '';

		const originalUnit = entry.unit === '' ? null : findUnit(entry.unit);
		const displayQuantity = Number(formatScaledQuantity(entry.quantity, entry.unit, factor));

		return formatQuantityWithHint(displayQuantity, entry.unit, {
			densityGMl: ingredientData.densityGMl,
			entityWeightG: ingredientData.entityWeightG,
			juiceYieldMl: ingredientData.juiceYieldMl,
		}, t).hint;
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
		const hint = ingredientData
			? formatQuantityWithHint(displayQuantity, displayUnitName, {
				densityGMl: ingredientData.densityGMl,
				entityWeightG: ingredientData.entityWeightG,
				juiceYieldMl: ingredientData.juiceYieldMl,
			}, t).hint
			: '';
		const suffix = displayUnitName ? ' de' : '';

		if (options.length === 0) {
			return quantityText + suffix;
		}

		return (
			<span key="quantity" className="recipe-unit-picker-wrapper">
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
							{formatRoundedQuantity(Number(formatScaledQuantity(entry.quantity!, entry.unit, factor)))}{entry.unit} {t('recipeDetails.unitOption.original')}
						</li>
						{options.map((opt) => (
							<li
								key={opt.key}
								onClick={() => {
									setUnitOverrides((prev) => ({ ...prev, [index]: opt.key }));
									setOpenUnitMenuIndex(null);
								}}
							>
								{formatRoundedQuantity(opt.quantity)}{opt.unit?.name ?? ` ${t('recipeDetails.unitOption.piece')}`}
							</li>
						))}
					</ul>
				)}
	</span>
		);
	}

	const ratingKey = selectedVariant ?? RATING_DEFAULT_KEY;
	const currentRating = recipe.ratings[ratingKey] ?? 0;

	return (
		<div>
			{recipe.tags.length > 0 && (
				<div className="recipe-tags-row">
					{recipe.tags.map((tag) => (
						<span key={tag} className="recipe-tag">{tag}</span>
					))}
				</div>
			)}

			<div className="recipe-rating-row">
				{[1, 2, 3, 4, 5].map((star) => (
					<span
						key={star}
						className="recipe-rating-star"
						onClick={() => onRatingChange(ratingKey, star)}
						title={t('recipeDetails.rating.set')}
					>
					{star <= currentRating ? '★' : '☆'}
				</span>
				))}
			</div>

			<div className="recipe-time-source-row section">
				<div className="recipe-time-source-column">
					<div className="section-title">{t('recipeDetails.time')}</div>
					<div className="section-content">
						{recipe.preparationDurationMin != null && (
							<div className="section-content-item"> {t('recipeDetails.time.preparation').replace('{duration}', formatDuration(recipe.preparationDurationMin))} </div>
						)}
						{recipe.cookingDurationMin != null && (
							<div className="section-content-item"> {t('recipeDetails.time.cooking').replace('{duration}', formatDuration(recipe.cookingDurationMin))} </div>
						)}
						{totalDuration > 0 && <div className="section-content-item"> {t('recipeDetails.time.total').replace('{duration}', formatDuration(totalDuration))} </div>}
						{recipe.preparationDurationMin == null && recipe.cookingDurationMin == null && (
							<div>{t('recipeDetails.time.notSet')}</div>
						)}
					</div>
				</div>

				<div className="recipe-time-source-column">
					<div className="section-title">
						{t('recipeDetails.source')}{recipe.source ? (
						<>
							{' : '}
							{isUrl(recipe.source) ? (
								<a href={recipe.source} target="_blank" rel="noopener noreferrer">{t('recipeDetails.source.web')}</a>
							) : (
								recipe.source
							)}
						</>
					) : (
						` : ${t('recipeDetails.source.notSet')}`
					)}
					</div>
					{recipe.image &&
						(() => {
							const imagePath = resolveImagePath(app, recipe.image);
							return imagePath ? (
								<img src={imagePath} alt={recipe.name} className="recipe-image" />
							) : (
								<p className="warning-text">
									{t('recipeDetails.image.notFound').replace('{name}', recipe.image)}
								</p>
							);
						})()}
				</div>
			</div>


			{recipe.variants.length > 0 && (
				<div className="section">
					<div className="section-title">{t('recipeDetails.variants')}</div>
					<div className="section-content recipe-variants-buttons">
						{recipe.variants.map((v) => (
							<button
								key={v}
								type="button"
								onClick={() => onVariantChange(v)}
								className={v === selectedVariant ? 'recipe-list-pinned-tag recipe-list-pinned-tag-active' : 'recipe-list-pinned-tag'}
							>
								{v}
							</button>
						))}
					</div>
				</div>
			)}


			<div className="section">
				<div className="section-title">
					{t('recipeDetails.ingredients')}{' '}
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
					<button
						type="button"
						onClick={() => setServingsInput(recipe.baseServings.toString())}
						title={t('recipeDetails.resetServings')}
						className="standard-button"
					>
						↺
					</button>
					{' '}
					{recipe.servingsLabel}{' '}
					){' '}
					<button ref={shopButtonRef} onClick={() => onShop(servings)} className="standard-button" title={t('recipeDetails.shop.title')}></button>
				</div>
			</div>

			{(() => {
				type UnifiedEntry =
					| { kind: 'baseRecipe'; recipeName: string; quantity: number; unit: string; order?: number; variant?: string }
					| { kind: 'ingredient'; ingredientName: string; quantity: number | null; unit: string; form?: string; complement?: string; isFryingOil?: boolean; isSectionHeader?: boolean; sectionTitle?: string; order?: number; variant?: string };
				const unifiedEntries: UnifiedEntry[] = [
					...recipe.baseRecipes.map((entry): UnifiedEntry => ({ kind: 'baseRecipe', ...entry })),
					...ingredientEntriesWithOil,
				].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
				let inSection = false;
				let sectionSubtitleGap = false;

				const visibleEntries = unifiedEntries.filter((entry) => {
					if (entry.kind === 'ingredient' && entry.isSectionHeader) return true; // section headers always shown
					return !entry.variant || entry.variant === selectedVariant;
				});

				return (
					<div className="section-content">
						{visibleEntries.map((entry, index) => {
							if (entry.kind === 'ingredient' && entry.isSectionHeader) {
								if ((entry.sectionTitle ?? '').trim() === '') {
									inSection = false
									sectionSubtitleGap = true
									return null;
								}
								inSection = true
								return (
									<div key={index} className="section-content-subtitle section-subtitle-gap">
										{entry.sectionTitle}
									</div>
								);
							}
							if (entry.kind === 'baseRecipe') {
								const scaled = entry.quantity * factor;
								const gapClass = sectionSubtitleGap ? 'section-subtitle-gap' : '';
								sectionSubtitleGap = false;
								return (
									<div
										key={index}
										className={`${inSection ? 'section-content-subitem' : 'section-content-item'} ${gapClass}`}
									>
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
										{` ${t('recipeDetails.baseRecipeSuffix')}`}
									</div>
								);
							}

							const exists = ingredientExists(entry.ingredientName);
							const showAsLink = entry.quantity != null || exists;
							const gapClass = sectionSubtitleGap ? 'section-subtitle-gap' : '';
							sectionSubtitleGap = false;

							return (
								<div
									key={index}
									className={`${inSection ? 'section-content-subitem' : 'section-content-item'} ${gapClass}`}
								>
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
						{getIngredientHint(entry) && ` ${getIngredientHint(entry)}`}
									{entry.complement ? ' (' + entry.complement + ')' : ''}
									{entry.form ? ' (' + entry.form + ')' : ''}
									{entry.isFryingOil ? ` ${t('recipeDetails.fryingOilSuffix')}` : ''}
								</div>
							);
						})}
					</div>
				);
			})()}

			<div className="section">
				<InstructionsPreview app={app} content={recipe.instructions} />
			</div>
			<div className="section">
				<div className="section">
					<MarkdownEditableBlock
						app={app}
						title={t('recipeDetails.notes')}
						titleClass="section-title"
						content={recipe.notes ?? ''}
						contentClass="section-content"
						placeholder={t('recipeDetails.notes.placeholder')}
						onSave={(newContent) => onSaveNotes(newContent)}
					/>
				</div>
			</div>
			<div className="section">
				<div className="section-title">{t('recipeDetails.history')} {' '}
					<button onClick={onMarkCookedToday} className="standard-button" title={t('recipeDetails.markCookedToday')}>{t('recipeDetails.markCookedToday.button')}</button>
				</div>
				<div className="section-content">
					{recipe.cookedDates.length === 0
						? (recipe.madeBeforeTracking
							? t('recipeDetails.history.madeBeforeTracking')
							: t('recipeDetails.history.neverMade'))
						: t('recipeDetails.history.madeAtLeast')
							.replace('{count}', recipe.cookedDates.length.toString())
							.replace('{suffix}', recipe.madeBeforeTracking ? t('recipeDetails.history.plusUndated') : '')
							.replace('{date}', formatCookedDate([...recipe.cookedDates].sort().reverse()[0]))}
				</div>
			</div>

			<div className="section">
				<RecipeNutritionTable
					titleClass="section-title"
					contentClass="section-content"
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
		</div>
	);
}
