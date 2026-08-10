import { useState } from 'react';
import { App } from 'obsidian';
import { Recipe, RecipeIngredientEntry, RecipeBaseRecipeEntry } from '../models/recipe';
import { searchRecipeTags } from '../models/searchRecipeTags';
import { SmartRecipeIngredientInput } from './SmartRecipeIngredientInput';
import { SmartBaseRecipeInput } from './SmartBaseRecipeInput';
import { listRecipeSubfolders } from '../models/listRecipeSubfolders';
import { ParseRecipeTextModal } from './ParseRecipeTextModal';
import { forwardRef, useImperativeHandle } from 'react';
import { searchRecipeSources } from '../models/searchRecipeSources';
import { listOilIngredients } from '../models/listOilIngredients';

export interface RecipeFormHandle {
	triggerSubmit: () => void;
}

// The shape of data this form works with — mirrors Recipe, but numeric/list
// fields that need free-text editing are kept as strings until submit,
// same pattern as IngredientForm's nutrition fields (avoids the NaN trap).
export interface RecipeFormValues {
	name: string;
	baseServings: string;
	servingsLabel: string;
	preparationDurationMin: string;
	cookingDurationMin: string;
	requiresCooking: boolean;
	madeBeforeTracking: boolean;
	fryingOilName: string;
	ingredients: RecipeIngredientEntry[]; // managed by a dedicated sub-component (step G), passed through as-is here
	baseRecipes: RecipeBaseRecipeEntry[];
	instructions: string;
	notes: string;
	source: string;
	image: string;
	tags: string; // comma-separated in the form, split into an array on submit — same convention as possibleForms in IngredientForm
	totalWeightG: string;
	subfolder: string; // relative path under recipesFolder, e.g. "Cocktails" — "" means the root of recipesFolder
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
}

// Builds a completely blank form state — used only when "Create new recipe"
// is run with no templates available in the templates folder. When
// templates DO exist, the user picks one via the fuzzy selector instead,
// and this function is never called.
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

// Strips non-digit characters, same helper as IngredientForm's sanitizeNumericInput —
// duplicated here rather than shared, since it's a tiny pure function and
// importing across component files for one line isn't worth the coupling.
function sanitizeNumericInput(value: string): string {
	return value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
}

