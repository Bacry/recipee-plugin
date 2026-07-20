import { useRef, useState } from 'react';
import { NutritionPer100g } from '../models/Ingredient';
import { searchUsda, UsdaResult } from '../services/usda';
import { translateToEnglish } from '../services/translate';

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
	onSubmit: (values: IngredientFormValues) => void;
	ingredientTypes: string[];
	shopSections: string[];
	usdaApiKey: string;
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

export function IngredientForm({ onSubmit, ingredientTypes, shopSections, usdaApiKey }: IngredientFormProps) {
	const [name, setName] = useState('');
	const [nameEn, setNameEn] = useState('');
	const [type, setType] = useState('');
	const [shopSection, setShopSection] = useState('');
	const [densityGMl, setDensityGMl] = useState('');
	const [entityWeightG, setEntityWeightG] = useState('');
	const [possibleForms, setPossibleForms] = useState('');
	const [nutrition, setNutrition] = useState<NutritionPer100g>(emptyNutrition);
	const [searchResults, setSearchResults] = useState<UsdaResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [isPopupOpen, setIsPopupOpen] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const searchRequestId = useRef(0);

	function updateNutritionField(field: keyof NutritionPer100g, value: string) {
		setNutrition((prev) => ({ ...prev, [field]: Number(value) }));
	}

	function handleSubmit() {
		onSubmit({ name, nameEn, type, shopSection, densityGMl, entityWeightG, possibleForms, nutrition });
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
	function applyResult(index: number) {
		const result = searchResults[index];
		setNutrition({
			kcal: result.kcal ?? 0,
			lipids: result.lipids ?? 0,
			non_saturated_lipids: (result.lipids ?? 0) - (result.saturatedLipids ?? 0),
			glucids: result.glucids ?? 0,
			sugar: result.sugar ?? 0,
			proteins: result.proteins ?? 0,
			salt: result.salt ?? 0,
			fibers: result.fibers ?? 0,
			cholesterol: result.cholesterol ?? 0,
		});
		setSelectedIndex(index);
		setIsPopupOpen(false);
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
						<input value={densityGMl} onChange={(e) => setDensityGMl(e.target.value)} />
					</div>

					<div className="ingredient-form-field">
						<label>Poids unitaire (g)</label>
						<input value={entityWeightG} onChange={(e) => setEntityWeightG(e.target.value)} />
					</div>
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
					{(Object.keys(emptyNutrition) as (keyof NutritionPer100g)[]).map((field) => (
						<div className="ingredient-form-field" key={field}>
							<label>{nutritionLabels[field]}</label>
							<input
								value={nutrition[field]}
								onChange={(e) => updateNutritionField(field, e.target.value)}
							/>
						</div>
					))}
				</div>
			</section>

			<button className="ingredient-form-submit" onClick={handleSubmit}>Créer l'ingrédient</button>
		</div>
	);
}
