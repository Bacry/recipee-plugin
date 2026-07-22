import { useRef, useState } from 'react';
import { App } from 'obsidian';
import { parseQuantityString, findUnit, convertQuantity } from '../models/units';
import { searchBaseRecipes, getBaseRecipeServingsLabel } from '../models/searchBaseRecipes';
import { RecipeBaseRecipeEntry } from '../models/recipe';

interface SmartBaseRecipeInputProps {
	app: App;
	recipesFolder: string;
	onAdd: (entry: RecipeBaseRecipeEntry) => void;
}

type Step = 'name' | 'quantity';

// Same two-step pattern as SmartRecipeIngredientInput (name, then quantity),
// but: autocomplete is restricted to recipes tagged "base", quantity is
// mandatory (no empty-Return shortcut), and the typed unit is validated as
// convertible to the chosen base recipe's own servingsLabel unit before
// the entry is accepted.
export function SmartBaseRecipeInput({ app, recipesFolder, onAdd }: SmartBaseRecipeInputProps) {
	const [step, setStep] = useState<Step>('name');
	const [recipeName, setRecipeName] = useState('');
	const [currentInput, setCurrentInput] = useState('');
	const [error, setError] = useState<string | null>(null);

	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

	function reset() {
		setStep('name');
		setRecipeName('');
		setCurrentInput('');
		setError(null);
		setSuggestions([]);
		setHighlightedIndex(-1);
	}

	function handleNameInputChange(value: string) {
		setCurrentInput(value);
		setError(null);
		if (value.trim().length >= 2) {
			setSuggestions(searchBaseRecipes(app, recipesFolder, value));
			setHighlightedIndex(-1);
		} else {
			setSuggestions([]);
			setHighlightedIndex(-1);
		}
	}

	function commitName(chosenName: string) {
		const trimmed = chosenName.trim();
		if (trimmed === '') return;

		// Must match an actual recipe tagged "base" — free text isn't allowed
		// here, unlike ingredient names which can refer to a not-yet-created fiche.
		const servingsLabel = getBaseRecipeServingsLabel(app, recipesFolder, trimmed);
		if (servingsLabel === null) {
			setError(`"${trimmed}" n'est pas une recette de base connue (tag "base" requis).`);
			return;
		}

		setRecipeName(trimmed);
		setCurrentInput('');
		setSuggestions([]);
		setHighlightedIndex(-1);
		setError(null);
		setStep('quantity');
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === 'Backspace' && currentInput === '') {
			if (step === 'quantity') {
				setCurrentInput(recipeName);
				setRecipeName('');
				setError(null);
				setStep('name');
			}
			return;
		}

		if (step === 'name') {
			if (e.key === 'ArrowDown' && suggestions.length > 0) {
				e.preventDefault();
				setHighlightedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
				return;
			}
			if (e.key === 'ArrowUp' && suggestions.length > 0) {
				e.preventDefault();
				setHighlightedIndex((prev) => Math.max(prev - 1, -1));
				return;
			}
			if (e.key === 'Enter') {
				if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
					commitName(suggestions[highlightedIndex]);
				} else {
					commitName(currentInput);
				}
				return;
			}
			return;
		}

		// step === 'quantity' — always required, empty Return does nothing.
		if (e.key !== 'Enter') return;
		if (currentInput.trim() === '') return;

		const parsed = parseQuantityString(currentInput);
		if (!parsed) return; // invalid, block silently like other smart inputs

		const servingsLabel = getBaseRecipeServingsLabel(app, recipesFolder, recipeName);
		const targetUnit = servingsLabel ? findUnit(servingsLabel) : null;

		// Validates convertibility: convertQuantity returns null if the units
		// aren't compatible (e.g. typing "cl" for a recipe whose output is in "g").
		// No density involved here (recipes don't have one) — only same-family
		// mass<->mass or volume<->volume conversions succeed.
		const converted = convertQuantity(parsed.quantity, parsed.unit, targetUnit);
		if (converted === null) {
			setError(
				`Unité incompatible : cette recette de base se mesure en "${servingsLabel}", pas convertible avec "${currentInput}".`
			);
			return;
		}

		onAdd({ recipeName, quantity: parsed.quantity, unit: parsed.unit?.name ?? '' });
		reset();
	}

	const placeholder = step === 'name' ? 'Nom de la recette de base' : 'Quantité (obligatoire)';

	return (
		<div className="smart-shopping-input-wrapper">
			<div className="smart-shopping-input">
				{recipeName && <span>{recipeName}, </span>}
				<input
					value={currentInput}
					onChange={(e) =>
						step === 'name' ? handleNameInputChange(e.target.value) : setCurrentInput(e.target.value)
					}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
				/>
			</div>

			{error && <p className="ingredient-validation-error">{error}</p>}

			{step === 'name' && suggestions.length > 0 && (
				<ul className="smart-shopping-suggestions">
					{suggestions.map((suggestion, index) => (
						<li
							key={suggestion}
							className={index === highlightedIndex ? 'smart-shopping-suggestion-highlighted' : ''}
							onMouseEnter={() => setHighlightedIndex(index)}
							onClick={() => commitName(suggestion)}
						>
							{suggestion}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
