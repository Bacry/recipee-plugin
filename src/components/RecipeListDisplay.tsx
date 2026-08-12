import { App } from 'obsidian';
import { RecipeSummary } from '../models/listAllRecipes';
import { upperFirstLetter } from '../models/textNormalize';

interface RecipeListDisplayProps {
	app: App;
	recipes: RecipeSummary[];
	onRecipeClick: (filePath: string) => void;
}

function resolveImagePath(app: App, filename: string): string | null {
	const file = app.vault.getFiles().find((f) => f.name === filename);
	if (!file) return null;
	return app.vault.getResourcePath(file);
}

function formatDuration(minutes: number): string {
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	if (hours === 0) return `${rest}m`;
	return rest === 0 ? `${hours}h` : `${hours}h ${rest}`;
}

function formatTotalDuration(recipe: RecipeSummary): string {
	const total = (recipe.preparationDurationMin ?? 0) + (recipe.cookingDurationMin ?? 0);
	return total > 0 ? formatDuration(total) : '—';
}

function formatCreatedDate(createdTime: number): string {
	const date = new Date(createdTime);
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = String(date.getFullYear()).slice(-2);
	return `${month}/${year}`;
}

export function RecipeListDisplay({ app, recipes, onRecipeClick }: RecipeListDisplayProps) {
	return (
		<div className="recipe-list-scroll-padding">
			{recipes.map((recipe) => {
				const imagePath = recipe.image ? resolveImagePath(app, recipe.image) : null;

				return (
					<div key={recipe.filePath} className="recipe-list-row" onClick={() => onRecipeClick(recipe.filePath)}>
						<div className="recipe-list-cell-name">{upperFirstLetter(recipe.name)}</div>
						<div className="recipe-list-cell-duration">{formatTotalDuration(recipe)}</div>
						<div className="recipe-list-cell-created">{formatCreatedDate(recipe.createdTime)}</div>
						<div className="recipe-list-cell-cooked">
							{recipe.madeBeforeTracking
								? `${recipe.cookedCount > 0 ? recipe.cookedCount : ''}+`
								: (recipe.cookedCount > 0 ? recipe.cookedCount : '')}
						</div>
					</div>
				);
			})}
		</div>
	);
}
