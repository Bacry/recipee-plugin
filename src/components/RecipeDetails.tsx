import { useEffect, useRef, useState } from 'react';
import { App, Component, MarkdownRenderer } from 'obsidian';
import { Recipe } from '../models/recipe';
import { MarkdownEditableBlock } from './MarkdownEditableBlock';
import { computeRecipeNutrition } from '../models/computeRecipeNutrition';
import { NutritionTable } from './NutritionTable';

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
								  onShop,
								  onMarkCookedToday,
							  }: RecipeDetailsProps) {
	const [servingsInput, setServingsInput] = useState((initialServings ?? recipe.baseServings).toString());

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

	function formatCookedDate(isoDate: string): string {
		const date = new Date(isoDate + 'T00:00:00');
		return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
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

				<div className="recipe-top-row-column">
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
					| { kind: 'ingredient'; ingredientName: string; quantity: number | null; unit: string; form?: string; complement?: string };

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
			<p>
				{recipe.cookedDates.length === 0
					? 'Jamais réalisée pour l\'instant.'
					: `Réalisée ${recipe.cookedDates.length} fois — dernière fois le ${formatCookedDate([...recipe.cookedDates].sort().reverse()[0])}.`}
			</p>

<NutritionTable
	per100g={per100g}
	total={scaledTotal}
	totalWeightG={scaledTotalWeightG}
	perServing={nutritionResult.perServingNutrition}
	servingsLabel={recipe.servingsLabel}
	warnings={nutritionResult.warnings}
	measuredTotalWeightG={recipe.totalWeightG}
/>
</div>
);
}
