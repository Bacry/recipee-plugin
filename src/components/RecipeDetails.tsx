import { useEffect, useRef, useState } from 'react';
import { App, Component, MarkdownRenderer } from 'obsidian';
import { Recipe } from '../models/recipe';
import { MarkdownEditableBlock } from './MarkdownEditableBlock';
import { upperFirstLetter } from '../models/textNormalize';
import { computeRecipeNutrition } from '../models/computeRecipeNutrition';
import { NutritionTable } from './NutritionTable';

interface RecipeDetailsProps {
	app: App;
	recipe: Recipe;
	ingredientsFolder: string;
	recipesFolder: string;
	initialServings?: number; // used when opened as a base recipe, to reflect the quantity used by the parent recipe
	onIngredientClick: (ingredientName: string) => void;
	ingredientExists: (ingredientName: string) => boolean;
	// Passes the scaled quantity + unit at click time (not the stored base
	// value), so the opened base recipe view can reflect exactly how much of
	// it is actually being used here.
	onBaseRecipeClick: (recipeName: string, scaledQuantity: number, unit: string) => void;
	onSaveNotes: (newContent: string) => void;
	onEdit?: () => void; // undefined = read-only (opened from another recipe), no "Modifier" button
	onClose: () => void;
}

function formatDuration(minutes: number): string {
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	if (hours === 0) return `${rest}min`;
	return rest === 0 ? `${hours}h` : `${hours}h ${rest}min`;
}

function formatScaledQuantity(quantity: number, unit: string, factor: number): string {
	const scaled = quantity * factor;
	if (unit === '') return Math.ceil(scaled).toString();
	return Number(scaled.toFixed(2)).toString();
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
								  onEdit,
								  onClose,
							  }: RecipeDetailsProps) {
	const [servingsInput, setServingsInput] = useState((initialServings ?? recipe.baseServings).toString());

	// Re-syncs the displayed servings input when the recipe's baseServings
	// actually CHANGES from what it was (e.g. after editing via NewRecipeView)
	// — but not on first mount, so it doesn't clobber initialServings (used
	// when this view was opened as a base recipe, scaled to the quantity used).
	const prevBaseServingsRef = useRef(recipe.baseServings);
	useEffect(() => {
		if (recipe.baseServings !== prevBaseServingsRef.current) {
			setServingsInput(recipe.baseServings.toString());
			prevBaseServingsRef.current = recipe.baseServings;
		}
	}, [recipe.baseServings]);

	const servings = Number(servingsInput) || recipe.baseServings;
	const factor = servings / recipe.baseServings;

	const nutritionResult = computeRecipeNutrition(app, ingredientsFolder, recipesFolder, recipe);

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

	return (
		<div>
			<div className="ingredient-details-header">
				<h2>{upperFirstLetter(recipe.name)}</h2>
				<div className="ingredient-details-header-actions">
					{onEdit && <button onClick={onEdit}>Modifier</button>}
					<button onClick={onClose} title="Fermer">✕</button>
				</div>
			</div>

			{recipe.tags.length > 0 && (
				<div className="recipe-tags">
					{recipe.tags.map((tag) => (
						<span key={tag} className="recipe-tag">{tag}</span>
					))}
				</div>
			)}


			<MarkdownEditableBlock
				app={app}
				title="Notes"
				content={recipe.notes ?? ''}
				onSave={(newContent) => onSaveNotes(newContent)}
			/>

			<div className="recipe-top-row">
				<div className="recipe-top-row-column">
					{(recipe.preparationDurationMin != null || recipe.cookingDurationMin != null) && (
						<div>
							<h4>Temps</h4>
							<ul>
								{recipe.preparationDurationMin != null && (
									<li>Préparation : {formatDuration(recipe.preparationDurationMin)}</li>
								)}
								{recipe.cookingDurationMin != null && (
									<li>Cuisson : {formatDuration(recipe.cookingDurationMin)}</li>
								)}
								{totalDuration > 0 && <li>Total : {formatDuration(totalDuration)}</li>}
							</ul>
						</div>

					)}
				</div>
				{recipe.totalWeightG != null && <p>Poids total mesuré : {recipe.totalWeightG}g</p>}
				<div className="recipe-top-row-column">
					<div className="recipe-source-row">
						{recipe.source && (
							<p>
								Source :{' '}
								{isUrl(recipe.source) ? (
									<a href={recipe.source} target="_blank" rel="noopener noreferrer">web</a>
								) : (
									recipe.source
								)}
							</p>
						)}
						<button disabled title="Bientôt disponible">Shop</button>
					</div>
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
					onDoubleClick={() => setServingsInput(recipe.baseServings.toString())}
					className="recipe-servings-input"
				/>{' '}
				{recipe.servingsLabel})
			</h4>

			{(() => {
				// Unified list: base recipes first, then regular ingredients — a single
				// <ul> instead of two separate sections, with "(recette de base)"
				// appended to distinguish the two kinds of entries.
				type UnifiedEntry =
					| { kind: 'baseRecipe'; recipeName: string; quantity: number; unit: string }
					| { kind: 'ingredient'; ingredientName: string; quantity: number | null; unit: string; form?: string };

				const unifiedEntries: UnifiedEntry[] = [
					...recipe.baseRecipes.map((entry): UnifiedEntry => ({ kind: 'baseRecipe', ...entry })),
					...recipe.ingredients.map((entry): UnifiedEntry => ({ kind: 'ingredient', ...entry })),
				];

				return (
					<ul>
						{unifiedEntries.map((entry, index) => {
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
									{entry.quantity != null
										? formatScaledQuantity(entry.quantity, entry.unit, factor) + entry.unit + (entry.unit ? ' de ' : ' ')
										: ''}
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
							</li>
							);
						})}
		</ul>
	);
})()}
			<InstructionsPreview app={app} content={recipe.instructions} />

			<NutritionTable
				per100g={per100g}
				total={scaledTotal}
				totalWeightG={scaledTotalWeightG}
				perServing={nutritionResult.perServingNutrition}
				servingsLabel={recipe.servingsLabel}
				warnings={nutritionResult.warnings}
			/>

		</div>
	);
}
