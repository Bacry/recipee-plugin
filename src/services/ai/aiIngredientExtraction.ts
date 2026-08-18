import { getProvider } from './getProvider';
import { AIProviderId, AICredentials } from './types';
import { t } from '../../i18n/strings';
import type { Language } from '../../i18n/strings';

export interface IngredientSuggestion {
	type: string;
	shopSection: string;
	densityGMl: string;
	entityWeightG: string;
	possibleForms: string;
	dietFlags: string;
	nutrition: Record<string, number> | null;
}

export interface IngredientExtractionResult {
	suggestion: IngredientSuggestion | null;
	error: string | null;
	usage?: { inputTokens: number; outputTokens: number };
}

const SYSTEM_PROMPT_TEMPLATE = (types: string[], shopSections: string[], dietFlags: string[], language: Language) => `Tu aides à remplir la fiche d'un ingrédient de cuisine. Retourne UNIQUEMENT un JSON strict, sans texte avant/après, sans balises markdown :

{
  "type": string,
  "shop_section": string,
  "density_g_ml": number | null,
  "entity_weight_g": number | null,
  "possible_forms": string[],
  "diet_flags": string[],
  "nutrition_per_100g": {
    "kcal": number, "lipids": number, "non_saturated_lipids": number,
    "glucids": number, "sugar": number, "proteins": number,
    "salt": number, "fibers": number, "cholesterol": number
  }
}

Règles :
- "type" DOIT être choisi exactement parmi cette liste : ${types.join(', ')}. Si aucun ne convient bien, choisis le plus proche.
- "shop_section" DOIT être choisi exactement parmi cette liste : ${shopSections.join(', ')}.
- "diet_flags" ne doit contenir QUE des valeurs de cette liste (peut être vide si aucune ne s'applique) : ${dietFlags.join(', ')}.
- "density_g_ml" : uniquement si l'ingrédient se mesure typiquement en volume — sinon null.
- "entity_weight_g" : uniquement si l'ingrédient se compte à l'unité — sinon null.
- "possible_forms" : formes de préparation courantes — liste vide si non pertinent.
- "nutrition_per_100g" : ta meilleure estimation, pour 100g de produit — reste une estimation générale, pas une mesure certifiée.
- Les valeurs de texte libre ("possible_forms") doivent être rédigées en ${t('ai.languageName', language)}.`;

export async function suggestIngredientFields(
	providerId: AIProviderId,
	credentials: AICredentials,
	ingredientName: string,
	knownTypes: string[],
	knownShopSections: string[],
	knownDietFlags: string[],
	language: Language = 'fr'
): Promise<IngredientExtractionResult> {
	const provider = getProvider(providerId);

	const result = await provider.complete({
		systemPrompt: SYSTEM_PROMPT_TEMPLATE(knownTypes, knownShopSections, knownDietFlags, language),
		userMessage: `Ingrédient : ${ingredientName}`,
		apiKey: credentials.apiKey,
		model: credentials.model,
	});

	if (result.error || !result.text) {
		return { suggestion: null, error: result.error };
	}

	try {
		const cleaned = result.text.replace(/```json|```/g, '').trim();
		const parsed = JSON.parse(cleaned);

		const nutrition = parsed.nutrition_per_100g && typeof parsed.nutrition_per_100g === 'object'
			? parsed.nutrition_per_100g
			: null;

		const suggestion: IngredientSuggestion = {
			type: typeof parsed.type === 'string' ? parsed.type : '',
			shopSection: typeof parsed.shop_section === 'string' ? parsed.shop_section : '',
			densityGMl: typeof parsed.density_g_ml === 'number' ? parsed.density_g_ml.toString() : '',
			entityWeightG: typeof parsed.entity_weight_g === 'number' ? parsed.entity_weight_g.toString() : '',
			possibleForms: Array.isArray(parsed.possible_forms) ? parsed.possible_forms.join(', ') : '',
			dietFlags: Array.isArray(parsed.diet_flags) ? parsed.diet_flags.join(', ') : '',
			nutrition,
		};

		return { suggestion, error: null, usage: result.usage };
	} catch (e) {
		return { suggestion: null, error: `Erreur lors du traitement de la réponse : ${e}` };
	}
}
