import { useState } from 'react';
import { App } from 'obsidian';
import { Recipe, RecipeIngredientEntry, RecipeBaseRecipeEntry } from '../models/recipe';
import { searchRecipeTags } from '../models/searchRecipeTags';
import { SmartRecipeIngredientInput } from './SmartRecipeIngredientInput';
import { listRecipeSubfolders } from '../models/listRecipeSubfolders';
import { ParseRecipeTextModal } from './ParseRecipeTextModal';
import { forwardRef, useImperativeHandle } from 'react';
import { searchRecipeSources } from '../models/searchRecipeSources';
import { listOilIngredients } from '../models/listOilIngredients';
import { FormEntry } from '../models/formEntry';
import { useT } from '../i18n/LanguageContext';
import { useContext } from 'react';
import { LanguageContext } from '../i18n/LanguageContext';
import { AIProviderId, AICredentials } from '../services/ai/types';

export interface RecipeFormHandle {
	triggerSubmit: () => void;
}

export interface RecipeFormValues {
	name: string;
	baseServings: string;
	servingsLabel: string;
	preparationDurationMin: string;
	cookingDurationMin: string;
	requiresCooking: boolean;
	madeBeforeTracking: boolean;
	isBaseRecipe: boolean;
	fryingOilName: string;
	ingredients: RecipeIngredientEntry[];
	baseRecipes: RecipeBaseRecipeEntry[];
	instructions: string;
	notes: string;
	source: string;
	image: string;
	tags: string;
	totalWeightG: string;
	subfolder: string;
}

interface RecipeFormProps {
	app: App;
	recipesFolder: string;
	ingredientsFolder: string;
	recipeImagesFolder: string;
	aiCredentials: AICredentials;
	aiProvider: AIProviderId;
	onSubmit: (values: RecipeFormValues) => void;
	initialValues?: RecipeFormValues;
	submitLabel?: string;
	oilIngredientTypes: string[];
	aiEnabled: boolean;
}

function emptyValues(): RecipeFormValues {
	return {
		name: '',
		baseServings: '',
		servingsLabel: '',
		preparationDurationMin: '',
		cookingDurationMin: '',
		requiresCooking: false,
		madeBeforeTracking: false,
		isBaseRecipe: false,
		ingredients: [],
		baseRecipes: [],
		instructions: '',
		notes: '',
		source: '',
		image: '',
		tags: '',
		subfolder: '',
		fryingOilName: '',
		totalWeightG: '',
	};
}

function sanitizeNumericInput(value: string): string {
	return value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
}

// Merges the two source arrays into a single ordered list for the unified
// form UI — base recipes end up appearing after ingredients on first load,
// which is fine since the user can freely reorder via drag afterward.
function toEntries(ingredients: RecipeIngredientEntry[], baseRecipes: RecipeBaseRecipeEntry[]): FormEntry[] {
	return [
		...ingredients.map((e): FormEntry => ({ kind: 'ingredient', ...e })),
		...baseRecipes.map((e): FormEntry => ({ kind: 'baseRecipe', ...e })),
	];
}

