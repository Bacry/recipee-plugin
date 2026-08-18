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

	// BE CAREFUL --> this is not a traduction !
	'ai.languageName': {
		fr: "français",
		en: "english",
	},

	// --- src/components/IngredientForm.tsx ---
	'ingredientForm.suggestWithAi': {
		fr: "Suggérer avec l'IA",
		en: "Suggest with AI",
	},
	'ingredientForm.suggestWithAi.thinking': {
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
	'ingredientForm.ai.copyAll': {
		fr: "Copier les valeurs suggérées par l'IA",
		en: "Copy AI's suggested values",
	},
	'ingredientForm.ai.prefix': {
		fr: "IA :",
		en: "AI:",
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
	'newIngredientView.saveAction': {
		fr: "Enregistrer",
		en: "Save",
	},
	'newIngredientView.closeAction': {
		fr: "Fermer le formulaire",
		en: "Close form",
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
	'recipeForm.ai.extract': {
		fr: "Extraire les informations depuis un texte à l'aide de l'IA",
		en: "Extract information from text using AI",
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


	// --- src/views/NewRecipeView.tsx ---
	'newRecipeView.title': {
		fr: "Nouvelle recette",
		en: "New recipe",
	},
	'newRecipeView.saveAction': {
		fr: "Enregistrer",
		en: "Save",
	},
	'newRecipeView.closeAction': {
		fr: "Fermer le formulaire",
		en: "Close form",
	},
	'newRecipeView.closeAction.back': {
		fr: "Retour",
		en: "Back",
	},
	'newRecipeView.closeAction.close': {
		fr: "Fermer",
		en: "Close",
	},
	'newRecipeView.created': {
		fr: "Recette \"{name}\" créée.",
		en: "Recipe \"{name}\" created.",
	},
	'newRecipeView.error.create': {
		fr: "Impossible de créer la recette.",
		en: "Could not create the recipe.",
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
	'recipeView.closeAction.back': {
		fr: "Retour",
		en: "Back",
	},
	'recipeView.closeAction.close': {
		fr: "Fermer",
		en: "Close",
	},
	'recipeView.modifyAction': {
		fr: "Modifier la recette",
		en: "Edit recipe",
	},
	'recipeView.saveAction': {
		fr: "Enregistrer les modifications",
		en: "Save changes",
	},
	'recipeView.shop.alreadyAdded': {
		fr: "\"{name}\" est déjà dans votre liste de courses. Ajouter quand même ?",
		en: "\"{name}\" is already on your shopping list. Add it anyway?",
	},
	'recipeView.shop.addedWithWarnings': {
		fr: "Ajouté avec {count} avertissement(s) — voir la console.",
		en: "Added with {count} warning(s) — see console.",
	},
	'recipeView.shop.added': {
		fr: "\"{name}\" ajouté à la liste de courses.",
		en: "\"{name}\" added to the shopping list.",
	},
	'recipeView.cooked.alreadyToday': {
		fr: "Déjà marquée comme réalisée aujourd'hui.",
		en: "Already marked as made today.",
	},
	'recipeView.cooked.today': {
		fr: "Réalisée aujourd'hui : {names}.",
		en: "Made today: {names}.",
	},
	'recipeView.updated': {
		fr: "Recette \"{name}\" mise à jour.",
		en: "Recipe \"{name}\" updated.",
	},
	'recipeView.error.update': {
		fr: "Impossible de modifier la recette.",
		en: "Could not update the recipe.",
	},
	'recipeView.noFileSelected': {
		fr: "Aucun fichier sélectionné.",
		en: "No file selected.",
	},
	'recipeView.fileNotFound': {
		fr: "Fichier introuvable : {path}",
		en: "File not found: {path}",
	},
	'recipeView.errors.title': {
		fr: "Cette recette contient des erreurs :",
		en: "This recipe contains errors:",
	},

	// --- src/components/SmartRecipeIngredientInput.tsx ---
	'smartRecipeIngredientInput.error.incompatibleUnit': {
		fr: "Unité incompatible : cette recette de base se mesure en \"{label}\", pas convertible avec l'unité saisie.",
		en: "Incompatible unit: this base recipe is measured in \"{label}\", not convertible with the entered unit.",
	},
	'smartRecipeIngredientInput.placeholder.name': {
		fr: "Nom de l'ingrédient ou d'une recette de base",
		en: "Ingredient or base recipe name",
	},
	'smartRecipeIngredientInput.placeholder.quantityRequired': {
		fr: "Quantité (obligatoire)",
		en: "Quantity (required)",
	},
	'smartRecipeIngredientInput.placeholder.complementOrQuantity': {
		fr: "Complément ou quantité (optionnel)",
		en: "Complement or quantity (optional)",
	},
	'smartRecipeIngredientInput.placeholder.quantityOptional': {
		fr: "Quantité (optionnel)",
		en: "Quantity (optional)",
	},
	'smartRecipeIngredientInput.recipeSuffix': {
		fr: "(recette)",
		en: "(recipe)",
	},

	// --- src/components/SmartShoppingInput.tsx ---
	'smartShoppingInput.placeholder.name': {
		fr: "Nom de l'article",
		en: "Item name",
	},
	'smartShoppingInput.placeholder.complementOrQuantity': {
		fr: "Complément ou quantité (optionnel)",
		en: "Complement or quantity (optional)",
	},
	'smartShoppingInput.placeholder.quantityOptional': {
		fr: "Quantité (optionnel)",
		en: "Quantity (optional)",
	},

	// --- src/components/RecipeDetails.tsx ---
	'recipeDetails.notes': {
		fr: "Notes",
		en: "Notes",
	},
	'recipeDetails.notes.placeholder': {
		fr: "Pour insérer une note cliquer sur le titre 'Notes'. Puis écrivez votre note (en format markdown), puis ré-appuyer sur 'Notes' pour enregistrer",
		en: "To add a note, click the 'Notes' title. Then write your note (in markdown format), then click 'Notes' again to save",
	},


	// --- src/components/RecipeDetails.tsx ---
	'recipeDetails.time': {
		fr: "Temps",
		en: "Time",
	},
	'recipeDetails.time.preparation': {
		fr: "Préparation : {duration}",
		en: "Preparation: {duration}",
	},
	'recipeDetails.time.cooking': {
		fr: "Cuisson : {duration}",
		en: "Cooking: {duration}",
	},
	'recipeDetails.time.total': {
		fr: "Total : {duration}",
		en: "Total: {duration}",
	},
	'recipeDetails.time.notSet': {
		fr: "Non renseigné",
		en: "Not specified",
	},
	'recipeDetails.source': {
		fr: "Source",
		en: "Source",
	},
	'recipeDetails.source.web': {
		fr: "web",
		en: "web",
	},
	'recipeDetails.source.notSet': {
		fr: "Non renseignée",
		en: "Not specified",
	},
	'recipeDetails.image.notFound': {
		fr: "Image \"{name}\" introuvable dans le vault.",
		en: "Image \"{name}\" not found in the vault.",
	},
	'recipeDetails.ingredients': {
		fr: "Ingrédients (pour",
		en: "Ingredients (for",
	},
	'recipeDetails.resetServings': {
		fr: "Réinitialiser le nombre de portions",
		en: "Reset the number of servings",
	},
	'recipeDetails.shop.title': {
		fr: "Ajouter à la liste de courses",
		en: "Add to shopping list",
	},
	'recipeDetails.unitOption.original': {
		fr: "(original)",
		en: "(original)",
	},
	'recipeDetails.unitOption.piece': {
		fr: "(pièce)",
		en: "(piece)",
	},
	'recipeDetails.baseRecipeSuffix': {
		fr: "(recette de base)",
		en: "(base recipe)",
	},
	'recipeDetails.fryingOilSuffix': {
		fr: "(pour la friture)",
		en: "(for frying)",
	},
	'recipeDetails.history': {
		fr: "Historique",
		en: "History",
	},
	'recipeDetails.markCookedToday': {
		fr: "Marquer comme réalisée aujourd'hui",
		en: "Mark as made today",
	},
	'recipeDetails.markCookedToday.button': {
		fr: "Réalisée aujourd'hui",
		en: "Made today",
	},
	'recipeDetails.history.madeBeforeTracking': {
		fr: "Déjà réalisée plusieurs fois par le passé (dates non enregistrées).",
		en: "Already made several times in the past (dates not recorded).",
	},
	'recipeDetails.history.neverMade': {
		fr: "Jamais réalisée pour l'instant.",
		en: "Never made yet.",
	},
	'recipeDetails.history.madeAtLeast': {
		fr: "Réalisée au moins {count} fois{suffix} — dernière fois le {date}.",
		en: "Made at least {count} time(s){suffix} — last time on {date}.",
	},
	'recipeDetails.history.plusUndated': {
		fr: " (+ plusieurs fois non datées avant)",
		en: " (+ several undated times before)",
	},


	// --- src/components/RecipeNutritionTable.tsx ---
	'recipeNutritionTable.title': {
		fr: "Nutrition",
		en: "Nutrition",
	},
	'recipeNutritionTable.title.measured': {
		fr: "(poids total mesuré : {weight}g)",
		en: "(measured total weight: {weight}g)",
	},
	'recipeNutritionTable.title.calculated': {
		fr: "(poids total calculé : {weight}g)",
		en: "(calculated total weight: {weight}g)",
	},
	'recipeNutritionTable.frying.hypothesis': {
		fr: "Hypothèse d'absorption de {oilName} par les aliments frits :",
		en: "Absorption hypothesis of {oilName} by fried foods:",
	},
	'recipeNutritionTable.frying.amount': {
		fr: "% (= {amount}g de {oilName})",
		en: "% (= {amount}g of {oilName})",
	},
	'recipeNutritionTable.unreliable': {
		fr: "Cette recette nécessite une cuisson et son poids final n'a pas été mesuré — la colonne \"Pour 100g\" n'est pas fiable.",
		en: "This recipe requires cooking and its final weight hasn't been measured — the \"Per 100g\" column is unreliable.",
	},
	'recipeNutritionTable.column.per100g': {
		fr: "Pour 100g",
		en: "Per 100g",
	},
	'recipeNutritionTable.column.perServing': {
		fr: "Pour 1 {label}",
		en: "Per 1 {label}",
	},
	'recipeNutritionTable.column.total': {
		fr: "Total ({weight}g)",
		en: "Total ({weight}g)",
	},
	'recipeNutritionTable.row.kcal': {
		fr: "Calories",
		en: "Calories",
	},
	'recipeNutritionTable.row.lipids': {
		fr: "Lipides",
		en: "Fat",
	},
	'recipeNutritionTable.row.nonSaturatedLipids': {
		fr: "dont insaturés",
		en: "of which unsaturated",
	},
	'recipeNutritionTable.row.glucids': {
		fr: "Glucides",
		en: "Carbohydrates",
	},
	'recipeNutritionTable.row.sugar': {
		fr: "dont sucres",
		en: "of which sugars",
	},
	'recipeNutritionTable.row.proteins': {
		fr: "Protéines",
		en: "Proteins",
	},
	'recipeNutritionTable.row.salt': {
		fr: "Sel",
		en: "Salt",
	},
	'recipeNutritionTable.row.fibers': {
		fr: "Fibres",
		en: "Fiber",
	},
	'recipeNutritionTable.row.cholesterol': {
		fr: "Cholestérol",
		en: "Cholesterol",
	},


	// --- src/components/IngredientDetails.tsx ---
	'ingredientDetails.characteristics': {
		fr: "Caractéristiques",
		en: "Characteristics",
	},
	'ingredientDetails.type': {
		fr: "Type : {value}",
		en: "Type: {value}",
	},
	'ingredientDetails.shopSection': {
		fr: "Rayon : {value}",
		en: "Shop section: {value}",
	},
	'ingredientDetails.brand': {
		fr: "Marque : {value}",
		en: "Brand: {value}",
	},
	'ingredientDetails.density': {
		fr: "Densité : {value} g/mL",
		en: "Density: {value} g/mL",
	},
	'ingredientDetails.entityWeight': {
		fr: "Poids unitaire : {value} g",
		en: "Unit weight: {value} g",
	},
	'ingredientDetails.juiceYield': {
		fr: "Rendement en jus : {value} mL / fruit",
		en: "Juice yield: {value} mL / fruit",
	},
	'ingredientDetails.possibleForms': {
		fr: "Formes possibles : {value}",
		en: "Possible forms: {value}",
	},
	'ingredientDetails.dietFlags': {
		fr: "Contraintes alimentaires : {value}",
		en: "Dietary constraints: {value}",
	},
	'ingredientDetails.canBeUsedForFrying': {
		fr: "Peut être utilisé pour la friture",
		en: "Can be used for frying",
	},
	'ingredientDetails.nutrition': {
		fr: "Valeurs nutritionnelles (pour 100g)",
		en: "Nutritional values (per 100g)",
	},
	'ingredientDetails.nutrition.kcal': {
		fr: "Calories",
		en: "Calories",
	},
	'ingredientDetails.nutrition.lipids': {
		fr: "Lipides",
		en: "Fat",
	},
	'ingredientDetails.nutrition.nonSaturatedLipids': {
		fr: "dont acides gras insaturés",
		en: "of which unsaturated fatty acids",
	},
	'ingredientDetails.nutrition.glucids': {
		fr: "Glucides",
		en: "Carbohydrates",
	},
	'ingredientDetails.nutrition.sugar': {
		fr: "dont sucres",
		en: "of which sugars",
	},
	'ingredientDetails.nutrition.proteins': {
		fr: "Protéines",
		en: "Proteins",
	},
	'ingredientDetails.nutrition.salt': {
		fr: "Sel",
		en: "Salt",
	},
	'ingredientDetails.nutrition.fibers': {
		fr: "Fibres",
		en: "Fiber",
	},
	'ingredientDetails.nutrition.cholesterol': {
		fr: "Cholestérol",
		en: "Cholesterol",
	},
	'ingredientDetails.usedIn': {
		fr: "Ingrédient utilisé dans",
		en: "Ingredient used in",
	},


	// --- src/views/RecipeListView.tsx ---
	'recipeListView.closeAction.back': {
		fr: "Retour",
		en: "Back",
	},
	'recipeListView.closeAction.close': {
		fr: "Fermer",
		en: "Close",
	},
	'recipeListView.search.placeholder': {
		fr: "Rechercher une recette...",
		en: "Search for a recipe...",
	},
	'recipeListView.ingredientFilter.placeholder': {
		fr: "Filtrer par ingrédient...",
		en: "Filter by ingredient...",
	},
	'recipeListView.ingredientFilter.remove': {
		fr: "Retirer le filtre",
		en: "Remove filter",
	},
	'recipeListView.constraints': {
		fr: "Contraintes",
		en: "Constraints",
	},
	'recipeListView.constraints.without': {
		fr: "sans {flag}",
		en: "without {flag}",
	},
	'recipeListView.tags': {
		fr: "Tags",
		en: "Tags",
	},
	'recipeListView.tags.unpin': {
		fr: "Désépingler",
		en: "Unpin",
	},
	'recipeListView.tags.pin': {
		fr: "Épingler",
		en: "Pin",
	},
	'recipeListView.column.name': {
		fr: "Nom",
		en: "Name",
	},
	'recipeListView.column.duration': {
		fr: "Durée",
		en: "Duration",
	},
	'recipeListView.column.created': {
		fr: "Créée",
		en: "Created",
	},

// --- src/components/IngredientListDisplay.tsx ---
	'ingredientListDisplay.defined': {
		fr: "Définis",
		en: "Defined",
	},
	'ingredientListDisplay.undefined': {
		fr: "Non définis",
		en: "Undefined",
	},
	'ingredientListDisplay.search.placeholder': {
		fr: "Rechercher un ingrédient...",
		en: "Search for an ingredient...",
	},
	'ingredientListDisplay.type': {
		fr: "Type",
		en: "Type",
	},
	'ingredientListDisplay.constraints': {
		fr: "Contraintes",
		en: "Constraints",
	},
	'ingredientListDisplay.constraints.without': {
		fr: "sans {flag}",
		en: "without {flag}",
	},
	'ingredientListDisplay.column.name': {
		fr: "Nom",
		en: "Name",
	},
	'ingredientListDisplay.column.shopSection': {
		fr: "Rayon",
		en: "Shop section",
	},
	'ingredientListDisplay.column.usedIn': {
		fr: "Utilisé dans",
		en: "Used in",
	},
	'ingredientListDisplay.noUndefined': {
		fr: "Aucun ingrédient non défini 🎉",
		en: "No undefined ingredients 🎉",
	},
	'ingredientListDisplay.noResults': {
		fr: "Aucun ingrédient trouvé",
		en: "No ingredients found",
	},

// --- src/views/IngredientListView.tsx ---
	'ingredientListView.closeAction.back': {
		fr: "Retour",
		en: "Back",
	},
	'ingredientListView.closeAction.close': {
		fr: "Fermer",
		en: "Close",
	},


	// --- src/components/ShoppingListDisplay.tsx ---
	'shoppingListDisplay.fruitCount': {
		fr: "fruit{plural}",
		en: "fruit{plural}",
	},
	'shoppingListDisplay.recipesSection.title': {
		fr: "Recettes sélectionnées",
		en: "Selected recipes",
	},
	'shoppingListDisplay.recipesSection.servingsFallback': {
		fr: "personnes",
		en: "people",
	},
	'shoppingListDisplay.recipesSection.cancel': {
		fr: "Annuler",
		en: "Cancel",
	},
	'shoppingListDisplay.owned.placeholder': {
		fr: "J'en ai déjà...",
		en: "I already have...",
	},
	'shoppingListDisplay.owned.title': {
		fr: "Cliquer pour indiquer ce que vous avez déjà",
		en: "Click to indicate what you already have",
	},
	'shoppingListDisplay.owned.incompatibleUnit': {
		fr: "(unité incompatible)",
		en: "(incompatible unit)",
	},
	'shoppingListDisplay.setSection.title': {
		fr: "Définir le rayon",
		en: "Set shop section",
	},
	'shoppingListDisplay.markBought.title': {
		fr: "Marquer comme acheté",
		en: "Mark as bought",
	},
	'shoppingListDisplay.delete.title': {
		fr: "Supprimer",
		en: "Delete",
	},
	'shoppingListDisplay.otherSection': {
		fr: "Autres rayons",
		en: "Other sections",
	},


	// --- src/views/ShoppingListView.tsx ---
	'shoppingListView.closeAction.back': {
		fr: "Retour",
		en: "Back",
	},
	'shoppingListView.closeAction.close': {
		fr: "Fermer",
		en: "Close",
	},
	'shoppingListView.fileNotFound': {
		fr: "Fichier de liste de courses introuvable.",
		en: "Shopping list file not found.",
	},


	// --- src/components/ManageListsDisplay.tsx ---
	'manageListsDisplay.field.type.label': {
		fr: "Types d'ingrédients",
		en: "Ingredient types",
	},
	'manageListsDisplay.field.type.description': {
		fr: "Catégorise chaque ingrédient (légume, viande, épice...). Détermine aussi le sous-dossier où sa fiche est rangée.",
		en: "Categorizes each ingredient (vegetable, meat, spice...). Also determines the subfolder where its sheet is stored.",
	},
	'manageListsDisplay.field.shopSection.label': {
		fr: "Rayons",
		en: "Shop sections",
	},
	'manageListsDisplay.field.shopSection.description': {
		fr: "Le rayon du magasin où trouver chaque ingrédient — utilisé pour organiser la liste de courses.",
		en: "The store section where to find each ingredient — used to organize the shopping list.",
	},
	'manageListsDisplay.field.dietFlag.label': {
		fr: "Contraintes alimentaires pour les ingrédients",
		en: "Dietary constraints for ingredients",
	},
	'manageListsDisplay.field.dietFlag.description': {
		fr: "Signale qu'un ingrédient contient tel allergène ou correspond à telle contrainte (gluten, lactose...). Sert à filtrer les recettes qui en contiennent.",
		en: "Flags that an ingredient contains a given allergen or matches a given constraint (gluten, lactose...). Used to filter recipes that contain it.",
	},
	'manageListsDisplay.field.dietPreset.label': {
		fr: "Définition des contraintes alimentaires pour les recettes",
		en: "Dietary constraint presets for recipes",
	},
	'manageListsDisplay.field.dietPreset.description': {
		fr: "Une combinaison nommée de plusieurs contraintes (ex: \"Végan\" = viande + poisson + œuf + lactose), pour filtrer en un clic sans tout recocher à chaque fois.",
		en: "A named combination of several constraints (e.g. \"Vegan\" = meat + fish + egg + lactose), to filter in one click without re-checking everything each time.",
	},
	'manageListsDisplay.remove.title': {
		fr: "Supprimer",
		en: "Delete",
	},
	'manageListsDisplay.preset.namePlaceholder': {
		fr: "Nom du préréglage",
		en: "Preset name",
	},
	'manageListsDisplay.preset.nameLabel': {
		fr: "Nom du préréglage",
		en: "Preset name",
	},
	'manageListsDisplay.preset.namePlaceholderExample': {
		fr: "ex : Végan",
		en: "e.g. Vegan",
	},
	'manageListsDisplay.preset.constraintsLabel': {
		fr: "Contraintes incluses",
		en: "Included constraints",
	},
	'manageListsDisplay.preset.create': {
		fr: "Créer le préréglage",
		en: "Create preset",
	},
	'manageListsDisplay.value.addPlaceholder': {
		fr: "Ajouter une valeur...",
		en: "Add a value...",
	},
	'manageListsDisplay.intro': {
		fr: "Ces listes sont utilisées dans les formulaires (menus déroulants, autocomplétion) et pour organiser vos fiches. Renommer une valeur met automatiquement à jour tous les ingrédients concernés.",
		en: "These lists are used in forms (dropdown menus, autocomplete) and to organize your sheets. Renaming a value automatically updates all related ingredients.",
	},
	'manageListsDisplay.selectList': {
		fr: "Choisir une liste...",
		en: "Choose a list...",
	},

	// --- src/views/ManageListsView.tsx ---
	'manageListsView.closeAction.back': {
		fr: "Retour",
		en: "Back",
	},
	'manageListsView.closeAction.close': {
		fr: "Fermer",
		en: "Close",
	},
	'manageListsView.alreadyExists': {
		fr: "\"{value}\" existe déjà.",
		en: "\"{value}\" already exists.",
	},
	'manageListsView.rename.wouldMerge': {
		fr: "\"{newValue}\" existe déjà — renommer \"{oldValue}\" en \"{newValue}\" fusionnera ces deux valeurs sur les ingrédients concernés. Continuer ?",
		en: "\"{newValue}\" already exists — renaming \"{oldValue}\" to \"{newValue}\" will merge these two values on affected ingredients. Continue?",
	},
	'manageListsView.rename.success': {
		fr: "\"{oldValue}\" renommé en \"{newValue}\" ({count} ingrédient(s) mis à jour).",
		en: "\"{oldValue}\" renamed to \"{newValue}\" ({count} ingredient(s) updated).",
	},
	'manageListsView.remove.usedAsOil': {
		fr: "Impossible de supprimer \"{value}\" : ce type est utilisé dans les réglages (catégorie \"Huile\"). Retire-le d'abord dans Réglages → Catégories spéciales.",
		en: "Cannot delete \"{value}\": this type is used in settings (\"Oil\" category). Remove it first in Settings → Special categories.",
	},
	'manageListsView.remove.usedAsFruit': {
		fr: "Impossible de supprimer \"{value}\" : ce type est utilisé dans les réglages (catégorie \"Fruit\"). Retire-le d'abord dans Réglages → Catégories spéciales.",
		en: "Cannot delete \"{value}\": this type is used in settings (\"Fruit\" category). Remove it first in Settings → Special categories.",
	},
	'manageListsView.remove.stillUsed': {
		fr: "\"{value}\" est encore utilisé par au moins un ingrédient. Retirer quand même de la liste (les ingrédients concernés garderont cette valeur, juste signalée comme inconnue) ?",
		en: "\"{value}\" is still used by at least one ingredient. Remove it from the list anyway (affected ingredients will keep this value, just flagged as unknown)?",
	},
	'manageListsView.preset.alreadyExists': {
		fr: "Un préréglage \"{name}\" existe déjà.",
		en: "A preset named \"{name}\" already exists.",
	},


	// --- src/components/ConfirmModal.tsx ---
	'confirmModal.confirm': {
		fr: "Ajouter quand même",
		en: "Add anyway",
	},


	'confirmModal.cancel': {
		fr: "Annuler",
		en: "Cancel",
	},

	// --- src/components/ParseRecipeTextModal.tsx ---
	'parseRecipeTextModal.title': {
		fr: "Extraire une recette depuis un texte",
		en: "Extract a recipe from text",
	},
	'parseRecipeTextModal.description': {
		fr: "Colle le texte brut d'une recette (depuis un site, un livre...) — l'IA va essayer d'en extraire les champs.",
		en: "Paste the raw text of a recipe (from a website, a book...) — the AI will try to extract the fields from it.",
	},
	'parseRecipeTextModal.analyze': {
		fr: "Analyser",
		en: "Analyze",
	},
	'parseRecipeTextModal.analyzing': {
		fr: "Analyse en cours...",
		en: "Analyzing...",
	},
	'parseRecipeTextModal.cancel': {
		fr: "Annuler",
		en: "Cancel",
	},
	'parseRecipeTextModal.unknownError': {
		fr: "Erreur inconnue.",
		en: "Unknown error.",
	},
	'parseRecipeTextModal.success': {
		fr: "Recette extraite avec succès.",
		en: "Recipe extracted successfully.",
	},

	// --- src/settings.ts ---
	'settings.language.name': {
		fr: "Langue",
		en: "Language",
	},
	'settings.language.desc': {
		fr: "Langue de l'interface du plugin.",
		en: "Language of the plugin's interface.",
	},
	'settings.ingredientsFolder.name': {
		fr: "Dossier des ingrédients",
		en: "Ingredients folder",
	},
	'settings.ingredientsFolder.desc': {
		fr: "Dossier où sont stockées vos fiches ingrédients",
		en: "Folder where your ingredient notes are stored",
	},
	'settings.recipesFolder.name': {
		fr: "Dossier des recettes",
		en: "Recipes folder",
	},
	'settings.recipesFolder.desc': {
		fr: "Dossier où sont stockées vos recettes",
		en: "Folder where your recipe notes are stored",
	},
	'settings.recipeTemplatesFolder.name': {
		fr: "Dossier des modèles de recette",
		en: "Recipe templates folder",
	},
	'settings.recipeTemplatesFolder.desc': {
		fr: "Dossier racine contenant les modèles de recette (ex: un modèle \"Cocktail\") — utilisé par \"Créer une nouvelle recette depuis un modèle\"",
		en: "Root-level folder containing recipe templates (e.g. a \"Cocktail\" template) — used by \"Create new recipe from template\"",
	},
	'settings.recipeImagesFolder.name': {
		fr: "Dossier des images de recette",
		en: "Recipe images folder",
	},
	'settings.recipeImagesFolder.desc': {
		fr: "Dossier où sont stockées les images de recette — indépendant du dossier des recettes, créé automatiquement si absent",
		en: "Folder where recipe images are stored — independent from the recipes folder, created automatically if missing",
	},
	'settings.lists.name': {
		fr: "Types d'ingrédients, rayons et contraintes alimentaires",
		en: "Ingredient types, shop sections & diet flags",
	},
	'settings.lists.desc': {
		fr: "Géré via une vue dédiée — lance la commande \"Gérer les listes\" ou clique sur l'icône étiquette dans le ruban.",
		en: "Managed via a dedicated view — run the \"Manage lists\" command or click the tag icon in the ribbon.",
	},
	'settings.specialCategories.name': {
		fr: "Catégories spéciales",
		en: "Special categories",
	},
	'settings.specialCategories.desc': {
		fr: "Parmi tes types d'ingrédients existants, lesquels correspondent à une huile (active \"Peut être utilisé pour la friture\") ou un fruit (active \"Rendement en jus\") sur la fiche ingrédient.",
		en: "Among your existing ingredient types, which ones count as an oil (enables \"Can be used for frying\") or a fruit (enables \"Juice yield\") on the ingredient sheet.",
	},
	'settings.oilTypes.label': {
		fr: "Types \"huile\" (friture)",
		en: "\"Oil\" types (frying)",
	},
	'settings.fruitTypes.label': {
		fr: "Types \"fruit\" (rendement en jus)",
		en: "\"Fruit\" types (juice yield)",
	},
	'settings.absorptionPercent.name': {
		fr: "Absorption d'huile par défaut",
		en: "Default oil absorption",
	},
	'settings.absorptionPercent.desc': {
		fr: "Pourcentage utilisé au départ pour estimer l'huile absorbée par les aliments frits — ajustable ensuite dans chaque recette. La littérature situe l'absorption entre 8% et 25% selon la porosité de l'aliment.",
		en: "Percentage used initially to estimate the oil absorbed by fried foods — adjustable afterward in each recipe. Literature places absorption between 8% and 25% depending on the food's porosity.",
	},
	'settings.usdaApiKey.name': {
		fr: "Clé API USDA",
		en: "USDA API key",
	},
	'settings.usdaApiKey.desc': {
		fr: "Clé API gratuite depuis fdc.nal.usda.gov, utilisée pour rechercher les données nutritionnelles",
		en: "Free API key from fdc.nal.usda.gov, used to search nutritional data",
	},
	'settings.usdaApiKey.placeholder': {
		fr: "Ta clé API",
		en: "Your API key",
	},
	'settings.anthropicModel.name': {
		fr: "Modèle Anthropic",
		en: "Anthropic model",
	},
	'settings.anthropicModel.desc': {
		fr: "Modèle utilisé pour l'extraction de texte de recette",
		en: "Model used for recipe text extraction",
	},
	'settings.anthropicModel.haiku': {
		fr: "Claude Haiku 4.5 (rapide, économique)",
		en: "Claude Haiku 4.5 (fast, cheap)",
	},
	'settings.anthropicModel.sonnet': {
		fr: "Claude Sonnet 5 (équilibré)",
		en: "Claude Sonnet 5 (balanced)",
	},
	'settings.anthropicModel.opus': {
		fr: "Claude Opus 4.8 (le plus performant)",
		en: "Claude Opus 4.8 (most capable)",
	},
	'settings.shoppingListPath.name': {
		fr: "Chemin de la liste de courses",
		en: "Shopping list note path",
	},
	'settings.shoppingListPath.desc': {
		fr: "Chemin vers la note unique utilisée comme liste de courses",
		en: "Path to the single note used as your shopping list",
	},
	'settings.otherItemsNotePath.name': {
		fr: "Chemin de la note \"Autres articles\"",
		en: "Other items note path",
	},
	'settings.otherItemsNotePath.desc': {
		fr: "Note unique listant les noms d'articles (sans fiche ingrédient), utilisée pour enrichir l'autocomplétion au fil du temps",
		en: "Single note listing item names not corresponding to ingredient notes, used to grow autocomplete over time",
	},

	// --- src/settings.ts (unit system) ---
	'settings.unitSystem.name': {
		fr: "Système d'unités",
		en: "Unit system",
	},
	'settings.unitSystem.desc': {
		fr: "Unités proposées par défaut lors de la saisie des quantités.",
		en: "Units suggested by default when entering quantities.",
	},
	'settings.unitSystem.metric': {
		fr: "Métrique (g, cl, kg)",
		en: "Metric (g, cl, kg)",
	},
	'settings.unitSystem.us': {
		fr: "US (oz, cup, lb)",
		en: "US (oz, cup, lb)",
	},
	'settings.usdaEnabled.name': {
		fr: "Activer la recherche USDA",
		en: "Enable USDA search",
	},
	'settings.usdaEnabled.desc': {
		fr: "Affiche la recherche de données nutritionnelles USDA dans le formulaire ingrédient. Désactive-la si tu n'as pas de clé API ou préfères remplir les valeurs manuellement.",
		en: "Shows the USDA nutritional data search in the ingredient form. Turn this off if you don't have an API key or prefer to fill in values manually.",
	},

	// --- src/main.ts ---
	'main.templatePicker.emptyRecipe': {
		fr: "Recette vide",
		en: "Empty recipe",
	},
	'main.templatePicker.placeholder': {
		fr: "Choisir un template de recette...",
		en: "Choose a recipe template...",
	},
	'main.ribbon.recipeList': {
		fr: "Liste des recettes",
		en: "Recipe list",
	},
	'main.ribbon.newRecipe': {
		fr: "Créer une nouvelle recette",
		en: "Create new recipe",
	},
	'main.ribbon.ingredientList': {
		fr: "Liste des ingrédients",
		en: "Ingredient list",
	},
	'main.ribbon.newIngredient': {
		fr: "Créer un nouvel ingrédient",
		en: "Create new ingredient",
	},
	'main.ribbon.shoppingList': {
		fr: "Liste de courses",
		en: "Shopping list",
	},
	'main.ribbon.manageLists': {
		fr: "Gérer les listes",
		en: "Manage lists",
	},

	// --- src/models/flattenRecipeIngredients.ts ---
	'flattenRecipeIngredients.forFrying': {
		fr: "pour friture",
		en: "for frying",
	},
	'flattenRecipeIngredients.circularReference': {
		fr: "Référence circulaire détectée sur \"{name}\" — ignorée.",
		en: "Circular reference detected on \"{name}\" — skipped.",
	},
	'flattenRecipeIngredients.baseRecipeNotFound': {
		fr: "Recette de base \"{name}\" introuvable — ignorée.",
		en: "Base recipe \"{name}\" not found — skipped.",
	},
	'flattenRecipeIngredients.baseRecipeInvalid': {
		fr: "Recette de base \"{name}\" invalide — ignorée.",
		en: "Base recipe \"{name}\" is invalid — skipped.",
	},
	'flattenRecipeIngredients.conversionFailed': {
		fr: "Impossible de convertir la quantité de \"{name}\" en grammes — ignorée.",
		en: "Could not convert the quantity of \"{name}\" to grams — skipped.",
	},
	'flattenRecipeIngredients.unknownTotalWeight': {
		fr: "Poids total inconnu pour \"{name}\" — impossible de calculer les proportions.",
		en: "Unknown total weight for \"{name}\" — cannot calculate proportions.",
	},


	// --- src/models/computeRecipeNutrition.ts ---
	'computeRecipeNutrition.noSheet': {
		fr: "Ingrédient \"{name}\" sans fiche : exclu du calcul.",
		en: "Ingredient \"{name}\" has no sheet: excluded from the calculation.",
	},
	'computeRecipeNutrition.invalidIngredient': {
		fr: "Ingrédient \"{name}\" invalide : exclu du calcul.",
		en: "Ingredient \"{name}\" is invalid: excluded from the calculation.",
	},
	'computeRecipeNutrition.conversionFailed': {
		fr: "Impossible de convertir \"{name}\" en grammes (densité/poids unitaire manquant) : exclu du calcul.",
		en: "Could not convert \"{name}\" to grams (missing density/unit weight): excluded from the calculation.",
	},
	'computeRecipeNutrition.circularReference': {
		fr: "Référence circulaire détectée sur \"{name}\" — exclue du calcul.",
		en: "Circular reference detected on \"{name}\" — excluded from the calculation.",
	},
	'computeRecipeNutrition.baseRecipeNotFound': {
		fr: "Recette de base \"{name}\" introuvable — exclue du calcul.",
		en: "Base recipe \"{name}\" not found — excluded from the calculation.",
	},
	'computeRecipeNutrition.baseRecipeInvalid': {
		fr: "Recette de base \"{name}\" invalide — exclue du calcul.",
		en: "Base recipe \"{name}\" is invalid — excluded from the calculation.",
	},
	'computeRecipeNutrition.baseRecipeConversionFailed': {
		fr: "Impossible de convertir la quantité de \"{name}\" en grammes — exclue du calcul.",
		en: "Could not convert the quantity of \"{name}\" to grams — excluded from the calculation.",
	},
	'computeRecipeNutrition.fryingOilInvalid': {
		fr: "Huile de friture \"{name}\" invalide — absorption non incluse dans le calcul.",
		en: "Frying oil \"{name}\" is invalid — absorption not included in the calculation.",
	},
	'computeRecipeNutrition.fryingOilNotFound': {
		fr: "Huile de friture \"{name}\" introuvable — absorption non incluse dans le calcul.",
		en: "Frying oil \"{name}\" not found — absorption not included in the calculation.",
	},


	// --- src/models/recipeFormConversion.ts ---
	'recipeFormConversion.nameRequired': {
		fr: "Le nom est obligatoire.",
		en: "Name is required.",
	},
	'recipeFormConversion.servingsLabelRequired': {
		fr: "L'unité de portion est obligatoire.",
		en: "Serving unit is required.",
	},
	'recipeFormConversion.baseServingsInvalid': {
		fr: "\"Portions de base\" doit être un nombre positif.",
		en: "\"Base servings\" must be a positive number.",
	},
	'recipeFormConversion.preparationDurationInvalid': {
		fr: "\"Préparation (min)\" n'est pas un nombre valide.",
		en: "\"Preparation (min)\" is not a valid number.",
	},
	'recipeFormConversion.totalWeightInvalid': {
		fr: "\"Poids total mesuré\" n'est pas un nombre valide.",
		en: "\"Measured total weight\" is not a valid number.",
	},
	'recipeFormConversion.cookingDurationInvalid': {
		fr: "\"Cuisson (min)\" n'est pas un nombre valide.",
		en: "\"Cooking (min)\" is not a valid number.",
	},

	// --- src/views/IngredientView.tsx (delete) ---
	'ingredientView.delete.action': {
		fr: "Supprimer l'ingrédient",
		en: "Delete ingredient",
	},
	'ingredientView.delete.confirm.noUsage': {
		fr: "Supprimer définitivement \"{name}\" ?",
		en: "Permanently delete \"{name}\"?",
	},
	'ingredientView.delete.confirm.withUsage': {
		fr: "\"{name}\" est utilisé dans {count} recette(s) : {recipes}. Ces recettes afficheront cet ingrédient comme \"Non défini\" après suppression. Continuer ?",
		en: "\"{name}\" is used in {count} recipe(s): {recipes}. Those recipes will show this ingredient as \"Undefined\" after deletion. Continue?",
	},
	'ingredientView.delete.confirm.button': {
		fr: "Supprimer",
		en: "Delete",
	},
	'ingredientView.deleted': {
		fr: "Ingrédient \"{name}\" supprimé.",
		en: "Ingredient \"{name}\" deleted.",
	},


	// --- src/views/RecipeView.tsx (delete) ---
	'recipeView.delete.action': {
		fr: "Supprimer la recette",
		en: "Delete recipe",
	},
	'recipeView.delete.blocked': {
		fr: "Impossible de supprimer \"{name}\" : elle est utilisée comme recette de base dans {count} recette(s) : {recipes}. Retire-la de ces recettes d'abord.",
		en: "Cannot delete \"{name}\": it's used as a base recipe in {count} recipe(s): {recipes}. Remove it from those recipes first.",
	},
	'recipeView.delete.confirm': {
		fr: "Supprimer définitivement \"{name}\" ?",
		en: "Permanently delete \"{name}\"?",
	},
	'recipeView.delete.confirm.button': {
		fr: "Supprimer",
		en: "Delete",
	},
	'recipeView.deleted': {
		fr: "Recette \"{name}\" supprimée.",
		en: "Recipe \"{name}\" deleted.",
	},
	'recipeView.delete.blocked.title': {
		fr: "Suppression impossible",
		en: "Cannot delete",
	},

	// --- src/components/IngredientForm.tsx (Claude error) ---
	'ingredientForm.ai.unknownError': {
		fr: "Erreur inconnue.",
		en: "Unknown error.",
	},
	// --- src/views/IngredientView.tsx (delete/rename notices) ---
	'ingredientView.noFileSelected': {
		fr: "Aucun fichier ingrédient sélectionné.",
		en: "No ingredient file selected.",
	},
	'ingredientView.fileNotFound': {
		fr: "Le fichier ingrédient est introuvable.",
		en: "Ingredient file not found.",
	},
	'ingredientView.rename.recipesUpdated': {
		fr: "{count} recette(s) mise(s) à jour avec le nouveau nom.",
		en: "{count} recipe(s) updated with the new name.",
	},
	// --- src/views/NewIngredientView.tsx ---
	'newIngredientView.created': {
		fr: "Ingrédient \"{name}\" créé.",
		en: "Ingredient \"{name}\" created.",
	},


	'recipeListView.tag.filterTitle': {
		fr: "Filtrer par ce tag",
		en: "Filter by this tag",
	},

	'recipeForm.isBaseRecipe': {
		fr: "C'est une recette de base (utilisable comme composant d'une autre recette)",
		en: "This is a base recipe (usable as a component of another recipe)",
	},


	'settings.aiProvider.name': {
		fr: "Fournisseur IA",
		en: "AI provider",
	},
	'settings.aiProvider.desc': {
		fr: "Le service IA utilisé pour aider à l'ajout d'ingrédients et l'extraction de recettes.",
		en: "The AI service used for ingredient suggestions and recipe extraction.",
	},
	'settings.aiEnabled.desc': {
		fr: "Affiche le bouton \"Suggérer avec l'IA\" dans le formulaire ingrédient, et \"Extraire depuis un texte\" dans le formulaire recette. Nécessite un compte chez le fournisseur choisi ci-dessous.",
		en: "Shows the \"Suggest with AI\" button in the ingredient form, and \"Extract from text\" in the recipe form. Requires an account with the provider selected below.",
	},
	'settings.ai.heading': {
		fr: "Intelligence artificielle",
		en: "AI",
	},
	'parseRecipeTextModal.urlLabel': {
		fr: "URL de la recette (optionnel)",
		en: "Recipe URL (optional)",
	},
	'parseRecipeTextModal.or': {
		fr: "— ou —",
		en: "— or —",
	},
	'settings.aiApiKey.name': {
		fr: "Clé API ({provider})",
		en: "API key ({provider})",
	},
	'settings.aiModel.name': {
		fr: "Modèle",
		en: "Model",
	},
};

// Falls back to the French string (then the raw key) if a translation is
// missing for the current language — better to show slightly-wrong-language
// text than a blank UI while translations are still being filled in.
export function t(key: string, language: Language): string {
	return STRINGS[key]?.[language] ?? STRINGS[key]?.fr ?? key;
}
