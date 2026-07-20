import { useRef, useState } from 'react';
import { NutritionPer100g } from '../models/Ingredient';
import { searchUsda, UsdaResult } from '../services/usda';
import { translateToEnglish } from '../services/translate';
import { ErrorModal } from './ErrorModal';
import { App } from 'obsidian';

export interface IngredientFormValues {
	name: string;
	nameEn: string;
	type: string;
	shopSection: string;
	densityGMl: string;
	entityWeightG: string;
	possibleForms: string;
	nutrition: NutritionPer100g;
}

interface IngredientFormProps {
	app: App; // needed to open the native Obsidian error modal
	onSubmit: (values: IngredientFormValues) => void;
	ingredientTypes: string[];
	shopSections: string[];
	usdaApiKey: string;
	initialValues?: IngredientFormValues;
	submitLabel?: string;
	onCancel?: () => void;
}

const emptyNutrition: NutritionPer100g = {
	kcal: 0,
	lipids: 0,
	non_saturated_lipids: 0,
	glucids: 0,
	sugar: 0,
	proteins: 0,
	salt: 0,
	fibers: 0,
	cholesterol: 0,
};

const nutritionLabels: Record<keyof NutritionPer100g, string> = {
	kcal: 'Calories (kcal)',
	lipids: 'Lipides (g)',
	non_saturated_lipids: 'dont insaturés (g)',
	glucids: 'Glucides (g)',
	sugar: 'dont sucres (g)',
	proteins: 'Protéines (g)',
	salt: 'Sel (g)',
	fibers: 'Fibres (g)',
	cholesterol: 'Cholestérol (mg)',
};

const NUTRITION_KEYS = Object.keys(emptyNutrition) as (keyof NutritionPer100g)[];

// Nutrition fields are edited as strings (like densityGMl/entityWeightG),
// and only converted to numbers on submit. This avoids the NaN trap:
// typing a letter no longer corrupts the field, it's just an invalid string
// that gets caught by validation before submit.
function nutritionToStrings(nutrition: NutritionPer100g): Record<keyof NutritionPer100g, string> {
	const result = {} as Record<keyof NutritionPer100g, string>;
	for (const key of NUTRITION_KEYS) {
		result[key] = nutrition[key].toString();
	}
	return result;
}

export function IngredientForm({
								   app,
								   onSubmit,
								   ingredientTypes,
								   shopSections,
								   usdaApiKey,
								   initialValues,
								   submitLabel = 'Créer l\'ingrédient',
								   onCancel,
							   }: IngredientFormProps) {
	const [name, setName] = useState(initialValues?.name ?? '');
	const [nameEn, setNameEn] = useState(initialValues?.nameEn ?? '');
	const [type, setType] = useState(initialValues?.type ?? '');
	const [shopSection, setShopSection] = useState(initialValues?.shopSection ?? '');
	const [densityGMl, setDensityGMl] = useState(initialValues?.densityGMl ?? '');
	const [entityWeightG, setEntityWeightG] = useState(initialValues?.entityWeightG ?? '');
	const [possibleForms, setPossibleForms] = useState(initialValues?.possibleForms ?? '');
	const [nutritionInputs, setNutritionInputs] = useState<Record<keyof NutritionPer100g, string>>(
		nutritionToStrings(initialValues?.nutrition ?? emptyNutrition)
	);
	const [searchResults, setSearchResults] = useState<UsdaResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [isPopupOpen, setIsPopupOpen] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const searchRequestId = useRef(0);

	// Just store the raw string as typed — no Number() conversion here anymore.
	function updateNutritionField(field: keyof NutritionPer100g, value: string) {
		setNutritionInputs((prev) => ({ ...prev, [field]: sanitizeNumericInput(value) }));
	}

	function handleSubmit() {
		const errors: string[] = [];

		if (name.trim() === '') {
			errors.push('Le nom est obligatoire.');
		}
		if (type.trim() === '') {
			errors.push('Le type est obligatoire.');
		}
		if (shopSection.trim() === '') {
			errors.push('Le rayon est obligatoire.');
		}

		const parsedNutrition = {} as NutritionPer100g;
		for (const key of NUTRITION_KEYS) {
			const raw = nutritionInputs[key];
			const value = Number(raw);
			if (raw.trim() === '' || Number.isNaN(value)) {
				errors.push(`"${nutritionLabels[key]}" n'est pas un nombre valide.`);
			} else {
				parsedNutrition[key] = value;
			}
		}

		if (errors.length > 0) {
			new ErrorModal(app, errors).open();
			return;
		}

		onSubmit({ name, nameEn, type, shopSection, densityGMl, entityWeightG, possibleForms, nutrition: parsedNutrition });
	}

	async function runSearch(query: string) {
		if (query.trim() === '') return;

		const requestId = ++searchRequestId.current;
		setIsSearching(true);
		setIsPopupOpen(false);
		setSelectedIndex(null);

		const results = await searchUsda(query, usdaApiKey);

		if (requestId !== searchRequestId.current) return;

		setSearchResults(results);
		setIsSearching(false);
	}

	function handleNameFocus() {
		setNameEn('');
		setSearchResults([]);
		setIsSearching(false);
		setIsPopupOpen(false);
		setSelectedIndex(null);
		searchRequestId.current++;
	}

	async function handleNameBlur() {
		if (nameEn.trim() !== '') return;

		const requestId = ++searchRequestId.current;
		setIsSearching(true);

		const translated = await translateToEnglish(name);

		if (requestId !== searchRequestId.current) return;

		setNameEn(translated);
		runSearch(translated);
	}

	function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === 'Tab') {
			e.preventDefault();
			e.currentTarget.blur();
		}
	}

	function handleNameEnChange(value: string) {
		setNameEn(value);
		setIsSearching(false);
		setIsPopupOpen(false);
		setSearchResults([]);
		setSelectedIndex(null);
		searchRequestId.current++;
	}

	function handleNameEnBlur() {
		runSearch(nameEn);
	}

	// Fills nutrition fields from a USDA result — converts numbers to strings
	// since nutritionInputs is now string-based.
	function applyResult(index: number) {
		const result = searchResults[index];
		setNutritionInputs({
			kcal: (result.kcal ?? 0).toString(),
			lipids: (result.lipids ?? 0).toString(),
			non_saturated_lipids: ((result.lipids ?? 0) - (result.saturatedLipids ?? 0)).toString(),
			glucids: (result.glucids ?? 0).toString(),
			sugar: (result.sugar ?? 0).toString(),
			proteins: (result.proteins ?? 0).toString(),
			salt: (result.salt ?? 0).toString(),
			fibers: (result.fibers ?? 0).toString(),
			cholesterol: (result.cholesterol ?? 0).toString(),
		});
		setSelectedIndex(index);
		setIsPopupOpen(false);
	}

	// Strips any character that isn't a digit or a dot, so numeric fields
