import { useRef, useState } from 'react';
import { App } from 'obsidian';
import { parseQuantityString, ParsedQuantity } from '../models/units';
import { searchIngredientNames } from '../models/searchIngredientNames';
import { RecipeIngredientEntry } from '../models/recipe';

interface SmartRecipeIngredientInputProps {
	app: App;
	ingredientsFolder: string;
	onAdd: (entry: RecipeIngredientEntry) => void;
}

// Same two-step pattern as SmartShoppingInput, but without the "complement"
// step — recipe ingredients only need a name and an optional quantity+unit,
// never a free-text detail like a brand.
type Step = 'name' | 'quantity';

export function SmartRecipeIngredientInput({ app, ingredientsFolder, onAdd }: SmartRecipeIngredientInputProps) {
	const [step, setStep] = useState<Step>('name');
	const [name, setName] = useState('');
	const [currentInput, setCurrentInput] = useState('');

	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
	const searchRequestId = useRef(0);

	function reset() {
		setStep('name');
		setName('');
		setCurrentInput('');
		setSuggestions([]);
		setHighlightedIndex(-1);
	}

	function handleNameInputChange(value: string) {
		setCurrentInput(value);
		if (value.trim().length >= 2) {
			setSuggestions(searchIngredientNames(app, ingredientsFolder, value));
			setHighlightedIndex(-1);
		} else {
			setSuggestions([]);
			setHighlightedIndex(-1);
		}
	}

	function commitName(chosenName: string) {
		const trimmed = chosenName.trim();
		if (trimmed === '') return;

		setName(trimmed);
		setCurrentInput('');
		setSuggestions([]);
		setHighlightedIndex(-1);
		setStep('quantity');
	}

	// Finalizes the entry, whether a quantity was typed or the field was
	// left empty (meaning "no specific amount", like vanille in the example recipe).
	function finalize(parsedQuantity: ParsedQuantity | null) {
		onAdd({
			ingredientName: name,
			quantity: parsedQuantity?.quantity ?? null,
			unit: parsedQuantity?.unit?.name ?? '',
		});
		reset();
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		// Backspace on an empty input steps back to the name step, restoring
		// its text so it can be edited again — same convenience as SmartShoppingInput.
		if (e.key === 'Backspace' && currentInput === '') {
			if (step === 'quantity') {
				setCurrentInput(name);
				setName('');
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

		// step === 'quantity'
		if (e.key !== 'Enter') return;

		if (currentInput.trim() === '') {
			finalize(null); // no quantity specified
			return;
		}

		const parsed = parseQuantityString(currentInput);
		if (parsed) {
			finalize(parsed);
		}
		// Non-empty but invalid: block on purpose, no state change.
	}

	const placeholder = step === 'name' ? "Nom de l'ingrédient" : 'Quantité (optionnel)';

	return (
		<div className="smart-shopping-input-wrapper">
			<div className="smart-shopping-input">
				{name && <span>{name}, </span>}
				<input
					value={currentInput}
					onChange={(e) =>
						step === 'name' ? handleNameInputChange(e.target.value) : setCurrentInput(e.target.value)
					}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
				/>
			</div>

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
