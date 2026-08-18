import { App } from 'obsidian';
import { MyPluginSettings } from '../settings';
import { suggestIngredientFields } from '../services/ai/aiIngredientExtraction';
import { createIngredient } from './ingredientPersistence';
import { removeOtherItemIfPresent } from './otherItemsNote';
import { IngredientFormValues } from '../components/IngredientForm';
import { NutritionPer100g } from './Ingredient';

const BATCH_SIZE = 5;

export interface BulkGenerationResult {
	successCount: number;
	failedNames: string[];
	totalInputTokens: number;
	totalOutputTokens: number;
}

const emptyNutrition: NutritionPer100g = {
	kcal: 0, lipids: 0, non_saturated_lipids: 0, glucids: 0,
	sugar: 0, proteins: 0, salt: 0, fibers: 0, cholesterol: 0,
};

// Generates and writes an ingredient sheet for each given name, one AI call
// per ingredient (kept simple and robust rather than batching multiple
// ingredients into a single prompt — see the batching discussion: grouping
// requests in chunks of BATCH_SIZE limits how many run in immediate
// succession, without the fragility of asking the model for several
// ingredients' worth of JSON in one response). Every created sheet is
// flagged needs_review: true — nothing here is auto-validated. Failures are
// collected and skipped individually rather than aborting the whole run.
export async function generateIngredientsInBulk(
	app: App,
	settings: MyPluginSettings,
	names: string[],
	onProgress: (current: number, total: number, name: string) => void
): Promise<BulkGenerationResult> {
	const failedNames: string[] = [];
	let successCount = 0;
	let current = 0;
	let totalInputTokens = 0;
	let totalOutputTokens = 0;

	for (let batchStart = 0; batchStart < names.length; batchStart += BATCH_SIZE) {
		const batch = names.slice(batchStart, batchStart + BATCH_SIZE);

		for (const name of batch) {
			current++;
			onProgress(current, names.length, name);

			try {
				const result = await suggestIngredientFields(
					settings.aiProvider,
					settings.aiCredentials[settings.aiProvider],
					name,
					settings.ingredientTypes,
					settings.shopSections,
					settings.dietFlags,
					settings.language
				);

				if (result.usage) {
					totalInputTokens += result.usage.inputTokens;
					totalOutputTokens += result.usage.outputTokens;
				}

				if (result.error || !result.suggestion) {
					failedNames.push(name);
					continue;
				}

				if (result.error || !result.suggestion) {
					failedNames.push(name);
					continue;
				}

				const s = result.suggestion;
				const values: IngredientFormValues = {
					name,
					nameEn: '',
					type: s.type,
					shopSection: s.shopSection,
					densityGMl: s.densityGMl,
					entityWeightG: s.entityWeightG,
					possibleForms: s.possibleForms,
					brand: '',
					dietFlags: s.dietFlags,
					juiceYieldMl: '',
					needsReview: true,
					nutrition: s.nutrition
						? (s.nutrition as unknown as NutritionPer100g)
						: emptyNutrition,
				};

				const file = await createIngredient({
					app,
					ingredientsFolder: settings.ingredientsFolder,
					values,
				});

				await removeOtherItemIfPresent(app, settings.otherItemsNotePath, file.basename);

				successCount++;
			} catch (e) {
				console.error(`Failed to generate ingredient "${name}":`, e);
				failedNames.push(name);
			}
		}
	}

	return { successCount, failedNames, totalInputTokens, totalOutputTokens };
}