// can never contain letters or invalid symbols while typing.
	function sanitizeNumericInput(value: string): string {
		return value.replace(/[^0-9.]/g, '');
	}

	return (
		<div className="ingredient-form">
			<h3>Nouvel ingrédient</h3>

			<section className="ingredient-form-section">
				<h4>Informations générales</h4>

				<div className="ingredient-form-field">
					<label>Nom</label>
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						onFocus={handleNameFocus}
						onBlur={handleNameBlur}
						onKeyDown={handleNameKeyDown}
					/>
				</div>

				<div className="ingredient-form-field usda-search-wrapper">
					<label>Nom en anglais (pour la recherche)</label>
					<div className="usda-search-row">
						<input
							value={nameEn}
							onChange={(e) => handleNameEnChange(e.target.value)}
							onBlur={handleNameEnBlur}
						/>
						<button
							type="button"
							className="usda-search-button"
							onClick={() => runSearch(nameEn)}
							disabled={isSearching}
						>
							{isSearching ? <span className="usda-spinner" /> : '🔍'}
						</button>
					</div>

					<div className="usda-popup">
						{searchResults.length > 0 ? (
							<>
								<button
									type="button"
									className="usda-popup-summary"
									onClick={() => setIsPopupOpen((open) => !open)}
								>
									{(() => {
										const shown = searchResults[selectedIndex ?? 0];
										return `${shown.description} (${shown.dataType}) — ${shown.kcal ?? '?'} kcal`;
									})()}
								</button>

								{isPopupOpen && (
									<ul className="usda-popup-list">
										{searchResults.map((result, index) => (
											<li
												key={index}
												className={index === (selectedIndex ?? 0) ? 'usda-popup-selected' : ''}
												onClick={() => applyResult(index)}
											>
												{result.description} ({result.dataType}) — {result.kcal ?? '?'} kcal
											</li>
										))}
									</ul>
								)}
							</>
						) : (
							<span className="usda-popup-empty">Aucune suggestion pour l'instant</span>
						)}
					</div>
				</div>

				<div className="ingredient-form-grid">
					<div className="ingredient-form-field">
						<label>Type</label>
						<select value={type} onChange={(e) => setType(e.target.value)}>
							<option value="">-- Choisir --</option>
							{ingredientTypes.map((t) => (
								<option key={t} value={t}>{t}</option>
							))}
						</select>
					</div>

					<div className="ingredient-form-field">
						<label>Rayon</label>
						<select value={shopSection} onChange={(e) => setShopSection(e.target.value)}>
							<option value="">-- Choisir --</option>
							{shopSections.map((s) => (
								<option key={s} value={s}>{s}</option>
							))}
						</select>
					</div>

					<div className="ingredient-form-field">
						<label>Densité (g/mL)</label>
						<input value={densityGMl} onChange={(e) => setDensityGMl(sanitizeNumericInput(e.target.value))} />
					</div>

					<div className="ingredient-form-field">
						<label>Poids unitaire (g)</label>
						<input value={entityWeightG} onChange={(e) => setEntityWeightG(sanitizeNumericInput(e.target.value))} />					</div>
				</div>

				<div className="ingredient-form-field">
					<label>Formes possibles (séparées par des virgules)</label>
					<input
						value={possibleForms}
						onChange={(e) => setPossibleForms(e.target.value)}
						placeholder="ex : feuilles, haché, en branches"
					/>
				</div>
			</section>

			<section className="ingredient-form-section">
				<h4>Valeurs nutritionnelles (pour 100g)</h4>

				<div className="ingredient-form-grid-nutrition">
					{NUTRITION_KEYS.map((field) => (
						<div className="ingredient-form-field" key={field}>
							<label>{nutritionLabels[field]}</label>
							<input
								value={nutritionInputs[field]}
								onChange={(e) => updateNutritionField(field, e.target.value)}
							/>
						</div>
					))}
				</div>
			</section>

			<div className="ingredient-form-actions">
				<button
					className="ingredient-form-submit"
					onClick={(e) => {
						handleSubmit();
						e.currentTarget.blur();
					}}
				>
					{submitLabel}
				</button>
			</div>
		</div>
	);
}