export const RecipeForm = forwardRef<RecipeFormHandle, RecipeFormProps>(function RecipeForm(
	{ app, recipesFolder, ingredientsFolder, recipeImagesFolder, anthropicApiKey,
		anthropicModel, onSubmit, initialValues, submitLabel = 'Créer la recette' },
	ref
) {
	const base = initialValues ?? emptyValues();
	const [name, setName] = useState(base.name);
	const [baseServings, setBaseServings] = useState(base.baseServings);
	const [servingsLabel, setServingsLabel] = useState(base.servingsLabel);
	const [preparationDurationMin, setPreparationDurationMin] = useState(base.preparationDurationMin);
	const [cookingDurationMin, setCookingDurationMin] = useState(base.cookingDurationMin);
	const [ingredients, setIngredients] = useState<RecipeIngredientEntry[]>(base.ingredients);
	const [baseRecipes, setBaseRecipes] = useState<RecipeBaseRecipeEntry[]>(base.baseRecipes);
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

	function handleSubmit() {
		onSubmit({
			name,
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

	// Extracts the tag currently being typed (the text after the last comma),
// so autocomplete searches only that partial word, not the whole field.
	function getCurrentTagFragment(value: string): string {
		const parts = value.split(',');
		return parts[parts.length - 1].trim();
	}

// Replaces the in-progress tag fragment with the picked suggestion, keeping
// any already-completed tags before it intact.
	function applyTagSuggestion(suggestion: string) {
		const parts = tags.split(',');
		parts[parts.length - 1] = ' ' + suggestion;
		setTags(parts.join(',').replace(/^,\s*/, '') + ', ');
		setTagSuggestions([]);
	}

	function handleRemoveIngredient(index: number) {
		setIngredients((prev) => prev.filter((_, i) => i !== index));
	}

	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	function reorderIngredients(fromIndex: number, toIndex: number) {
		setIngredients((prev) => {
			const next = [...prev];
			const [moved] = next.splice(fromIndex, 1);
			next.splice(toIndex, 0, moved);
			return next;
		});
	}

	function toggleFried(index: number) {
		setIngredients((prev) =>
			prev.map((entry, i) => (i === index ? { ...entry, fried: !entry.fried } : entry))
		);
	}

	function addSection() {
		setIngredients((prev) => [
			...prev,
			{ ingredientName: '', quantity: null, unit: '', isSectionHeader: true, sectionTitle: '' },
		]);
	}

	function updateSectionTitle(index: number, title: string) {
		setIngredients((prev) =>
			prev.map((entry, i) => (i === index ? { ...entry, sectionTitle: title } : entry))
		);
	}

	function handleRemoveBaseRecipe(index: number) {
		setBaseRecipes((prev) => prev.filter((_, i) => i !== index));
	}

	// Copies a selected image file into the recipe images folder, handling
// name collisions by appending a numeric suffix, then fills the image field
// with just the filename (never a full path — resolveImagePath in
// RecipeDetails searches the whole vault by name).
	// Copies a selected image file into the recipe images folder, renamed to
// match the recipe's name (falls back to the original filename if the
// "Nom" field is still empty). Handles name collisions with a numeric suffix.
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

	// Applies a full RecipeFormValues object to every individual useState field —
// used after Claude successfully extracts a recipe from pasted text, to
// prefill the already-open form without having to remount the component.
	function applyExtractedValues(values: RecipeFormValues) {
		setName(values.name);
		setBaseServings(values.baseServings);
		setServingsLabel(values.servingsLabel);
		setPreparationDurationMin(values.preparationDurationMin);
		setCookingDurationMin(values.cookingDurationMin);
		setRequiresCooking(values.requiresCooking);
		setMadeBeforeTracking(values.madeBeforeTracking);
		setIngredients(values.ingredients);
		setBaseRecipes(values.baseRecipes);
		setInstructions(values.instructions);
		setNotes(values.notes);
		setSource(values.source);
		setImage(values.image);
		setTags(values.tags);
		setTotalWeightG(values.totalWeightG);
		setFryingOilName(values.fryingOilName);
//		setSubfolder(values.subfolder);
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
							<input
								value={cookingDurationMin}
								onChange={(e) => setCookingDurationMin(sanitizeNumericInput(e.target.value))}
								disabled={!requiresCooking}
								placeholder="durée en min"
								className="recipe-cooking-duration-input"
							/>
							<input
								value={totalWeightG}
								onChange={(e) => setTotalWeightG(sanitizeNumericInput(e.target.value))}
								disabled={!requiresCooking}
								placeholder="poids après cuisson (g)"
								className="recipe-cooking-weight-input"
							/>
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
						<label>Tags (séparés par des virgules)</label>
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
				<h4>Recettes de base</h4>

				{baseRecipes.length > 0 && (
					<ul>
						{baseRecipes.map((entry, index) => (
							<li key={index}>
								<span>{entry.recipeName} — {entry.quantity}{entry.unit}</span>
								<button type="button" onClick={() => handleRemoveBaseRecipe(index)} title="Retirer" className="recipe-ingredient-remove">✕</button>
							</li>
						))}
					</ul>
				)}

				<SmartBaseRecipeInput
					app={app}
					recipesFolder={recipesFolder}
					onAdd={(entry) => setBaseRecipes((prev) => [...prev, entry])}
				/>
			</section>

			<section className="ingredient-form-section">
				<h4>Friture</h4>
				<div className="recipe-frying-oil-row">
					<label>Huile utilisée</label>
					<select value={fryingOilName} onChange={(e) => setFryingOilName(e.target.value)}>
						<option value="">-- Aucune (pas de friture) --</option>
						{listOilIngredients(app, ingredientsFolder, [], []).map((oilName) => (
							<option key={oilName} value={oilName}>{oilName}</option>
						))}
					</select>
				</div>
			</section>

			<section className="ingredient-form-section">
				<h4>Ingrédients</h4>
				<button type="button" onClick={addSection} className="recipe-add-section-button">
					+ Ajouter une section
				</button>
				{ingredients.length > 0 && (() => {
					let currentlyInSection = false;
					return (
						<ul>
							{ingredients.map((entry, index) => {
								if (entry.isSectionHeader) {
									currentlyInSection = true;
								}
								const isIndented = !entry.isSectionHeader && currentlyInSection;

								return (
							<li
								key={index}
								draggable
								onDragStart={() => setDraggedIndex(index)}
								onDragOver={(e) => e.preventDefault()}
								onDrop={(e) => {
									e.preventDefault();
									if (draggedIndex === null || draggedIndex === index) return;
									reorderIngredients(draggedIndex, index);
									setDraggedIndex(null);
								}}
								onDragEnd={() => setDraggedIndex(null)}
								className={
									(draggedIndex === index ? 'recipe-ingredient-dragging ' : '') +
									(entry.isSectionHeader ? 'recipe-section-header-row ' : '') +
									(isIndented ? 'recipe-ingredient-indented' : '')
								}
							>
								<span className="recipe-ingredient-drag-handle" title="Glisser pour réordonner">⠿</span>

								{entry.isSectionHeader ? (
									<input
										value={entry.sectionTitle ?? ''}
										onChange={(e) => updateSectionTitle(index, e.target.value)}
										placeholder="Titre de la section (ex : Pour la pâte)"
										className="recipe-section-title-input"
									/>
								) : (
									<span className="recipe-ingredient-name">
				{entry.ingredientName}
										{entry.complement ? ` (${entry.complement})` : ''}
										{entry.quantity != null ? ` — ${entry.quantity}${entry.unit}` : ''}
			</span>
								)}

								<div className="recipe-ingredient-actions">
									{!entry.isSectionHeader && fryingOilName && (
										<button
											type="button"
											onClick={() => toggleFried(index)}
											title={entry.fried ? 'Marqué comme frit' : 'Marquer comme frit'}
											className={entry.fried ? 'recipe-ingredient-fried-active' : 'recipe-ingredient-fried'}
										>
											{entry.fried ? 'Frit' : 'Pas frit'}
										</button>
									)}
									<button type="button" onClick={() => handleRemoveIngredient(index)} title="Retirer" className="recipe-ingredient-remove">✕</button>
								</div>
							</li>
								);
							})}
						</ul>
					);
				})()}

				<SmartRecipeIngredientInput
					app={app}
					ingredientsFolder={ingredientsFolder}
					onAdd={(entry) => setIngredients((prev) => [...prev, entry])}
				/>
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
