import { useState } from 'react';
import { App } from 'obsidian';
import { parseQuantityString, ParsedQuantity, findUnit, convertQuantity } from '../models/units';
import { searchIngredientNamesWithForms } from '../models/searchIngredientNames';
import { searchBaseRecipes, getBaseRecipeServingsLabel } from '../models/searchBaseRecipes';
import { normalizeNameForFile } from '../models/textNormalize';
import { FormEntry } from '../models/formEntry';
import { normalizeParsedQuantity } from '../models/normalizeQuantityUnit';

interface SmartRecipeIngredientInputProps {
	app: App;
	ingredientsFolder: string;
	recipesFolder: string;
	onAdd: (entry: FormEntry) => void;
}

type Step = 'name' | 'complement-or-quantity' | 'quantity';

interface Suggestion {
	name: string;
	kind: 'ingredient' | 'baseRecipe';
	form?: string;
}

export function SmartRecipeIngredientInput({ app, ingredientsFolder, recipesFolder, onAdd }: SmartRecipeIngredientInputProps) {
	const [step, setStep] = useState<Step>('name');
	const [name, setName] = useState('');
	const [kind, setKind] = useState<'ingredient' | 'baseRecipe'>('ingredient');
	const [form, setForm] = useState('');
	const [complement, setComplement] = useState('');
	const [currentInput, setCurrentInput] = useState('');
	const [error, setError] = useState<string | null>(null);

	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
	const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

	function reset() {
		setStep('name');
		setName('');
		setKind('ingredient');
		setForm('');
		setComplement('');
		setCurrentInput('');
		setError(null);
		setSuggestions([]);
		setHighlightedIndex(-1);
	}

	function handleNameInputChange(value: string) {
		setCurrentInput(value);
		setError(null);
		if (value.trim().length >= 2) {
			const baseRecipeMatches = searchBaseRecipes(app, recipesFolder, value).map((n) => ({ name: n, kind: 'baseRecipe' as const }));
			const ingredientMatches = searchIngredientNamesWithForms(app, ingredientsFolder, [], [], value)
				.map((s) => ({ name: s.name, kind: 'ingredient' as const, form: s.form }));
			setSuggestions([...baseRecipeMatches, ...ingredientMatches]);
			setHighlightedIndex(-1);
		} else {
			setSuggestions([]);
			setHighlightedIndex(-1);
		}
	}

	// A name matching a known "base"-tagged recipe becomes a base recipe
	// reference (mandatory quantity, unit checked against its own servings
	// unit). Anything else is treated as a regular ingredient — free text
	// allowed, nothing needs to exist yet, same as before the merge.
	// `suggestedForm`, when set, pre-fills the editable form field — it
	// came from the ingredient's own declared possible_forms, not typed
	// freely, but the user can still change it before submitting.
	function commitName(chosenName: string, forcedKind?: 'ingredient' | 'baseRecipe', suggestedForm?: string) {
		const trimmedIngredient = chosenName.trim();
		if (trimmedIngredient === '') return;

		const normalizedForRecipe = normalizeNameForFile(chosenName);
		const servingsLabel = getBaseRecipeServingsLabel(app, recipesFolder, normalizedForRecipe);
		const resolvedKind: 'ingredient' | 'baseRecipe' = forcedKind ?? (servingsLabel !== null ? 'baseRecipe' : 'ingredient');

		setName(resolvedKind === 'baseRecipe' ? normalizedForRecipe : trimmedIngredient);
		setKind(resolvedKind);
		setForm(resolvedKind === 'ingredient' ? (suggestedForm ?? '') : '');
		setCurrentInput('');
		setSuggestions([]);
		setHighlightedIndex(-1);
		setError(null);
		// Base recipes skip straight to the mandatory quantity step — no
		// complement field, and can't be added without an amount.
		setStep(resolvedKind === 'baseRecipe' ? 'quantity' : 'complement-or-quantity');
	}

	function finalizeIngredient(complementValue: string, parsedQuantity: ParsedQuantity | null) {
		const normalized = parsedQuantity
			? normalizeParsedQuantity(app, ingredientsFolder, name, parsedQuantity)
			: null;

		onAdd({
			kind: 'ingredient',
			ingredientName: name,
			form: form.trim() || undefined,
			complement: complementValue.trim() || undefined,
			quantity: normalized?.quantity ?? null,
			unit: normalized?.unit?.name ?? '',
		});
		reset();
	}

	function finalizeBaseRecipe(parsedQuantity: ParsedQuantity) {
		const servingsLabel = getBaseRecipeServingsLabel(app, recipesFolder, name);
		const targetUnit = servingsLabel ? findUnit(servingsLabel) : null;

		const converted = convertQuantity(parsedQuantity.quantity, parsedQuantity.unit, targetUnit);
		if (converted === null) {
			setError(
				`Unité incompatible : cette recette de base se mesure en "${servingsLabel}", pas convertible avec l'unité saisie.`
			);
			return;
		}

		onAdd({
			kind: 'baseRecipe',
			recipeName: name,
			quantity: parsedQuantity.quantity,
			unit: parsedQuantity.unit?.name ?? '',
		});
		reset();
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === 'Backspace' && currentInput === '') {
			if (step === 'quantity' && kind === 'ingredient') {
				setCurrentInput(complement);
				setComplement('');
				setStep('complement-or-quantity');
				return;
			}
			if (step === 'quantity' || step === 'complement-or-quantity') {
				setCurrentInput(name);
				setName('');
				setForm('');
				setError(null);
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
					commitName(s.name, s.kind, s.form);
				} else {
					commitName(currentInput);
				}
				return;
			}
			return;
		}

		if (e.key !== 'Enter') return;

		if (kind === 'baseRecipe') {
			if (currentInput.trim() === '') return;
			const parsed = parseQuantityString(currentInput);
			if (!parsed) return;
			finalizeBaseRecipe(parsed);
			return;
		}

		if (step === 'complement-or-quantity') {
			if (currentInput.trim() === '') {
				finalizeIngredient('', null);
				return;
			}
			const parsed = parseQuantityString(currentInput);
			if (parsed) {
				finalizeIngredient('', parsed);
				return;
			}
			setComplement(currentInput.trim());
			setCurrentInput('');
			setStep('quantity');
			return;
		}

		if (currentInput.trim() === '') {
			finalizeIngredient(complement, null);
			return;
		}
		const parsed = parseQuantityString(currentInput);
		if (parsed) {
			finalizeIngredient(complement, parsed);
		}
	}

	const placeholder =
		step === 'name'
			? "Nom de l'ingrédient ou d'une recette de base"
			: kind === 'baseRecipe'
				? 'Quantité (obligatoire)'
				: step === 'complement-or-quantity'
					? 'Complément ou quantité (optionnel)'
					: 'Quantité (optionnel)';

	return (
		<div className="smart-shopping-input-wrapper">
			<div className="smart-shopping-input">
				{name && (
					<span>{name}{kind === 'baseRecipe' ? ' (recette)' : ''}, </span>
				)}
				{kind === 'ingredient' && (step === 'complement-or-quantity' || step === 'quantity') && (
					<input
						value={form}
						onChange={(e) => setForm(e.target.value)}
						placeholder="forme (optionnel)"
						className="smart-shopping-form-input"
					/>
				)}
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

			{error && <p className="ingredient-validation-error">{error}</p>}

			{step === 'name' && suggestions.length > 0 && (
				<ul className="smart-shopping-suggestions">
					{suggestions.map((suggestion, index) => (
						<li
							key={`${suggestion.kind}-${suggestion.name}-${suggestion.form ?? ''}`}
							className={index === highlightedIndex ? 'smart-shopping-suggestion-highlighted' : ''}
							onMouseEnter={() => setHighlightedIndex(index)}
							onClick={() => commitName(suggestion.name, suggestion.kind, suggestion.form)}
						>
							{suggestion.name}
							{suggestion.kind === 'baseRecipe' ? ' (recette)' : ''}
							{suggestion.form ? ` (${suggestion.form})` : ''}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
