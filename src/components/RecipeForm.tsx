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
	anthropicApiKey: string;
	anthropicModel: string;
	onSubmit: (values: RecipeFormValues) => void;
	initialValues?: RecipeFormValues;
	submitLabel?: string;
	oilIngredientTypes: string[];
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
		ingredients: [],
		baseRecipes: [],
		instructions: '',
		notes: '',
		source: '',
		image: '',
		tags: '',
		subfolder: '',
		fryingOilName: '',
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
	{ app, recipesFolder, ingredientsFolder, recipeImagesFolder, anthropicApiKey,
		anthropicModel, onSubmit, initialValues, submitLabel = 'Créer la recette', oilIngredientTypes },
	ref
) {
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

		onSubmit({			name,
			baseServings,
			servingsLabel,
			preparationDurationMin,
			cookingDurationMin,
			requiresCooking,
			madeBeforeTracking,
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
		new ParseRecipeTextModal(app, anthropicApiKey, anthropicModel, ingredientsFolder, (values) => {
			applyExtractedValues(values);
		}).open();
	}

	useImperativeHandle(ref, () => ({
		triggerSubmit: handleSubmit,
	}));

	return (
		<div className="ingredient-form">

			<div className="ingredient-recipe-form-footer">
				<button type="button" onClick={openParseTextModal} className="ingredient-recipe-form-submit">
					Extraire les informations depuis un texte à l'aide de Claude
				</button>
			</div>

			<section className="ingredient-form-section">
				<h4>Informations générales</h4>

				<div className="ingredient-form-field ingredient-form-field-wide">
					<label>Nom</label>
					<input value={name} onChange={(e) => setName(e.target.value)} />
				</div>
				<div className="recipe-made-before-row">
					<label>Recette déjà réalisée (dates inconnues)</label>
					<input
						type="checkbox"
						checked={madeBeforeTracking}
						onChange={(e) => setMadeBeforeTracking(e.target.checked)}
						className="recipe-made-before-checkbox"
					/>
				</div>
				<div className="ingredient-form-grid">
					<div className="ingredient-form-field">
						<label>Portions de base</label>
						<input
							value={baseServings}
							onChange={(e) => setBaseServings(sanitizeNumericInput(e.target.value))}
						/>
					</div>

					<div className="ingredient-form-field">
						<label>Unité de portion (ex : crèmes, parts)</label>
						<input value={servingsLabel} onChange={(e) => setServingsLabel(e.target.value)} />
					</div>

					<div className="ingredient-form-field">
						<label>Préparation (min)</label>
						<input
							value={preparationDurationMin}
							onChange={(e) => setPreparationDurationMin(sanitizeNumericInput(e.target.value))}
						/>
					</div>

					<div className="ingredient-form-field">
						<label>Nécessite cuisson</label>
						<div className="recipe-cooking-row">
							<input
								type="checkbox"
								checked={requiresCooking}
								onChange={(e) => setRequiresCooking(e.target.checked)}
								className="recipe-cooking-checkbox"
							/>
							<span className="recipe-cooking-duration-wrapper">
								<input
									value={cookingDurationMin}
									onChange={(e) => setCookingDurationMin(sanitizeNumericInput(e.target.value))}
									disabled={!requiresCooking}
									placeholder="Temps"
									className="recipe-cooking-duration-input"
								/>
							</span>
							<span className="recipe-cooking-weight-wrapper">
								<input
									value={totalWeightG}
									onChange={(e) => setTotalWeightG(sanitizeNumericInput(e.target.value))}
									disabled={!requiresCooking}
									placeholder="Poids"
									className="recipe-cooking-weight-input"
								/>
							</span>
						</div>
					</div>

					<div className="ingredient-form-field">
						<label>Sous-dossier</label>
						<select value={subfolder} onChange={(e) => setSubfolder(e.target.value)}>
							<option value="">-- Racine --</option>
							{listRecipeSubfolders(app, recipesFolder).map((folder) => (
								<option key={folder} value={folder}>{folder}</option>
							))}
						</select>
					</div>

					<div className="ingredient-form-field">
						<label>Image</label>
						<div className="usda-search-row">
							<input value={image} onChange={(e) => setImage(e.target.value)} placeholder="ex : crème brûlée.png" />
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
								Choisir
							</button>
						</div>
					</div>
				</div>

				<div className="ingredient-form-row-tags-source">
					<div className="ingredient-form-field usda-search-wrapper">
						<label>Tags</label>
						<input
							value={tags}
							onChange={(e) => handleTagsChange(e.target.value)}
							onKeyDown={handleTagsKeyDown}
							placeholder="ex : dessert, sans gluten"
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

					<div className="ingredient-form-field usda-search-wrapper ingredient-form-field-source">
						<label>Source (texte libre ou URL)</label>
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
			</section>

			<section className="ingredient-form-section">
				<h4>Ingrédients et recettes de base</h4>
				{entries.length === 0 && (
					<p className="recipe-empty-entries">Aucun ingrédient ou recettes de base pour l'instant</p>
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
										<span className="recipe-ingredient-drag-handle" title="Glisser pour réordonner">⠿</span>

										{entry.kind === 'ingredient' && entry.isSectionHeader ? (
											<input
												value={entry.sectionTitle ?? ''}
												onChange={(e) => updateSectionTitle(index, e.target.value)}
												placeholder="Titre de la section (ex : Pour la pâte)"
												className="recipe-section-title-input"
											/>
										) : entry.kind === 'baseRecipe' ? (
											<span className="recipe-ingredient-name">
												{entry.recipeName} (recette)
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
													title={entry.fried ? 'Marqué comme frit' : 'Marquer comme frit'}
													className={entry.fried ? 'recipe-ingredient-fried-active' : 'recipe-ingredient-fried'}
												>
													{entry.fried ? 'Frit' : 'Pas frit'}
												</button>
											)}
											<button type="button" onClick={() => handleRemoveEntry(index)} title="Retirer" className="recipe-ingredient-remove">✕</button>
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
					<button type="button" onClick={addSection} className="recipe-add-section-button" title="Ajouter une section">
						+ section
					</button>
				</div>
				<div className="recipe-frying-oil-row">
					<label>Huile de friture</label>
					<select value={fryingOilName} onChange={(e) => setFryingOilName(e.target.value)}>
						<option value="">Pas de friture</option>
						{listOilIngredients(app, ingredientsFolder, [], [], oilIngredientTypes).map((oilName) => (
							<option key={oilName} value={oilName}>{oilName}</option>
						))}
					</select>
				</div>
			</section>

			<section className="ingredient-form-section">
				<h4>Instructions</h4>
				<textarea
					value={instructions}
					onChange={(e) => setInstructions(e.target.value)}
					className="markdown-editable-textarea"
					rows={10}
				/>
			</section>

			<section className="ingredient-form-section">
				<h4>Notes</h4>
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
