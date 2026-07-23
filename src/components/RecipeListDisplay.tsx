import { App } from 'obsidian';
import { RecipeSummary } from '../models/listAllRecipes';
import { upperFirstLetter } from '../models/textNormalize';

interface RecipeListDisplayProps {
	app: App;
	recipes: RecipeSummary[];
	onRecipeClick: (filePath: string) => void;
}

// Resolves an image filename to a displayable URL, same approach as
// RecipeDetails — searches the whole vault by basename, not a specific folder.
function resolveImagePath(app: App, filename: string): string | null {
	const file = app.vault.getFiles().find((f) => f.name === filename);
	if (!file) return null;
	return app.vault.getResourcePath(file);
}
export function RecipeListDisplay({ app, recipes, onRecipeClick }: RecipeListDisplayProps) {
	return (
		<table className="recipe-list-table">
			<tbody>
			{recipes.map((recipe) => {
				const imagePath = recipe.image ? resolveImagePath(app, recipe.image) : null;

				return (
					<tr key={recipe.filePath} className="recipe-list-row" onClick={() => onRecipeClick(recipe.filePath)}>
						<td className="recipe-list-name-cell">{upperFirstLetter(recipe.name)}</td>
						<td className="recipe-list-thumbnail-cell">
							{imagePath ? (
								<img src={imagePath} alt={recipe.name} className="recipe-list-thumbnail" />
							) : (
								<div className="recipe-list-thumbnail-placeholder" />
							)}
						</td>
						<td className="recipe-list-tags-cell">
							{recipe.tags.length > 0 && (
								<div className="recipe-tags">
									{recipe.tags.map((tag) => (
										<span key={tag} className="recipe-tag">{tag}</span>
									))}
								</div>
							)}
						</td>
					</tr>
				);
			})}
			</tbody>
		</table>
	);
}
