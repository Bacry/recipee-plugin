import { App, TFile } from 'obsidian';
import { RecipeFormValues } from '../../components/RecipeForm';
import { getProvider } from './getProvider';
import { AIProviderId, AICredentials } from './types';
import { t } from '../../i18n/strings';
import type { Language } from '../../i18n/strings';
import { findUnit } from '../../models/units';
import { normalizeParsedQuantity } from '../../models/normalizeQuantityUnit';

// Collects the basenames of every known ingredient file, to help the AI
// reuse exact existing names when the text refers to something we already
// have a fiche for (rather than inventing a slightly different name).
function getKnownIngredientNames(app: App, ingredientsFolder: string): string[] {
	return app.vault
		.getMarkdownFiles()
		.filter((f: TFile) => f.path.startsWith(ingredientsFolder + '/'))
		.map((f) => f.basename);
}

const SYSTEM_PROMPT = (language: Language) => `Tu extrais une recette de cuisine à partir d'un texte libre (ou d'une page web dont l'URL t'est fournie), et tu la retournes au format JSON strict suivant, sans aucun texte avant ou après le JSON, sans balises markdown :

{
  "name": string,
  "base_servings": number,
  "servings_label": string,
  "preparation_duration_min": number | null,
  "cooking_duration_min": number | null,
  "ingredients": [
    { "ingredient_name": string, "quantity": number | null, "unit": string, "complement": string | null, "form": string | null }
  ],
  "instructions": string,
  "tags": string[]
}

Règles :
- "unit" doit être une unité courte parmi: "g", "kg", "l", "dl", "cl", "ml", "cs", "cc", "trait" (système métrique), "cup", "tbsp", "tsp", "oz", "lb", "dash" (système US), ou une chaîne vide "" si l'ingrédient se compte à l'unité (ex: "3 oeufs" → unit: "") ou une chaîne vide "" si l'ingrédient se compte à l'unité (ex: "3 oeufs" → unit: ""). Choisis l'unité qui correspond le mieux au texte source.  
- "servings_label" doit être UNIQUEMENT le mot décrivant l'unité de portion sans nombre (par exemple l'équivalent de "persons", "servings", "cookies" ou "glasses" DANS LA LANGUE DE SORTIE demandée ci-dessous — jamais en anglais si une autre langue est demandée)".
- "quantity" est null uniquement si aucune quantité n'est précisée dans le texte (ex: "sel à volonté").
- "instructions" est un bloc markdown unique, avec des tirets "-" pour les étapes, organisées sous un ou plusieurs titres "####" (ex: "#### Préparation", "#### Cuisson", "#### Dressage" — utilise autant de titres que le texte source distingue de phases). Il DOIT y avoir AU MOINS un titre "####" dans "instructions", même si le texte source ne décrit qu'une seule phase (dans ce cas, un simple "#### Préparation" au-dessus de toutes les étapes suffit).
- Si un nom d'ingrédient de la liste "ingrédients connus" fournie ci-dessous correspond clairement à un ingrédient du texte, réutilise EXACTEMENT ce nom (même orthographe, mêmes accents) plutôt que d'en inventer un autre.
- "tags" : 1 à 3 tags pertinents en minuscule (ex: "dessert", "entrée", "plat", "patisserie", "asiatique", "apéro", "tarte", "soupe", "cocktail").
- Les durées sont en minutes ; laisse à null si non précisées.
- Les champs de texte libre ("name", "servings_label", "instructions", "tags") doivent être rédigés en ${t('ai.languageName', language)} — sauf le nom d'un ingrédient déjà connu que tu réutilises tel quel, même si son orthographe est dans une autre langue.`;

export interface ExtractionResult {
	values: RecipeFormValues | null;
	error: string | null;
}

export async function extractRecipeFromText(
	providerId: AIProviderId,
	credentials: AICredentials,
	app: App,
	ingredientsFolder: string,
	rawText: string,
	language: Language = 'fr',
	unitSystem: 'metric' | 'us' = 'metric'
): Promise<ExtractionResult> {
	const provider = getProvider(providerId);
	const knownIngredients = getKnownIngredientNames(app, ingredientsFolder);

	const userMessage = `Ingrédients connus (réutilise ces noms exacts si pertinent) :
${knownIngredients.join(', ')}

Texte de la recette à extraire :
${rawText}`;

	const result = await provider.complete({
		systemPrompt: SYSTEM_PROMPT(language),
		userMessage,
		apiKey: credentials.apiKey,
		model: credentials.model,
	});

	if (result.error || !result.text) {
		return { values: null, error: result.error };
	}

	try {
		const cleaned = result.text.replace(/```json|```/g, '').trim();
		const parsed = JSON.parse(cleaned);

		const values: RecipeFormValues = {
			name: typeof parsed.name === 'string' ? parsed.name : '',
			baseServings: typeof parsed.base_servings === 'number' ? parsed.base_servings.toString() : '',
			servingsLabel: typeof parsed.servings_label === 'string' ? parsed.servings_label : '',
			preparationDurationMin: typeof parsed.preparation_duration_min === 'number' ? parsed.preparation_duration_min.toString() : '',
			cookingDurationMin: typeof parsed.cooking_duration_min === 'number' ? parsed.cooking_duration_min.toString() : '',
			requiresCooking: false,
			madeBeforeTracking: false,
			isBaseRecipe: false,
			fryingOilName: '',
			ingredients: Array.isArray(parsed.ingredients)
				? parsed.ingredients.map((i: any) => {
					const rawUnit = typeof i.unit === 'string' ? i.unit : '';
					const rawQuantity = typeof i.quantity === 'number' ? i.quantity : null;
					const ingredientName = i.ingredient_name ?? '';

					if (rawQuantity === null) {
						return {
							ingredientName,
							quantity: null,
							unit: rawUnit,
							complement: i.complement || undefined,
							form: i.form || undefined,
						};
					}

					const parsedUnit = rawUnit === '' ? null : findUnit(rawUnit);
					const normalized = normalizeParsedQuantity(
						app,
						ingredientsFolder,
						ingredientName,
						{ quantity: rawQuantity, unit: parsedUnit },
						unitSystem
					);

					return {
						ingredientName,
						quantity: normalized.quantity,
						unit: normalized.unit?.name ?? '',
						complement: i.complement || undefined,
						form: i.form || undefined,
					};
				})
				: [],
			baseRecipes: [],
			instructions: typeof parsed.instructions === 'string' ? parsed.instructions : '',
			notes: '',
			source: '',
			image: '',
			tags: Array.isArray(parsed.tags) ? parsed.tags.join(', ') : '',
			totalWeightG: '',
			subfolder: '',
		};

		return { values, error: null };
	} catch (e) {
		return { values: null, error: `Erreur lors du traitement de la réponse : ${e}` };
	}
}
