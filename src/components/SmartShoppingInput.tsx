import { useRef, useState } from 'react';
import { App } from 'obsidian';
import { parseQuantityString, ParsedQuantity } from '../models/units';
import { searchAllItemNames } from '../models/searchAllItemNames';
import { addOtherItemNameIfMissing } from '../models/otherItemsNote';
import { normalizeNameForFile } from '../models/textNormalize';
import { IngredientNameSuggestion } from '../models/searchIngredientNames';
import { SmartInputTokenBar } from './SmartInputTokenBar';
import { useT } from '../i18n/LanguageContext';

export interface SmartInputResult {
	name: string;
	complement: string;
	parsedQuantity: ParsedQuantity | null;
}

interface SmartShoppingInputProps {
	app: App;
	ingredientsFolder: string;
	otherItemsNotePath: string;
	onAdd: (result: SmartInputResult) => void;
}

type Step = 'name' | 'complement-or-quantity' | 'quantity';

export function SmartShoppingInput({ app, ingredientsFolder, otherItemsNotePath, onAdd }: SmartShoppingInputProps) {
	const t = useT();
	const [step, setStep] = useState<Step>('name');
	const [name, setName] = useState('');
	const [form, setForm] = useState<string | undefined>(undefined);
	const [complement, setComplement] = useState('');
	const [currentInput, setCurrentInput] = useState('');

	const [suggestions, setSuggestions] = useState<IngredientNameSuggestion[]>([]);
	const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

	const searchRequestId = useRef(0);

	function reset() {
		setStep('name');
		setName('');
		setForm(undefined);
		setComplement('');
		setCurrentInput('');
		setSuggestions([]);
		setHighlightedIndex(-1);
	}

	async function handleNameInputChange(value: string) {
		setCurrentInput(value);
		if (value.trim().length < 2) {
			setSuggestions([]);
			setHighlightedIndex(-1);
			return;
		}

		const requestId = ++searchRequestId.current;
		const results = await searchAllItemNames(app, ingredientsFolder, otherItemsNotePath, [], [], value);

		if (requestId !== searchRequestId.current) return;
		setSuggestions(results);
		setHighlightedIndex(-1);
	}

	function combinedComplement(): string {
		return [form, complement].filter(Boolean).join(', ');
	}


	async function commitName(chosenName: string, pickedForm?: string) {
		const trimmed = normalizeNameForFile(chosenName);
		if (trimmed === '') return;

		setName(trimmed);
		setForm(pickedForm);
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
				setForm(undefined);
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
					const s = suggestions[highlightedIndex];
					commitName(s.name, s.form);
				} else {
					commitName(currentInput);
				}
				return;
			}
			return;
		}

		if (e.key !== 'Enter') return;

		if (step === 'complement-or-quantity') {
			if (currentInput.trim() === '') {
				onAdd({ name, complement: combinedComplement(), parsedQuantity: null });
				reset();
				return;
			}

			const parsed = parseQuantityString(currentInput);
			if (parsed) {
				onAdd({ name, complement: combinedComplement(), parsedQuantity: parsed });
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
			onAdd({ name, complement: combinedComplement(), parsedQuantity: null });
			reset();
			return;
		}

		const parsed = parseQuantityString(currentInput);
		if (parsed) {
			onAdd({ name, complement: combinedComplement(), parsedQuantity: parsed });
			reset();
			return;
		}
	}

	const placeholder =
		step === 'name'
			? t('smartShoppingInput.placeholder.name')
			: step === 'complement-or-quantity'
				? t('smartShoppingInput.placeholder.complementOrQuantity')
				: t('smartShoppingInput.placeholder.quantityOptional');

	const displayName = name ? `${name}${form ? ` (${form})` : ''}` : '';

	const tokens = [
		displayName,
		step === 'quantity' ? complement : '',
	];

	return (
		<SmartInputTokenBar
			tokens={tokens}
			currentInput={currentInput}
			onCurrentInputChange={(v) => (step === 'name' ? handleNameInputChange(v) : setCurrentInput(v))}
			onKeyDown={handleKeyDown}
			placeholder={placeholder}
			showSuggestions={step === 'name'}
			suggestions={suggestions.map((s) => ({
				key: `${s.name}-${s.form ?? ''}`,
				label: `${s.name}${s.form ? ` (${s.form})` : ''}`,
				onClick: () => commitName(s.name, s.form),
			}))}
			highlightedIndex={highlightedIndex}
			onSuggestionHover={setHighlightedIndex}
		/>
	);
}
