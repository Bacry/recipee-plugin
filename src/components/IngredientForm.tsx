import { useEffect, useRef, useState } from 'react';
import { App, Notice } from 'obsidian';
import { NutritionPer100g } from '../models/Ingredient';
import { searchUsda, UsdaResult } from '../services/usda';
import { translateToEnglish } from '../services/translate';
import { ErrorModal } from './ErrorModal';
import { sortAlphabetically } from '../models/textNormalize';
import { suggestIngredientFields } from '../services/ai/aiIngredientExtraction';
import { AIProviderId } from '../services/ai/types';
import { forwardRef, useImperativeHandle } from 'react';
import { useT } from '../i18n/LanguageContext';
import { useContext } from 'react';
import { LanguageContext } from '../i18n/LanguageContext';
import { AIProviderId } from '../services/ai/types';
import { AICredentials } from '../services/ai/types';

export interface IngredientFormHandle {
	triggerSubmit: () => void;
}

export interface IngredientFormValues {
	name: string;
	nameEn: string;
	type: string;
	shopSection: string;
	densityGMl: string;
	entityWeightG: string;
	possibleForms: string;
	brand: string;
	dietFlags: string;
	juiceYieldMl: string;
	nutrition: NutritionPer100g;
}

interface IngredientFormProps {
	app: App;
	onSubmit: (values: IngredientFormValues) => void;
	ingredientTypes: string[];
	shopSections: string[];
	dietFlags: string[];
	fruitIngredientTypes: string[];
	usdaEnabled: boolean;
	aiEnabled: boolean;
	usdaApiKey: string;
	aiCredentials: AICredentials;
	aiProvider: AIProviderId;
	initialValues?: IngredientFormValues;
	submitLabel?: string;
	autoSearchOnMount?: boolean;
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


const NUTRITION_KEYS = Object.keys(emptyNutrition) as (keyof NutritionPer100g)[];

function nutritionToStrings(nutrition: NutritionPer100g): Record<keyof NutritionPer100g, string> {
	const result = {} as Record<keyof NutritionPer100g, string>;
	for (const key of NUTRITION_KEYS) {
		result[key] = nutrition[key].toString();
	}
	return result;
}

export const IngredientForm = forwardRef<IngredientFormHandle, IngredientFormProps>(function IngredientForm(
	{
		app,
		onSubmit,
		ingredientTypes,
		shopSections,
		dietFlags,
		fruitIngredientTypes,
		usdaApiKey,
		aiCredentials,
		aiProvider,
		usdaEnabled,
		aiEnabled,
		initialValues,
		submitLabel = 'Créer l\'ingrédient',
		autoSearchOnMount,
	},
	ref) {
	const t = useT();
	const language = useContext(LanguageContext);

	function nutritionLabel(field: keyof NutritionPer100g): string {
		const keys: Record<keyof NutritionPer100g, string> = {
			kcal: 'ingredientForm.nutrition.kcal',
			lipids: 'ingredientForm.nutrition.lipids',
			non_saturated_lipids: 'ingredientForm.nutrition.nonSaturatedLipids',
			glucids: 'ingredientForm.nutrition.glucids',
			sugar: 'ingredientForm.nutrition.sugar',
			proteins: 'ingredientForm.nutrition.proteins',
			salt: 'ingredientForm.nutrition.salt',
			fibers: 'ingredientForm.nutrition.fibers',
			cholesterol: 'ingredientForm.nutrition.cholesterol',
		};
		return t(keys[field]);
	}

	const [name, setName] = useState(initialValues?.name ?? '');
	const [nameEn, setNameEn] = useState(initialValues?.nameEn ?? '');
	const [type, setType] = useState(initialValues?.type ?? '');
	const [shopSection, setShopSection] = useState(initialValues?.shopSection ?? '');
	const [densityGMl, setDensityGMl] = useState(initialValues?.densityGMl ?? '');
	const [brand, setBrand] = useState(initialValues?.brand ?? '');
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
	const [aiNutritionSuggestions, setAiNutritionSuggestions] = useState<Record<keyof NutritionPer100g, number> | null>(null);
	const [isSuggestingWithAI, setIsSuggestingWithAI] = useState(false);
	const [juiceYieldMl, setJuiceYieldMl] = useState(initialValues?.juiceYieldMl ?? '');
	const [dietFlagsSelected, setDietFlagsSelected] = useState<string[]>(
		(initialValues?.dietFlags ?? '').split(',').map((f) => f.trim()).filter(Boolean)
	);
	const [dietMenuOpen, setDietMenuOpen] = useState(false);

	function toggleDietFlag(flag: string) {
		setDietFlagsSelected((prev) =>
			prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]
		);
	}

	function updateNutritionField(field: keyof NutritionPer100g, value: string) {
		setNutritionInputs((prev) => ({ ...prev, [field]: sanitizeNumericInput(value) }));
	}

	function applyAllAiSuggestions() {
		if (!aiNutritionSuggestions) return;
		const next = { ...nutritionInputs };
		for (const key of NUTRITION_KEYS) {
			next[key] = aiNutritionSuggestions[key].toString();
		}
		setNutritionInputs(next);
	}

	async function handleSuggestWithAI() {
		if (name.trim() === '') {
			new Notice(t('ingredientForm.error.nameRequiredForSuggestion'));
			return;
		}

		setIsSuggestingWithAI(true);
		const result = await suggestIngredientFields(
			aiProvider,
			aiCredentials,
			name,
			ingredientTypes,
			shopSections,
			dietFlags,
			language
		);
		setIsSuggestingWithAI(false);

		if (result.error || !result.suggestion) {
			new Notice(result.error ?? t('ingredientForm.ai.unknownError'));
			return;
		}

		const s = result.suggestion;
		setType(s.type);
		setShopSection(s.shopSection);
		setDensityGMl(s.densityGMl);
		setEntityWeightG(s.entityWeightG);
		setPossibleForms(s.possibleForms);
		setDietFlagsSelected(s.dietFlags.split(',').map((f: string) => f.trim()).filter(Boolean));

		if (s.nutrition) {
			setAiNutritionSuggestions(s.nutrition);
		}
	}

	function handleSubmit() {
		const errors: string[] = [];

		if (name.trim() === '') {
			errors.push(t('ingredientForm.error.nameRequired'));
		}
		if (type.trim() === '') {
			errors.push(t('ingredientForm.error.typeRequired'));
		}
		if (shopSection.trim() === '') {
			errors.push(t('ingredientForm.error.shopSectionRequired'));
		}
		const d = Number(densityGMl)
		if (densityGMl.trim() !== "" && (Number.isNaN(d) ||  d <= 0)) {
			errors.push(t('ingredientForm.error.densityInvalid'));
		}
		const e = Number(entityWeightG)
		if (entityWeightG.trim() !== "" && (Number.isNaN(e) ||  e <= 0)) {
			errors.push(t('ingredientForm.error.entityWeightInvalid'));
		}

		const j = Number(juiceYieldMl)
		if (juiceYieldMl.trim() !== "" && (Number.isNaN(j) || j <= 0)) {
			errors.push(t('ingredientForm.error.juiceYieldInvalid'));
		}

		const parsedNutrition = {} as NutritionPer100g;
		for (const key of NUTRITION_KEYS) {
			const raw = nutritionInputs[key];
			const value = Number(raw);
			if (raw.trim() === '' || Number.isNaN(value)) {
				errors.push(t('ingredientForm.error.nutritionInvalid').replace('{label}', nutritionLabel(key)));
			} else {
				parsedNutrition[key] = value;
			}
		}

		if (errors.length > 0) {
			new ErrorModal(app, errors, language).open();
			return;
		}

		onSubmit({ name, nameEn, type, shopSection, densityGMl, entityWeightG, brand, dietFlags: dietFlagsSelected.join(', '), possibleForms, juiceYieldMl, nutrition: parsedNutrition });
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

	useEffect(() => {
		if (autoSearchOnMount && name.trim() !== '') {
			handleNameBlur();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

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

	function sanitizeNumericInput(value: string): string {
		return value.replace(/[^0-9.]/g, '');
	}

	function renderNutritionField(field: keyof NutritionPer100g) {
		return (
			<div className="ingredient-form-nutrition-field" key={field}>
				<label>{nutritionLabel(field)}</label>
				<input
					value={nutritionInputs[field]}
					onChange={(e) => updateNutritionField(field, e.target.value)}
				/>
				{aiEnabled && aiNutritionSuggestions && (
					<span
						className="ingredient-form-ai-suggestion"
						onClick={() => applyAiNutritionValue(field)}
					>
    {t('ingredientForm.ai.prefix')} {aiNutritionSuggestions[field].toFixed(1)}
</span>
				)}
			</div>
		);
	}

	function applyAllAiNutritionValues() {
		if (!aiNutritionSuggestions) return;
		const next = { ...nutritionInputs };
		for (const key of NUTRITION_KEYS) {
			next[key] = aiNutritionSuggestions[key].toString();
		}
		setNutritionInputs(next);
	}

	useImperativeHandle(ref, () => ({
		triggerSubmit: handleSubmit,
	}));

	return (
		<div>
			<section className="form-section section">
				<h4>{t('ingredientForm.generalInfo')}</h4>

				<div className="form-field form-field-wide">
					<label>{t('ingredientForm.name')}</label>
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						onFocus={handleNameFocus}
						onBlur={handleNameBlur}
						onKeyDown={handleNameKeyDown}
					/>
				</div>

				{aiEnabled && (
					<div className="form-field">
						<button
							type="button"
							onClick={handleSuggestWithAI}
							disabled={isSuggestingWithAI}
							className="ingredient-form-submit"
						>
							{isSuggestingWithAI ? t('ingredientForm.suggestWithAi.thinking') : t('ingredientForm.suggestWithAi')}
						</button>
					</div>
				)}

				<div className="form-grid">
					<div className="form-field">
						<label>{t('ingredientForm.type')}</label>
						<select value={type} onChange={(e) => setType(e.target.value)}>
							<option value="">{t('ingredientForm.choose')}</option>
							{sortAlphabetically(ingredientTypes).map((typeOption) => (
								<option key={typeOption} value={typeOption}>{typeOption}</option>
							))}
						</select>
					</div>

					<div className="form-field">
						<label>{t('ingredientForm.shopSection')}</label>
						<select value={shopSection} onChange={(e) => setShopSection(e.target.value)}>
							<option value="">{t('ingredientForm.choose')}</option>
							{sortAlphabetically(shopSections).map((sectionOption) => (
								<option key={sectionOption} value={sectionOption}>{sectionOption}</option>
							))}
						</select>
					</div>

					<div className="form-field">
						<label>{t('ingredientForm.density')}</label>
						<input value={densityGMl} onChange={(e) => setDensityGMl(sanitizeNumericInput(e.target.value))} />
					</div>

					<div className="form-field">
						<label>{t('ingredientForm.entityWeight')}</label>
						<input value={entityWeightG} onChange={(e) => setEntityWeightG(sanitizeNumericInput(e.target.value))} />
					</div>
				</div>
			</section>
			<section className="form-section section">
				<h4>{t('ingredientForm.specificInfo')}</h4>

				<div className="form-grid">
					<div className="form-field">
						<label>{t('ingredientForm.forms')}</label>
						<input
							value={possibleForms}
							onChange={(e) => setPossibleForms(e.target.value)}
							placeholder={t('ingredientForm.forms.placeholder')}
						/>
					</div>

					<div className="form-field">
						<label>{t('ingredientForm.constraints')}</label>
						<div className="list-tag-menu-wrapper ingredient-form-diet-menu-wrapper">
							<button
								type="button"
								onClick={() => setDietMenuOpen((open) => !open)}
								className="list-tag-menu-button"
							>
								{dietFlagsSelected.length > 0
									? t('ingredientForm.constraints.count').replace('{count}', dietFlagsSelected.length.toString())
									: t('ingredientForm.constraints.none')}
							</button>
							{dietMenuOpen && (
								<ul className="list-tag-menu">
									{sortAlphabetically(dietFlags).map((flag) => (
										<li key={flag} className="list-tag-menu-item">
											<label>
												<input
													type="checkbox"
													checked={dietFlagsSelected.includes(flag)}
													onChange={() => toggleDietFlag(flag)}
												/>
												{' '}{flag}
											</label>
										</li>
									))}
								</ul>
							)}
						</div>
					</div>

					<div className="form-field">
						<label>{t('ingredientForm.brand')}</label>
						<input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder={t('ingredientForm.brand.placeholder')} />
					</div>

					{fruitIngredientTypes.includes(type) && (
						<div className="form-field">
							<label>{t('ingredientForm.juiceYield')}</label>
							<input value={juiceYieldMl} onChange={(e) => setJuiceYieldMl(sanitizeNumericInput(e.target.value))} placeholder={t('ingredientForm.juiceYield.placeholder')} />
						</div>
					)}
				</div>
			</section>

			<section className="form-section section">
				<h4>{t('ingredientForm.nutrition')}</h4>

				{usdaEnabled && (
					<div className="form-field usda-search-wrapper">
						<label>{t('ingredientForm.nameEn')}</label>
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
								<span className="usda-popup-empty">{t('ingredientForm.usda.noSuggestion')}</span>
							)}
						</div>
					</div>
				)}

				<div className="ingredient-form-nutrition-rows">
					<div className="ingredient-form-nutrition-row">
						{renderNutritionField('kcal')}
						{aiEnabled && aiNutritionSuggestions && (
							<div className="ingredient-form-ai-apply-all-wrapper">
								<button
									type="button"
									onClick={applyAllAiSuggestions}
									className="ingredient-form-ai-apply-all"
								>
									{t('ingredientForm.ai.copyAll')}
								</button>
							</div>
						)}
					</div>
					<div className="ingredient-form-nutrition-row">
						{renderNutritionField('lipids')}
						{renderNutritionField('non_saturated_lipids')}
					</div>
					<div className="ingredient-form-nutrition-row">
						{renderNutritionField('glucids')}
						{renderNutritionField('sugar')}
					</div>
					<div className="ingredient-form-nutrition-row">
						{renderNutritionField('proteins')}
						{renderNutritionField('salt')}
					</div>
					<div className="ingredient-form-nutrition-row">
						{renderNutritionField('fibers')}
						{renderNutritionField('cholesterol')}
					</div>
				</div>
			</section>

			<div style={{ height: "50px" }} />
		</div>
	);
});
