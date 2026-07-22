import { useState } from 'react';
import { App } from 'obsidian';
import { Recipe } from '../models/Recipe';
import { MarkdownEditableBlock } from './MarkdownEditableBlock';

interface RecipeDetailsProps {
	app: App;
	recipe: Recipe;
	onIngredientClick: (ingredientName: string) => void;
	ingredientExists: (ingredientName: string) => boolean;
	onSaveInstructionSection: (sectionIndex: number, newContent: string) => void;
	onSaveNotes: (newContent: string) => void;
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

// Simple heuristic: treat the source as a URL if it starts with http(s)://
// Anything else (a book title, "fait maison", etc.) displays as plain text.
function isUrl(text: string): boolean {
	return /^https?:\/\//.test(text.trim());
}

// Resolves an attachment filename to a displayable image URL. Searches the
// whole vault by basename (not just a specific folder), since attachments
// can live anywhere depending on the user's Obsidian settings.
function resolveImagePath(app: App, filename: string): string | null {
	const file = app.vault.getFiles().find((f) => f.name === filename);
	if (!file) return null;
	return app.vault.getResourcePath(file);
}

export function RecipeDetails({
								  app,
								  recipe,
								  onIngredientClick,
								  ingredientExists,
								  onSaveInstructionSection,
								  onSaveNotes,
							  }: RecipeDetailsProps) {
	const [servingsInput, setServingsInput] = useState(recipe.baseServings.toString());
	const servings = Number(servingsInput) || recipe.baseServings;
	const factor = servings / recipe.baseServings;

	const totalDuration = (recipe.preparationDurationMin ?? 0) + (recipe.cookingDurationMin ?? 0);
	return (
		<div>
			<h2>{recipe.name}</h2>

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

				<div className="recipe-top-row-column">
					<div className="recipe-source-row">
						{recipe.source && (
							<p>
								Source :{' '}
								{isUrl(recipe.source) ? (
									<a href={recipe.source} target="_blank" rel="noopener noreferrer">
										web
									</a>
								) : (
									recipe.source
								)}
							</p>
						)}
						{/* Placeholder for now — adding this recipe's ingredients to the shopping list is deferred. */}
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

			<ul>
				{recipe.ingredients.map((entry, index) => {
					const showAsLink = entry.quantity != null || ingredientExists(entry.ingredientName);

					return (
						<li key={index}>
							{entry.quantity != null
								? formatScaledQuantity(entry.quantity, entry.unit, factor) + entry.unit + (entry.unit ? ' de ' : ' ')
								: ''}
							{showAsLink ? (
								<a href="#" onClick={(e) => { e.preventDefault(); onIngredientClick(entry.ingredientName); }}>
									{entry.ingredientName}
								</a>
							) : (
								<span>{entry.ingredientName}</span>
							)}
							{entry.form ? ' (' + entry.form + ')' : ''}
						</li>
					);
				})}
			</ul>

			{recipe.instructions.map((section, index) => (
				<MarkdownEditableBlock
					key={index}
					app={app}
					title={section.title}
					content={section.content}
					onSave={(newContent) => onSaveInstructionSection(index, newContent)}
				/>
			))}
		</div>
	);
}
