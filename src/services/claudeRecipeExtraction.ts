import { App, requestUrl, TFile } from 'obsidian';
import { RecipeFormValues } from '../components/RecipeForm';

// Collects the basenames of every known ingredient file, to help Claude
// reuse exact existing names when the pasted text refers to something we
// already have a fiche for (rather than inventing a slightly different name).
function getKnownIngredientNames(app: App, ingredientsFolder: string): string[] {
	return app.vault
		.getMarkdownFiles()
		.filter((f: TFile) => f.path.startsWith(ingredientsFolder + '/'))
		.map((f) => f.basename);
}

const SYSTEM_PROMPT = `Tu extrais une recette de cuisine à partir d'un texte libre, et tu la retournes au format JSON strict suivant, sans aucun texte avant ou après le JSON, sans balises markdown :

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
- "unit" doit être une unité courte parmi: "g", "kg", "l", "dl", "cl", "ml", "cs", "cc", "dash", ou une chaîne vide "" si l'ingrédient se compte à l'unité (ex: "3 oeufs" → unit: "").
- "quantity" est null uniquement si aucune quantité n'est précisée dans le texte (ex: "sel à volonté").
- "instructions" est un bloc markdown unique, avec des tirets "-" pour les étapes, et éventuellement des titres "####" si le texte distingue plusieurs phases (préparation, cuisson...).
- Si un nom d'ingrédient de la liste "ingrédients connus" fournie ci-dessous correspond clairement à un ingrédient du texte, réutilise EXACTEMENT ce nom (même orthographe, mêmes accents) plutôt que d'en inventer un autre.
- "tags" : 1 à 3 tags pertinents en minuscule (ex: "dessert", "entrée", "végétarien").
- Les durées sont en minutes ; laisse à null si non précisées.`;

export interface ExtractionResult {
	values: RecipeFormValues | null;
	error: string | null;
}

export async function extractRecipeFromText(
	app: App,
	apiKey: string,
	model: string,
	ingredientsFolder: string,
	rawText: string
): Promise<ExtractionResult> {
	if (apiKey.trim() === '') {
		return { values: null, error: 'Aucune clé API Anthropic configurée dans les settings.' };
	}

	const knownIngredients = getKnownIngredientNames(app, ingredientsFolder);

	const userMessage = `Ingrédients connus (réutilise ces noms exacts si pertinent) :
${knownIngredients.join(', ')}

Texte de la recette à extraire :
${rawText}`;

	try {
		const response = await requestUrl({
			url: 'https://api.anthropic.com/v1/messages',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01',
			},
			body: JSON.stringify({
				model,
				max_tokens: 2000,
				system: SYSTEM_PROMPT,
				messages: [{ role: 'user', content: userMessage }],
			}),
		});

		const data = response.json;
		const textBlock = data.content?.find((block: any) => block.type === 'text');
		if (!textBlock) {
			return { values: null, error: 'Réponse inattendue de l\'API (pas de texte trouvé).' };
		}

		// Defensive: strip markdown code fences if Claude wrapped the JSON despite instructions.
		const cleaned = textBlock.text.replace(/```json|```/g, '').trim();
		const parsed = JSON.parse(cleaned);

		const values: RecipeFormValues = {
			name: typeof parsed.name === 'string' ? parsed.name : '',
			baseServings: typeof parsed.base_servings === 'number' ? parsed.base_servings.toString() : '',
			servingsLabel: typeof parsed.servings_label === 'string' ? parsed.servings_label : '',
			preparationDurationMin: typeof parsed.preparation_duration_min === 'number' ? parsed.preparation_duration_min.toString() : '',
			cookingDurationMin: typeof parsed.cooking_duration_min === 'number' ? parsed.cooking_duration_min.toString() : '',
			ingredients: Array.isArray(parsed.ingredients)
				? parsed.ingredients.map((i: any) => ({
					ingredientName: i.ingredient_name ?? '',
					quantity: typeof i.quantity === 'number' ? i.quantity : null,
					unit: typeof i.unit === 'string' ? i.unit : '',
					complement: i.complement || undefined,
					form: i.form || undefined,
				}))
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
		return { values: null, error: `Erreur lors de l'appel à l'API : ${e}` };
	}
}
