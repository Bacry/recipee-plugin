export type Language = 'fr' | 'en';

interface StringEntry {
	fr: string;
	en: string;
}

// One entry per translatable string, both languages together — easier to
// keep in sync than two separate per-language blocks. Grouped by source
// file (see the comment above each group) to make it easy to find where a
// given string is actually used.
const STRINGS: Record<string, StringEntry> = {
	// --- src/components/IngredientForm.tsx ---
	'ingredientForm.suggestWithClaude': {
		fr: "Suggérer avec Claude",
		en: "Suggest with Claude",
	},
	'ingredientForm.suggestWithClaude.thinking': {
		fr: "Réflexion en cours...",
		en: "Thinking...",
	},
	'ingredientForm.generalInfo': {
		fr: "Informations générales",
		en: "General information",
	},
	'ingredientForm.name': {
		fr: "Nom *",
		en: "Name *",
	},
	'ingredientForm.type': {
		fr: "Type *",
		en: "Type *",
	},
	'ingredientForm.shopSection': {
		fr: "Rayon *",
		en: "Shop section *",
	},
	'ingredientForm.density': {
		fr: "Densité (g/mL)",
		en: "Density (g/mL)",
	},
	'ingredientForm.entityWeight': {
		fr: "Poids unitaire (g)",
		en: "Unit weight (g)",
	},
	'ingredientForm.choose': {
		fr: "-- Choisir --",
		en: "-- Choose --",
	},'ingredientForm.specificInfo': {
		fr: "Informations spécifiques",
		en: "Specific information",
	},
	'ingredientForm.forms': {
		fr: "Formes",
		en: "Forms",
	},
	'ingredientForm.forms.placeholder': {
		fr: "ex : feuilles, haché",
		en: "e.g. leaves, chopped",
	},
	'ingredientForm.constraints': {
		fr: "Contraintes",
		en: "Constraints",
	},
	'ingredientForm.constraints.count': {
		fr: "Contraintes ({count})",
		en: "Constraints ({count})",
	},
	'ingredientForm.constraints.none': {
		fr: "Aucune",
		en: "None",
	},
	'ingredientForm.brand': {
		fr: "Marque",
		en: "Brand",
	},
	'ingredientForm.brand.placeholder': {
		fr: "ex : Kikkoman",
		en: "e.g. Kikkoman",
	},
	'ingredientForm.juiceYield': {
		fr: "Rendement jus",
		en: "Juice yield",
	},
	'ingredientForm.juiceYield.placeholder': {
		fr: "mL / fruit",
		en: "mL / fruit",
	},'ingredientForm.nutrition': {
		fr: "Valeurs nutritionnelles (pour 100g)",
		en: "Nutritional values (per 100g)",
	},
	'ingredientForm.nameEn': {
		fr: "Nom en anglais (pour la recherche USDA)",
		en: "English name (for USDA search)",
	},
	'ingredientForm.usda.noSuggestion': {
		fr: "Aucune suggestion pour l'instant",
		en: "No suggestion yet",
	},
	'ingredientForm.nutrition.kcal': {
		fr: "Calories (kcal)",
		en: "Calories (kcal)",
	},
	'ingredientForm.nutrition.lipids': {
		fr: "Lipides (g)",
		en: "Lipids (g)",
	},
	'ingredientForm.nutrition.nonSaturatedLipids': {
		fr: "dont insaturés (g)",
		en: "of which unsaturated (g)",
	},
	'ingredientForm.nutrition.glucids': {
		fr: "Glucides (g)",
		en: "Carbohydrates (g)",
	},
	'ingredientForm.nutrition.sugar': {
		fr: "dont sucres (g)",
		en: "of which sugars (g)",
	},
	'ingredientForm.nutrition.proteins': {
		fr: "Protéines (g)",
		en: "Proteins (g)",
	},
	'ingredientForm.nutrition.salt': {
		fr: "Sel (g)",
		en: "Salt (g)",
	},
	'ingredientForm.nutrition.fibers': {
		fr: "Fibres (g)",
		en: "Fibers (g)",
	},
	'ingredientForm.nutrition.cholesterol': {
		fr: "Cholestérol (mg)",
		en: "Cholesterol (mg)",
	},
	'ingredientForm.claude.copyAll': {
		fr: "Copier les valeurs de Claude",
		en: "Copy Claude's values",
	},
	'ingredientForm.claude.prefix': {
		fr: "Claude :",
		en: "Claude:",
	},'ingredientForm.error.nameRequired': {
		fr: "Le nom est obligatoire.",
		en: "Name is required.",
	},
	'ingredientForm.error.typeRequired': {
		fr: "Le type est obligatoire.",
		en: "Type is required.",
	},
	'ingredientForm.error.shopSectionRequired': {
		fr: "Le rayon est obligatoire.",
		en: "Shop section is required.",
	},
	'ingredientForm.error.densityInvalid': {
		fr: "La densité doit être un nombre strictement positif",
		en: "Density must be a strictly positive number",
	},
	'ingredientForm.error.entityWeightInvalid': {
		fr: "Le poids unitaire doit être un nombre strictement positif",
		en: "Unit weight must be a strictly positive number",
	},
	'ingredientForm.error.juiceYieldInvalid': {
		fr: "Le rendement en jus doit être un nombre strictement positif",
		en: "Juice yield must be a strictly positive number",
	},
	'ingredientForm.error.nutritionInvalid': {
		fr: "\"{label}\" n'est pas un nombre valide.",
		en: "\"{label}\" is not a valid number.",
	},'ingredientForm.error.nameRequiredForSuggestion': {
		fr: "Renseigne le nom de l'ingrédient avant de demander une suggestion.",
		en: "Enter the ingredient name before requesting a suggestion.",
	},'ingredientForm.submitLabel.create': {
		fr: "Créer l'ingrédient",
		en: "Create ingredient",
	},
	'ingredientForm.submitLabel.update': {
		fr: "Enregistrer les modifications",
		en: "Save changes",
	},

	// --- src/views/NewIngredientView.tsx ---
	'newIngredientView.title': {
		fr: "Formulaire ingrédient",
		en: "Ingredient form",
	},

	// --- src/components/ErrorModal.tsx ---
	'errorModal.title': {
		fr: "Corrige les erreurs suivantes",
		en: "Fix the following errors",
	},


	// --- src/views/IngredientView.tsx ---
	'ingredientView.title.editingGeneric': {
		fr: "Modification de l'ingrédient",
		en: "Editing ingredient",
	},
	'ingredientView.title.generic': {
		fr: "Ingrédient",
		en: "Ingredient",
	},
	'ingredientView.title.editingNamed': {
		fr: "Modification — {name}",
		en: "Editing — {name}",
	},

	// --- src/views/RecipeView.tsx ---
	'recipeView.title.editingGeneric': {
		fr: "Modification de la recette",
		en: "Editing recipe",
	},
	'recipeView.title.generic': {
		fr: "Recette",
		en: "Recipe",
	},
	'recipeView.title.editingNamed': {
		fr: "Modification — {name}",
		en: "Editing — {name}",
	},

	// --- src/views/NewRecipeView.tsx ---
	'newRecipeView.title': {
		fr: "Nouvelle recette",
		en: "New recipe",
	},

	// --- src/views/RecipeListView.tsx ---
	'recipeListView.title': {
		fr: "Liste des recettes",
		en: "Recipe list",
	},

	// --- src/views/IngredientListView.tsx ---
	'ingredientListView.title': {
		fr: "Liste des ingrédients",
		en: "Ingredient list",
	},

	// --- src/views/ShoppingListView.tsx ---
	'shoppingListView.title': {
		fr: "Courses",
		en: "Shopping list",
	},

	// --- src/views/ManageListsView.tsx ---
	'manageListsView.title': {
		fr: "Gérer les listes",
		en: "Manage lists",
	},


	// --- src/components/RecipeForm.tsx ---
	'recipeForm.submitLabel.create': {
		fr: "Créer la recette",
		en: "Create recipe",
	},
	'recipeForm.claude.extract': {
		fr: "Extraire les informations depuis un texte à l'aide de Claude",
		en: "Extract information from text using Claude",
	},
	'recipeForm.generalInfo': {
		fr: "Informations générales",
		en: "General information",
	},
	'recipeForm.name': {
		fr: "Nom",
		en: "Name",
	},
	'recipeForm.madeBefore': {
		fr: "Recette déjà réalisée (dates inconnues)",
		en: "Recipe already made before (dates unknown)",
	},
	'recipeForm.baseServings': {
		fr: "Portions de base",
		en: "Base servings",
	},
	'recipeForm.servingsLabel': {
		fr: "Unité de portion (ex : crèmes, parts)",
		en: "Serving unit (e.g. custards, portions)",
	},
	'recipeForm.preparationDuration': {
		fr: "Préparation (min)",
		en: "Preparation (min)",
	},
	'recipeForm.requiresCooking': {
		fr: "Nécessite cuisson",
		en: "Requires cooking",
	},
	'recipeForm.time': {
		fr: "Temps",
		en: "Time",
	},
	'recipeForm.weight': {
		fr: "Poids",
		en: "Weight",
	},
	'recipeForm.subfolder': {
		fr: "Sous-dossier",
		en: "Subfolder",
	},
	'recipeForm.subfolder.root': {
		fr: "-- Racine --",
		en: "-- Root --",
	},
	'recipeForm.image': {
		fr: "Image",
		en: "Image",
	},
	'recipeForm.image.placeholder': {
		fr: "ex : crème brûlée.png",
		en: "e.g. crème brûlée.png",
	},
	'recipeForm.choose': {
		fr: "Choisir",
		en: "Choose",
	},
	'recipeForm.tags': {
		fr: "Tags",
		en: "Tags",
	},
	'recipeForm.tags.placeholder': {
		fr: "ex : dessert, sans gluten",
		en: "e.g. dessert, gluten-free",
	},
	'recipeForm.source': {
		fr: "Source (texte libre ou URL)",
		en: "Source (free text or URL)",
	},
	'recipeForm.ingredientsAndBaseRecipes': {
		fr: "Ingrédients et recettes de base",
		en: "Ingredients and base recipes",
	},
	'recipeForm.emptyEntries': {
		fr: "Aucun ingrédient ou recettes de base pour l'instant",
		en: "No ingredients or base recipes yet",
	},
	'recipeForm.dragHandle.title': {
		fr: "Glisser pour réordonner",
		en: "Drag to reorder",
	},
	'recipeForm.sectionTitle.placeholder': {
		fr: "Titre de la section (ex : Pour la pâte)",
		en: "Section title (e.g. For the dough)",
	},
	'recipeForm.recipeSuffix': {
		fr: "(recette)",
		en: "(recipe)",
	},
	'recipeForm.fried.marked': {
		fr: "Marqué comme frit",
		en: "Marked as fried",
	},
	'recipeForm.fried.mark': {
		fr: "Marquer comme frit",
		en: "Mark as fried",
	},
	'recipeForm.fried.yes': {
		fr: "Frit",
		en: "Fried",
	},
	'recipeForm.fried.no': {
		fr: "Pas frit",
		en: "Not fried",
	},
	'recipeForm.remove.title': {
		fr: "Retirer",
		en: "Remove",
	},
	'recipeForm.addSection': {
		fr: "+ section",
		en: "+ section",
	},
	'recipeForm.addSection.title': {
		fr: "Ajouter une section",
		en: "Add a section",
	},
	'recipeForm.fryingOil': {
		fr: "Huile de friture",
		en: "Frying oil",
	},
	'recipeForm.fryingOil.none': {
		fr: "Pas de friture",
		en: "No frying",
	},
	'recipeForm.instructions': {
		fr: "Instructions",
		en: "Instructions",
	},
	'recipeForm.notes': {
		fr: "Notes",
		en: "Notes",
	},


};

// Falls back to the French string (then the raw key) if a translation is
// missing for the current language — better to show slightly-wrong-language
// text than a blank UI while translations are still being filled in.
export function t(key: string, language: Language): string {
	return STRINGS[key]?.[language] ?? STRINGS[key]?.fr ?? key;
}
