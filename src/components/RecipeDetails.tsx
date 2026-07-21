import { useState } from 'react';
import { Recipe } from '../models/Recipe';

interface RecipeDetailsProps {
	recipe: Recipe;
}

function formatDuration(minutes: number): string {
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	if (hours === 0) return `${rest}min`;
	return rest === 0 ? `${hours}h` : `${hours}h ${rest}min`;
}

// Scales a quantity by the servings ratio, then rounds: whole numbers for
// entities (no unit), 2 decimals otherwise — same convention as the
// shopping list display.
function formatScaledQuantity(quantity: number, unit: string, factor: number): string {
	const scaled = quantity * factor;
	if (unit === '') return Math.ceil(scaled).toString();
	return Number(scaled.toFixed(2)).toString();
}
export function RecipeDetails({ recipe }: RecipeDetailsProps) {
	// Stored as a string so the field can be temporarily empty while typing,
	// without React forcing a fallback value on every keystroke.
	const [servingsInput, setServingsInput] = useState(recipe.baseServings.toString());
	const servings = Number(servingsInput) || recipe.baseServings;
	const factor = servings / recipe.baseServings;

	// ... totalDuration inchangé

	return (
		<div>
			{/* ... */}

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
				{recipe.ingredients.map((entry, index) => (
					<li key={index}>
						{entry.quantity != null
							? `${formatScaledQuantity(entry.quantity, entry.unit, factor)}${entry.unit} de `
							: ''}
						{entry.ingredientName}
						{entry.form && ` (${entry.form})`}
					</li>
				))}
			</ul>

			{recipe.instructions.map((section, index) => (
				<div key={index}>
					<h4>{section.title}</h4>
					<ul>
						{section.steps.map((step, stepIndex) => (
							<li key={stepIndex}>{step}</li>
						))}
					</ul>
				</div>
			))}
		</div>
	);
}
