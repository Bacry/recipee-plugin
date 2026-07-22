import { useState } from 'react';
import { App } from 'obsidian';
import { parseQuantityString, ParsedQuantity } from '../models/units';
import { searchIngredientNames } from '../models/searchIngredientNames';
import { RecipeIngredientEntry } from '../models/recipe';

interface SmartRecipeIngredientInputProps {
	app: App;
	ingredientsFolder: string;
	onAdd: (entry: RecipeIngredientEntry) => void;
}

// Same pattern as SmartShoppingInput: after the name, the next typed value
// is tried FIRST as a quantity — if it parses, the entry is finalized right
// there (no complement). Only if it doesn't parse as a quantity is it kept
// as a free-text complement, moving to a final quantity step. This avoids
// forcing a complement step when the user just wants to type a quantity.
type Step = 'name' | 'complement-or-quantity' | 'quantity';

export function SmartRecipeIngredientInput({ app, ingredientsFolder, onAdd }: SmartRecipeIngredientInputProps) {
	const [step, setStep] = useState<Step>('name');
	const [name, setName] = useState('');
	const [complement, setComplement] = useState('');
	const [currentInput, setCurrentInput] = useState('');

	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

	function reset() {
		setStep('name');
		setName('');
		setComplement('');
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
		setStep('complement-or-quantity');
	}

	function finalize(complementValue: string, parsedQuantity: ParsedQuantity | null) {
		onAdd({
			ingredientName: name,
			complement: complementValue.trim() || undefined,
			quantity: parsedQuantity?.quantity ?? null,
			unit: parsedQuantity?.unit?.name ?? '',
		});
		reset();
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		// Backspace on an empty input steps back one stage, restoring its
		// text so it can be edited again — same convenience as SmartShoppingInput.
		if (e.key === 'Backspace' && currentInput === '') {
			if (step === 'quantity') {
				setCurrentInput(complement);
				setComplement('');
				setStep('complement-or-quantity');
				return;
			}
			if (step === 'complement-or-quantity') {
				setCurrentInput(name);
				setName('');
				setSuggestions([]);
				setHighlightedIndex(-1);
				setStep('name');
				return;
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

		if (e.key !== 'Enter') return;

		if (step === 'complement-or-quantity') {
			// Empty Return here means "no complement, no quantity" — finalize now.
			if (currentInput.trim() === '') {
				finalize('', null);
				return;
			}

			// Try reading the typed text as a quantity+unit BEFORE treating it
			// as a complement — this is the fix: quantity is tried first.
			const parsed = parseQuantityString(currentInput);
			if (parsed) {
				finalize('', parsed);
				return;
			}

			// Not a valid quantity: treat as a free-text complement, move on.
			setComplement(currentInput.trim());
			setCurrentInput('');
			setStep('quantity');
			return;
		}

		// step === 'quantity'
		if (currentInput.trim() === '') {
			finalize(complement, null);
			return;
		}

		const parsed = parseQuantityString(currentInput);
		if (parsed) {
			finalize(complement, parsed);
		}
		// Non-empty but invalid: block on purpose, no state change.
	}

	const placeholder =
		step === 'name'
			? "Nom de l'ingrédient"
			: step === 'complement-or-quantity'
				? 'Complément ou quantité (optionnel)'
				: 'Quantité (optionnel)';

	return (
		<div className="smart-shopping-input-wrapper">
			<div className="smart-shopping-input">
				{name && <span>{name}, </span>}
				{complement && <span>{complement}, </span>}
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
