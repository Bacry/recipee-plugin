import { useState } from 'react';
import { App } from 'obsidian';
import { Recipe, RecipeIngredientEntry, RecipeBaseRecipeEntry } from '../models/recipe';
import { searchRecipeTags } from '../models/searchRecipeTags';
import { SmartRecipeIngredientInput } from './SmartRecipeIngredientInput';
import { SmartBaseRecipeInput } from './SmartBaseRecipeInput';


// The shape of data this form works with — mirrors Recipe, but numeric/list
// fields that need free-text editing are kept as strings until submit,
// same pattern as IngredientForm's nutrition fields (avoids the NaN trap).
export interface RecipeFormValues {
	name: string;
	baseServings: string;
	servingsLabel: string;
	preparationDurationMin: string;
	cookingDurationMin: string;
	ingredients: RecipeIngredientEntry[]; // managed by a dedicated sub-component (step G), passed through as-is here
	baseRecipes: RecipeBaseRecipeEntry[];
	instructions: string;
	notes: string;
	source: string;
	image: string;
	tags: string; // comma-separated in the form, split into an array on submit — same convention as possibleForms in IngredientForm
	totalWeightG: string;
}

interface RecipeFormProps {
	app: App;
	recipesFolder: string;
	ingredientsFolder: string;
	defaultInstructions: string;
	defaultValueOverrides?: Partial<RecipeFormValues>;
	onSubmit: (values: RecipeFormValues) => void;
	onClose?: () => void;
	initialValues?: RecipeFormValues;
	submitLabel?: string;
}

// Builds a blank form state for creating a brand new recipe — instructions
// starts prefilled with the default template rather than empty, so the user
// has a starting skeleton to work from.
// Partial overrides applied on top of the blank defaults — used by the
// "Create new cocktail" command to prefill baseServings, servingsLabel,
// preparationDurationMin, and tags, while everything else starts empty.
function emptyValues(defaultInstructions: string, overrides?: Partial<RecipeFormValues>): RecipeFormValues {
	return {
		name: '',
		baseServings: '4',
		servingsLabel: '',
		preparationDurationMin: '',
		cookingDurationMin: '',
		ingredients: [],
		baseRecipes: [],
		instructions: defaultInstructions,
		notes: '',
		source: '',
		image: '',
		tags: '',
		totalWeightG: '',
		...overrides,
	};
}

// Strips non-digit characters, same helper as IngredientForm's sanitizeNumericInput —
// duplicated here rather than shared, since it's a tiny pure function and
// importing across component files for one line isn't worth the coupling.
function sanitizeNumericInput(value: string): string {
	return value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
}

export function RecipeForm({ app, recipesFolder, ingredientsFolder, defaultInstructions, defaultValueOverrides, onSubmit, onClose, initialValues, submitLabel = 'Créer la recette' }: RecipeFormProps) {
	const base = initialValues ?? emptyValues(defaultInstructions, defaultValueOverrides);
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

	function handleSubmit() {
		onSubmit({
			name,
			baseServings,
			servingsLabel,
			preparationDurationMin,
			cookingDurationMin,
			ingredients,
			baseRecipes,
			instructions,
			notes,
			source,
			image,
			tags,
			totalWeightG,
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
		setTags(parts.join(',').replace(/^,\s*/, ''));
		setTagSuggestions([]);
	}

	function handleRemoveIngredient(index: number) {
		setIngredients((prev) => prev.filter((_, i) => i !== index));
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
		const folder = `${recipesFolder}/Images`;

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

	return (
		<div className="ingredient-form">
			<div className="ingredient-details-header">
				<h3>{initialValues ? 'Modifier la recette' : 'Nouvelle recette'}</h3>
				{onClose && <button onClick={onClose} title="Fermer">✕</button>}
			</div>

			<section className="ingredient-form-section">
				<h4>Informations générales</h4>

				<div className="ingredient-form-field">
					<label>Nom</label>
					<input value={name} onChange={(e) => setName(e.target.value)} />
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
						<label>Cuisson (min)</label>
						<input
							value={cookingDurationMin}
							onChange={(e) => setCookingDurationMin(sanitizeNumericInput(e.target.value))}
						/>
					</div>
					<div className="ingredient-form-field">
						<label>Poids total mesuré (g, optionnel)</label>
						<input
							value={totalWeightG}
							onChange={(e) => setTotalWeightG(sanitizeNumericInput(e.target.value))}
							placeholder="ex : 240"
						/>
					</div>
				</div>

				<div className="ingredient-form-field">
					<label>Source (texte libre ou URL)</label>
					<input value={source} onChange={(e) => setSource(e.target.value)} />
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
				<h4>Ingrédients</h4>

				{ingredients.length > 0 && (
					<ul>
						{ingredients.map((entry, index) => (
							<li key={index}>
	<span>
		{entry.ingredientName}
		{entry.complement ? ` (${entry.complement})` : ''}
		{entry.quantity != null ? ` — ${entry.quantity}${entry.unit}` : ''}
	</span>
								<button type="button" onClick={() => handleRemoveIngredient(index)} title="Retirer" className="recipe-ingredient-remove">✕</button>
							</li>
						))}
					</ul>
				)}

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

			<div className="ingredient-form-actions">
				<button className="ingredient-form-submit" onClick={handleSubmit}>{submitLabel}</button>
			</div>
		</div>
	);
}