export const RecipeForm = forwardRef<RecipeFormHandle, RecipeFormProps>(function RecipeForm(
	{ app, recipesFolder, ingredientsFolder, recipeImagesFolder, aiCredentials,
		aiProvider, onSubmit, initialValues, submitLabel, oilIngredientTypes, aiEnabled  },
	ref
) {
	const t = useT();
	const language = useContext(LanguageContext);
	const base = initialValues ?? emptyValues();
	const [name, setName] = useState(base.name);
	const [baseServings, setBaseServings] = useState(base.baseServings);
	const [servingsLabel, setServingsLabel] = useState(base.servingsLabel);
	const [preparationDurationMin, setPreparationDurationMin] = useState(base.preparationDurationMin);
	const [cookingDurationMin, setCookingDurationMin] = useState(base.cookingDurationMin);
	const [entries, setEntries] = useState<FormEntry[]>(() => toEntries(base.ingredients, base.baseRecipes));
	const [instructions, setInstructions] = useState(base.instructions);
	const [notes, setNotes] = useState(base.notes);
	const [source, setSource] = useState(base.source);
	const [image, setImage] = useState(base.image);
	const [tags, setTags] = useState(base.tags);
	const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
	const [tagHighlightedIndex, setTagHighlightedIndex] = useState<number>(-1);
	const [totalWeightG, setTotalWeightG] = useState(base.totalWeightG);
	const [subfolder, setSubfolder] = useState(base.subfolder);
	const [sourceSuggestions, setSourceSuggestions] = useState<string[]>([]);
	const [sourceHighlightedIndex, setSourceHighlightedIndex] = useState<number>(-1);
	const [requiresCooking, setRequiresCooking] = useState(base.requiresCooking);
	const [madeBeforeTracking, setMadeBeforeTracking] = useState(base.madeBeforeTracking);
	const [isBaseRecipe, setIsBaseRecipe] = useState(base.isBaseRecipe);
	const [fryingOilName, setFryingOilName] = useState(base.fryingOilName);
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

	function handleSubmit() {
		// Tag each entry with its position in the unified list before splitting
		// it back into two arrays for storage — this is what lets RecipeDetails
		// later reconstruct the same interleaved order (ingredients and base
		// recipes mixed together) instead of always showing base recipes first.
		const entriesWithOrder = entries.map((entry, index) => ({ ...entry, order: index }));

		const ingredients: RecipeIngredientEntry[] = entriesWithOrder
			.filter((e): e is Extract<FormEntry, { kind: 'ingredient' }> => e.kind === 'ingredient')
			.map(({ kind, ...rest }) => rest);
		const baseRecipes: RecipeBaseRecipeEntry[] = entriesWithOrder
			.filter((e): e is Extract<FormEntry, { kind: 'baseRecipe' }> => e.kind === 'baseRecipe')
			.map(({ kind, ...rest }) => rest);

		onSubmit({
			name,
			baseServings,
			servingsLabel,
			preparationDurationMin,
			cookingDurationMin,
			requiresCooking,
			madeBeforeTracking,
			isBaseRecipe,
			ingredients,
			baseRecipes,
			instructions,
			notes,
			source,
			image,
			tags,
			totalWeightG,
			subfolder,
			fryingOilName,
		});
	}

	function handleTagsChange(value: string) {
		setTags(value);
		const fragment = getCurrentTagFragment(value);
		setTagSuggestions(fragment.length >= 1 ? searchRecipeTags(app, recipesFolder, fragment) : []);
		setTagHighlightedIndex(-1);
	}

	function handleTagsKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === 'ArrowDown' && tagSuggestions.length > 0) {
			e.preventDefault();
			setTagHighlightedIndex((prev) => Math.min(prev + 1, tagSuggestions.length - 1));
			return;
		}
		if (e.key === 'ArrowUp' && tagSuggestions.length > 0) {
			e.preventDefault();
			setTagHighlightedIndex((prev) => Math.max(prev - 1, -1));
			return;
		}
		if (e.key === 'Enter' && tagHighlightedIndex >= 0 && tagSuggestions[tagHighlightedIndex]) {
			e.preventDefault();
			applyTagSuggestion(tagSuggestions[tagHighlightedIndex]);
		}
	}

	function getCurrentTagFragment(value: string): string {
		const parts = value.split(',');
		return parts[parts.length - 1].trim();
	}

	function applyTagSuggestion(suggestion: string) {
		const parts = tags.split(',');
		parts[parts.length - 1] = ' ' + suggestion;
		setTags(parts.join(',').replace(/^,\s*/, '') + ', ');
		setTagSuggestions([]);
	}

	function handleRemoveEntry(index: number) {
		setEntries((prev) => prev.filter((_, i) => i !== index));
	}

	function reorderEntries(fromIndex: number, toIndex: number) {
		setEntries((prev) => {
			const next = [...prev];
			const [moved] = next.splice(fromIndex, 1);
			next.splice(toIndex, 0, moved);
			return next;
		});
	}

	function toggleFried(index: number) {
		setEntries((prev) =>
			prev.map((entry, i) =>
				i === index && entry.kind === 'ingredient' ? { ...entry, fried: !entry.fried } : entry
			)
		);
	}

	function addSection() {
		setEntries((prev) => [
			...prev,
			{ kind: 'ingredient', ingredientName: '', quantity: null, unit: '', isSectionHeader: true, sectionTitle: '' },
		]);
	}

	function updateSectionTitle(index: number, title: string) {
		setEntries((prev) =>
			prev.map((entry, i) =>
				i === index && entry.kind === 'ingredient' ? { ...entry, sectionTitle: title } : entry
			)
		);
	}

	async function handleImageUpload(file: File) {
		const buffer = await file.arrayBuffer();
		const folder = recipeImagesFolder;

		const extensionIndex = file.name.lastIndexOf('.');
		const extension = extensionIndex === -1 ? '' : file.name.slice(extensionIndex);
		const baseName = name.trim() !== '' ? name.trim() : file.name.slice(0, extensionIndex === -1 ? undefined : extensionIndex);

		let candidateName = `${baseName}${extension}`;
		let counter = 1;
		while (app.vault.getAbstractFileByPath(`${folder}/${candidateName}`)) {
			candidateName = `${baseName}-${counter}${extension}`;
			counter++;
		}

		await app.vault.createBinary(`${folder}/${candidateName}`, buffer);
		setImage(candidateName);
	}

	function handleSourceChange(value: string) {
		setSource(value);
		setSourceSuggestions(value.trim().length >= 1 ? searchRecipeSources(app, recipesFolder, value) : []);
		setSourceHighlightedIndex(-1);
	}

	function applySourceSuggestion(suggestion: string) {
		setSource(suggestion);
		setSourceSuggestions([]);
	}

	function handleSourceKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === 'ArrowDown' && sourceSuggestions.length > 0) {
			e.preventDefault();
			setSourceHighlightedIndex((prev) => Math.min(prev + 1, sourceSuggestions.length - 1));
			return;
		}
		if (e.key === 'ArrowUp' && sourceSuggestions.length > 0) {
			e.preventDefault();
			setSourceHighlightedIndex((prev) => Math.max(prev - 1, -1));
			return;
		}
		if (e.key === 'Enter' && sourceHighlightedIndex >= 0 && sourceSuggestions[sourceHighlightedIndex]) {
			e.preventDefault();
			applySourceSuggestion(sourceSuggestions[sourceHighlightedIndex]);
		}
	}

	function applyExtractedValues(values: RecipeFormValues) {
		setName(values.name);
		setBaseServings(values.baseServings);
		setServingsLabel(values.servingsLabel);
		setPreparationDurationMin(values.preparationDurationMin);
		setCookingDurationMin(values.cookingDurationMin);
		setRequiresCooking(values.requiresCooking);
		setMadeBeforeTracking(values.madeBeforeTracking);
		setIsBaseRecipe(values.isBaseRecipe);
		setEntries(toEntries(values.ingredients, values.baseRecipes));
		setInstructions(values.instructions);
		setNotes(values.notes);
		setSource(values.source);
		setImage(values.image);
		setTags(values.tags);
		setTotalWeightG(values.totalWeightG);
		setFryingOilName(values.fryingOilName);
	}

	function openParseTextModal() {
		new ParseRecipeTextModal(app, aiProvider, aiCredentials, ingredientsFolder, (values) => {
			applyExtractedValues(values);
		}, language).open();
	}

	useImperativeHandle(ref, () => ({
		triggerSubmit: handleSubmit,
	}));

	return (
		<div className="ingredient-form">

			{aiEnabled && (
				<div className="recipe-form-ai-section">
					<button type="button" onClick={openParseTextModal} className="recipe-form-ai-submit">
						{t('recipeForm.ai.extract')}
					</button>
				</div>
			)}

			<section className="form-section section">
				<h4>{t('recipeForm.generalInfo')}</h4>

				<div className="form-field form-field-wide">
					<label>{t('recipeForm.name')}*</label>
					<input value={name} onChange={(e) => setName(e.target.value)} />
				</div>
				<div className="form-grid">
					<div className="form-field">
						<label>{t('recipeForm.baseServings')}*</label>
						<input
							value={baseServings}
							onChange={(e) => setBaseServings(sanitizeNumericInput(e.target.value))}
						/>
					</div>

					<div className="form-field">
						<label>{t('recipeForm.servingsLabel')}*</label>
						<input value={servingsLabel} onChange={(e) => setServingsLabel(e.target.value)} />
					</div>

					<div className="form-field">
						<label>{t('recipeForm.preparationDuration')}</label>
						<input
							value={preparationDurationMin}
							onChange={(e) => setPreparationDurationMin(sanitizeNumericInput(e.target.value))}
						/>
					</div>

					<div className="form-field">
						<label>{t('recipeForm.requiresCooking')}*</label>
						<div className="recipe-form-cooking-row">
							<input
								type="checkbox"
								checked={requiresCooking}
								onChange={(e) => setRequiresCooking(e.target.checked)}
								className="recipe-form-cooking-checkbox"
							/>
							<span className="recipe-form-cooking-duration-wrapper">
								<input
									value={cookingDurationMin}
									onChange={(e) => setCookingDurationMin(sanitizeNumericInput(e.target.value))}
									disabled={!requiresCooking}
									placeholder={t('recipeForm.time')}
									className="recipe-form-cooking-duration-input"
								/>
							</span>
							<span className="recipe-form-cooking-weight-wrapper">
								<input
									value={totalWeightG}
									onChange={(e) => setTotalWeightG(sanitizeNumericInput(e.target.value))}
									disabled={!requiresCooking}
									placeholder={t('recipeForm.weight')}
									className="recipe-form-cooking-weight-input"
								/>
							</span>
						</div>
					</div>

					<div className="form-field">
						<label>{t('recipeForm.subfolder')}</label>
						<select value={subfolder} onChange={(e) => setSubfolder(e.target.value)}>
							<option value="">{t('recipeForm.subfolder.root')}</option>
							{listRecipeSubfolders(app, recipesFolder).map((folder) => (
								<option key={folder} value={folder}>{folder}</option>
							))}
						</select>
					</div>

					<div className="form-field">
						<label>{t('recipeForm.image')}</label>
						<div className="usda-search-row">
							<input value={image} onChange={(e) => setImage(e.target.value)} placeholder={t('recipeForm.image.placeholder')} />
							<input
								type="file"
								accept="image/*"
								id="recipe-image-upload"
								style={{ display: 'none' }}
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file) handleImageUpload(file);
								}}
							/>
							<button type="button" onClick={() => document.getElementById('recipe-image-upload')?.click()}>
								{t('recipeForm.choose')}
							</button>
						</div>
					</div>
				</div>

				<div className="recipe-form-row-tags-source">
					<div className="form-field usda-search-wrapper">
						<label>{t('recipeForm.tags')}</label>
						<input
							value={tags}
							onChange={(e) => handleTagsChange(e.target.value)}
							onKeyDown={handleTagsKeyDown}
							placeholder={t('recipeForm.tags.placeholder')}
						/>
						{tagSuggestions.length > 0 && (
							<ul className="smart-shopping-suggestions">
								{tagSuggestions.map((suggestion, index) => (
									<li
										key={suggestion}
										className={index === tagHighlightedIndex ? 'smart-shopping-suggestion-highlighted' : ''}
										onMouseEnter={() => setTagHighlightedIndex(index)}
										onClick={() => applyTagSuggestion(suggestion)}
									>
										{suggestion}
									</li>
								))}
							</ul>
						)}
					</div>

					<div className="form-field usda-search-wrapper recipe-form-field-source">
						<label>{t('recipeForm.source')}</label>
						<input
							value={source}
							onChange={(e) => handleSourceChange(e.target.value)}
							onKeyDown={handleSourceKeyDown}
						/>
						{sourceSuggestions.length > 0 && (
							<ul className="smart-shopping-suggestions">
								{sourceSuggestions.map((suggestion, index) => (
									<li
										key={suggestion}
										className={index === sourceHighlightedIndex ? 'smart-shopping-suggestion-highlighted' : ''}
										onMouseEnter={() => setSourceHighlightedIndex(index)}
										onClick={() => applySourceSuggestion(suggestion)}
									>
										{suggestion}
									</li>
								))}
							</ul>
						)}
					</div>
				</div>

				<div className="recipe-form-made-before-row">
					<label>{t('recipeForm.madeBefore')}</label>
					<input
						type="checkbox"
						checked={madeBeforeTracking}
						onChange={(e) => setMadeBeforeTracking(e.target.checked)}
						className="recipe-form-made-before-checkbox"
					/>
				</div>
				<div className="recipe-form-made-before-row">
					<label>{t('recipeForm.isBaseRecipe')}</label>
					<input
						type="checkbox"
						checked={isBaseRecipe}
						onChange={(e) => setIsBaseRecipe(e.target.checked)}
						className="recipe-form-made-before-checkbox"
					/>
				</div>
			</section>

			<section className="form-section section">
				<h4>{t('recipeForm.ingredientsAndBaseRecipes')}</h4>
				{entries.length === 0 && (
					<p className="recipe-empty-entries">{t('recipeForm.emptyEntries')}</p>
				)}
				{entries.length > 0 && (() => {
					let currentlyInSection = false;
					return (
						<ul>
							{entries.map((entry, index) => {
								if (entry.kind === 'ingredient' && entry.isSectionHeader) {
									currentlyInSection = (entry.sectionTitle ?? '').trim() !== '';
								}
								const isIndented = !(entry.kind === 'ingredient' && entry.isSectionHeader) && currentlyInSection;

								return (
									<li
										key={index}
										draggable
										onDragStart={() => setDraggedIndex(index)}
										onDragOver={(e) => e.preventDefault()}
										onDrop={(e) => {
											e.preventDefault();
											if (draggedIndex === null || draggedIndex === index) return;
											reorderEntries(draggedIndex, index);
											setDraggedIndex(null);
										}}
										onDragEnd={() => setDraggedIndex(null)}
										className={
											(draggedIndex === index ? 'recipe-ingredient-dragging ' : '') +
											(entry.kind === 'ingredient' && entry.isSectionHeader ? 'recipe-section-header-row ' : '') +
											(isIndented ? 'recipe-ingredient-indented' : '')
										}
									>
										<span className="recipe-ingredient-drag-handle" title={t('recipeForm.dragHandle.title')}>⠿</span>

										{entry.kind === 'ingredient' && entry.isSectionHeader ? (
											<input
												value={entry.sectionTitle ?? ''}
												onChange={(e) => updateSectionTitle(index, e.target.value)}
												placeholder={t('recipeForm.sectionTitle.placeholder')}
												className="recipe-section-title-input"
											/>
										) : entry.kind === 'baseRecipe' ? (
											<span className="recipe-ingredient-name">
												{entry.recipeName} {t('recipeForm.recipeSuffix')}
												{entry.quantity != null ? ` — ${entry.quantity}${entry.unit}` : ''}
											</span>
										) : (
											<span className="recipe-ingredient-name">
												{entry.ingredientName}
												{entry.form ? ` (${entry.form})` : ''}
												{entry.complement ? ` (${entry.complement})` : ''}
												{entry.quantity != null ? ` — ${entry.quantity}${entry.unit}` : ''}
											</span>
										)}

										<div className="recipe-ingredient-actions">
											{entry.kind === 'ingredient' && !entry.isSectionHeader && fryingOilName && (
												<button
													type="button"
													onClick={() => toggleFried(index)}
													title={entry.fried ? t('recipeForm.fried.marked') : t('recipeForm.fried.mark')}
													className={entry.fried ? 'recipe-ingredient-fried-active' : 'recipe-ingredient-fried'}
												>
													{entry.fried ? t('recipeForm.fried.yes') : t('recipeForm.fried.no')}
												</button>
											)}
											<button type="button" onClick={() => handleRemoveEntry(index)} title={t('recipeForm.remove.title')} className="recipe-ingredient-remove">✕</button>
										</div>
									</li>
								);
							})}
						</ul>
					);
				})()}

				<div className="recipe-ingredient-input-row">
					<div className="recipe-ingredient-input-grow">
						<SmartRecipeIngredientInput
							app={app}
							ingredientsFolder={ingredientsFolder}
							recipesFolder={recipesFolder}
							onAdd={(entry) => setEntries((prev) => [...prev, entry])}
						/>
					</div>
					<button type="button" onClick={addSection} className="recipe-add-section-button" title={t('recipeForm.addSection.title')}>
						{t('recipeForm.addSection')}
					</button>
				</div>
				<div className="recipe-frying-oil-row">
					<label>{t('recipeForm.fryingOil')}</label>
					<select value={fryingOilName} onChange={(e) => setFryingOilName(e.target.value)}>
						<option value="">{t('recipeForm.fryingOil.none')}</option>
						{listOilIngredients(app, ingredientsFolder, [], [], oilIngredientTypes).map((oilName) => (
							<option key={oilName} value={oilName}>{oilName}</option>
						))}
					</select>
				</div>
			</section>

			<section className="form-section section">
				<h4>{t('recipeForm.instructions')}</h4>
				<textarea
					value={instructions}
					onChange={(e) => setInstructions(e.target.value)}
					className="markdown-editable-textarea"
					rows={10}
				/>
			</section>

			<section className="form-section section">
				<h4>{t('recipeForm.notes')}</h4>
				<textarea
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					className="markdown-editable-textarea"
					rows={4}
				/>
			</section>

			<div style={{ height: "50px" }} />
		</div>
	);
});
