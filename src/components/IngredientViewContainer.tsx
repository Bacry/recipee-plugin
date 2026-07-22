import { useState } from 'react';
import { App, Notice, TFile } from 'obsidian';
import { Ingredient } from '../models/Ingredient';
import { IngredientDetails } from './IngredientDetails';
import { IngredientForm, IngredientFormValues } from './IngredientForm';
import { ingredientToFormValues } from '../models/ingredientToFormValues';
import { buildIngredientMarkdown } from '../models/buildIngredientMarkdown';

interface IngredientViewContainerProps {
	app: App;
	file: TFile; // needed here now, to know which file to overwrite on save
	ingredient: Ingredient;
	warnings: string[];
	ingredientTypes: string[];
	shopSections: string[];
	usdaApiKey: string;
	readOnly: boolean; // when true, hides the "Modifier" button entirely
	onClose: () => void; // renders a close/back button next to the name
}

// This component owns the read/edit toggle for a single ingredient note.
// It's a real React function component (not a class), so it can use useState —
// something the IngredientView class itself cannot do directly.
export function IngredientViewContainer({
											app,
											file,
											ingredient,
											warnings,
											ingredientTypes,
											shopSections,
											usdaApiKey,
											readOnly,
											onClose,
										}: IngredientViewContainerProps) {
	const [isEditing, setIsEditing] = useState(false);

	async function handleSave(values: IngredientFormValues) {
		const content = buildIngredientMarkdown(values);
		await app.vault.modify(file, content);
		new Notice(`Ingrédient "${values.name}" mis à jour.`);
		setIsEditing(false);
	}

	// Called when the edit form is submitted: overwrite the existing file instead of creating a new one.
	async function handleSave(values: IngredientFormValues) {
		const content = buildIngredientMarkdown(values);
		await app.vault.modify(file, content);
		new Notice(`Ingrédient "${values.name}" mis à jour.`);
		setIsEditing(false);
		// Note: this component doesn't auto-refresh the "ingredient" prop after save —
		// the parent view still holds the previously-parsed data until it's reopened
		// or Obsidian's metadata cache triggers a re-render upstream.
	}

	if (isEditing) {
		return (
			<IngredientForm
				app={app}
				onSubmit={handleSave}
				ingredientTypes={ingredientTypes}
				shopSections={shopSections}
				usdaApiKey={usdaApiKey}
				initialValues={ingredientToFormValues(ingredient)}
				submitLabel="Enregistrer les modifications"
				onCancel={() => setIsEditing(false)}
			/>
		);
	}

	return (
		<div>
			{warnings.length > 0 && (
				<ul className="ingredient-validation-warnings">
					{warnings.map((warning, index) => (
						<li key={index}>{warning}</li>
					))}
				</ul>
			)}

			<IngredientDetails
				name={ingredient.name}
				type={ingredient.type}
				shopSection={ingredient.shop_section}
				densityGMl={ingredient.density_g_ml}
				entityWeightG={ingredient.entity_weight_g}
				brand={ingredient.brand}
				possibleForms={ingredient.possible_forms}
				nutrition={ingredient.nutrition_per_100g}
				onEdit={readOnly ? undefined : () => setIsEditing(true)}
				onClose={onClose}
			/>
		</div>
	);
}
