import { useState } from 'react';
import { App, Notice, TFile } from 'obsidian';
import { Ingredient } from '../models/Ingredient';
import { IngredientDetails } from './IngredientDetails';
import { IngredientForm, IngredientFormValues } from './IngredientForm';
import { ingredientToFormValues } from '../models/ingredientToFormValues';
import { buildIngredientMarkdown } from '../models/buildIngredientMarkdown';

interface IngredientViewContainerProps {
	app: App;
	file: TFile;
	ingredient: Ingredient;
	warnings: string[];
	ingredientTypes: string[];
	shopSections: string[];
	usdaApiKey: string;
	ingredientsFolder: string;
	readOnly: boolean;
	usedInRecipes: string[];
	onRecipeClick: (recipeName: string) => void;
	onClose: () => void;
}

export function IngredientViewContainer({
											app,
											file,
											ingredient,
											warnings,
											ingredientTypes,
											shopSections,
											usdaApiKey,
											ingredientsFolder,
											readOnly,
											usedInRecipes,
											onRecipeClick,
											onClose,
										}: IngredientViewContainerProps) {
	const [isEditing, setIsEditing] = useState(false);

	// Called when the edit form is submitted: moves the file if its type (and
	// thus its target subfolder) changed, then overwrites its content.
	async function handleSave(values: IngredientFormValues) {
		const targetFolder = `${ingredientsFolder}/${values.type}`;
		if (!app.vault.getAbstractFileByPath(targetFolder)) {
			await app.vault.createFolder(targetFolder);
		}

		const newPath = `${targetFolder}/${file.basename}.md`;

		if (newPath !== file.path) {
			await app.vault.rename(file, newPath);
		}

		const content = buildIngredientMarkdown(values);
		await app.vault.modify(file, content);
		new Notice(`Ingrédient "${values.name}" mis à jour.`);
		setIsEditing(false);
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
				usedInRecipes={usedInRecipes}
				onRecipeClick={onRecipeClick}
				onEdit={readOnly ? undefined : () => setIsEditing(true)}
				onClose={onClose}
			/>
		</div>
	);
}
