import { useRef, useState } from 'react';
import { App } from 'obsidian';
import { parseQuantityString, ParsedQuantity } from '../models/units';
import { searchIngredientNames } from '../models/searchIngredientNames';
import { searchAllItemNames } from '../models/searchAllItemNames';
import { addOtherItemNameIfMissing } from '../models/otherItemsNote';
import { lowerFirstLetter } from '../models/textNormalize';

export interface SmartInputResult {
	name: string;
	complement: string;
	parsedQuantity: ParsedQuantity | null;
}


interface SmartShoppingInputProps {
	app: App;
	ingredientsFolder: string;
	otherItemsNotePath: string; // needed to search "Autres" note names too
	onAdd: (result: SmartInputResult) => void;
}

type Step = 'name' | 'complement-or-quantity' | 'quantity';

export function SmartShoppingInput({ app, ingredientsFolder, otherItemsNotePath, onAdd }: SmartShoppingInputProps) {
	const [step, setStep] = useState<Step>('name');
	const [name, setName] = useState('');
	const [complement, setComplement] = useState('');
	const [currentInput, setCurrentInput] = useState('');

	// Autocomplete state — only relevant during the 'name' step.
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [highlightedIndex, setHighlightedIndex] = useState<number>(-1); // -1 = nothing highlighted yet

	function reset() {
		setStep('name');
		setName('');
		setComplement('');
		setCurrentInput('');
		setSuggestions([]);
		setHighlightedIndex(-1);
	}

	// Now async since it reads the "Autres" note from disk. We track a request id
	// (same pattern as the USDA search) to discard stale responses if the user
	// keeps typing before a previous lookup finishes.
	const searchRequestId = useRef(0);

	// Called on every keystroke while typing the name — refreshes the suggestion list.
	async function handleNameInputChange(value: string) {
		setCurrentInput(value);
		if (value.trim().length < 2) {
			setSuggestions([]);
			setHighlightedIndex(-1);
			return;
		}

		const requestId = ++searchRequestId.current;
		const results = await searchAllItemNames(app, ingredientsFolder, otherItemsNotePath, value);

		if (requestId !== searchRequestId.current) return; // a newer keystroke already superseded this search
		setSuggestions(results);
		setHighlightedIndex(-1);
	}

	// Commits a name (whether it came from the free-typed text or a picked suggestion)
	// and moves to the next step. Shared by both the "Enter with no selection" path
	// and the "click/Enter on a suggestion" path.
	// Commits a name and moves to the next step. If the name doesn't match an
// existing ingredient file, it's recorded in the "Autres" note so future
// searches recognize it — this is what makes the "Autres" note grow on its own.
	async function commitName(chosenName: string) {
		const trimmed = lowerFirstLetter(chosenName.trim());
		if (trimmed === '') return;

		setName(trimmed);
		setCurrentInput('');
		setSuggestions([]);
		setHighlightedIndex(-1);
		setStep('complement-or-quantity');

		const ingredientPath = `${ingredientsFolder}/${trimmed}.md`;
		const isKnownIngredient = app.vault.getAbstractFileByPath(ingredientPath) !== null;
		if (!isKnownIngredient) {
			await addOtherItemNameIfMissing(app, otherItemsNotePath, trimmed);
		}
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		// Backspace on an empty input steps back to the previous stage,
		// restoring its text into the input so it can be edited again.
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
			return; // already at 'name' with nothing typed: nothing to go back to
		}

		if (step === 'name') {
			// Arrow keys move the highlighted suggestion, without touching the typed text.
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
				// If a suggestion is highlighted, it wins over the raw typed text.
				if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
					commitName(suggestions[highlightedIndex]);
				} else {
					commitName(currentInput);
				}
				return;
			}
			return; // any other key: let the input handle it normally
		}

		if (e.key !== 'Enter') return;

		if (step === 'complement-or-quantity') {
			if (currentInput.trim() === '') {
				onAdd({ name, complement: '', parsedQuantity: null });
				reset();
				return;
			}

			const parsed = parseQuantityString(currentInput);
			if (parsed) {
				onAdd({ name, complement: '', parsedQuantity: parsed });
				reset();
				return;
			}

			setComplement(currentInput.trim());
			setCurrentInput('');
			setStep('quantity');
			return;
		}

		// step === 'quantity'
		if (currentInput.trim() === '') {
			onAdd({ name, complement, parsedQuantity: null });
			reset();
			return;
		}

		const parsed = parseQuantityString(currentInput);
		if (parsed) {
			onAdd({ name, complement, parsedQuantity: parsed });
			reset();
			return;
		}
		// Non-empty but invalid: block on purpose, no state change.
	}

	const placeholder =
		step === 'name'
			? "Nom de l'article"
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

			{/* Suggestions popup — only shown during the 'name' step, capped and scrollable */}
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
