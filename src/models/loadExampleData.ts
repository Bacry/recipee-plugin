import { App, Notice } from 'obsidian';
import { ensureFolderExists } from './fileSystemUtils';

interface ExampleFile {
	relativePath: string; // relative to the folder root passed in (ingredients/recipes/templates)
	content: string;
}

// All example data is written in English, using the US measurement system
// (cup/tbsp/tsp/oz/lb), matching the plugin's own English/US-oriented docs
// and screenshots. Users on French/Metric can still open and use these
// notes fine — the plugin auto-converts quantities on save if their unit
// system preference differs (see normalizeParsedQuantity), and the
// language toggle only affects the UI, never this stored data.

const EXAMPLE_INGREDIENTS: ExampleFile[] = [
	{
		relativePath: 'flour.md',
		content: `---
type: cereal
density_g_ml: 0.53
shop_section: pantry
nutrition_per_100g:
  kcal: 364
  lipids: 1
  non_saturated_lipids: 0.8
  glucids: 76
  sugar: 0.3
  proteins: 10
  salt: 0
  fibers: 2.7
  cholesterol: 0
---
`,
	},
	{
		relativePath: 'sugar.md',
		content: `---
type: other
density_g_ml: 0.85
shop_section: pantry
nutrition_per_100g:
  kcal: 387
  lipids: 0
  non_saturated_lipids: 0
  glucids: 100
  sugar: 100
  proteins: 0
  salt: 0
  fibers: 0
  cholesterol: 0
---
`,
	},
	{
		relativePath: 'egg.md',
		content: `---
type: other
entity_weight_g: 50
shop_section: dairy
nutrition_per_100g:
  kcal: 143
  lipids: 9.5
  non_saturated_lipids: 3.7
  glucids: 0.7
  sugar: 0.4
  proteins: 12.6
  salt: 0.3
  fibers: 0
  cholesterol: 372
---
`,
	},
	{
		relativePath: 'butter.md',
		content: `---
type: dairy
density_g_ml: 0.911
shop_section: dairy
possible_forms:
  - melted
  - softened
  - cold
nutrition_per_100g:
  kcal: 717
  lipids: 81
  non_saturated_lipids: 27
  glucids: 0.1
  sugar: 0.1
  proteins: 0.9
  salt: 0.02
  fibers: 0
  cholesterol: 215
---
`,
	},
	{
		relativePath: 'whole milk.md',
		content: `---
type: dairy
density_g_ml: 1.03
shop_section: dairy
nutrition_per_100g:
  kcal: 61
  lipids: 3.3
  non_saturated_lipids: 1
  glucids: 4.8
  sugar: 4.8
  proteins: 3.2
  salt: 0.1
  fibers: 0
  cholesterol: 10
---
`,
	},
	{
		relativePath: 'vegetable oil.md',
		content: `---
type: oil
density_g_ml: 0.92
shop_section: pantry
nutrition_per_100g:
  kcal: 884
  lipids: 100
  non_saturated_lipids: 86
  glucids: 0
  sugar: 0
  proteins: 0
  salt: 0
  fibers: 0
  cholesterol: 0
---
`,
	},
	{
		relativePath: 'lemon.md',
		content: `---
type: fruit
entity_weight_g: 58
shop_section: produce
possible_forms:
  - whole
  - sliced
  - zested
nutrition_per_100g:
  kcal: 29
  lipids: 0.3
  non_saturated_lipids: 0.2
  glucids: 9.3
  sugar: 2.5
  proteins: 1.1
  salt: 0
  fibers: 2.8
  cholesterol: 0
---
`,
	},
	{
		relativePath: 'lemon juice.md',
		content: `---
type: fruit juice
density_g_ml: 1.0
juice_yield_ml: 35
shop_section: produce
nutrition_per_100g:
  kcal: 22
  lipids: 0.2
  non_saturated_lipids: 0.1
  glucids: 6.9
  sugar: 2.5
  proteins: 0.4
  salt: 0
  fibers: 0.4
  cholesterol: 0
---
`,
	},
	{
		relativePath: 'chicken breast.md',
		content: `---
type: meat
shop_section: meat_fish
possible_forms:
  - whole
  - diced
  - chopped
nutrition_per_100g:
  kcal: 165
  lipids: 3.6
  non_saturated_lipids: 2.3
  glucids: 0
  sugar: 0
  proteins: 31
  salt: 0.2
  fibers: 0
  cholesterol: 85
---
`,
	},
	{
		relativePath: 'salt.md',
		content: `---
type: other
density_g_ml: 1.2
shop_section: pantry
nutrition_per_100g:
  kcal: 0
  lipids: 0
  non_saturated_lipids: 0
  glucids: 0
  sugar: 0
  proteins: 0
  salt: 100
  fibers: 0
  cholesterol: 0
---
`,
	},

	{
		relativePath: 'whiskey.md',
		content: `---
type: other
density_g_ml: 0.94
shop_section: beverages
nutrition_per_100g:
  kcal: 250
  lipids: 0
  non_saturated_lipids: 0
  glucids: 0
  sugar: 0
  proteins: 0
  salt: 0
  fibers: 0
  cholesterol: 0
---
`,
	},
];

const EXAMPLE_RECIPES: ExampleFile[] = [
	{
		relativePath: 'pancakes.md',
		content: `---
base_servings: 4
servings_label: "pancakes"
preparation_duration_min: 10
cooking_duration_min: 15
requires_cooking: true
made_before_tracking: false
ingredients:
  - ingredient_name: "flour"
    quantity: 1.5
    unit: "cup"
  - ingredient_name: "sugar"
    quantity: 2
    unit: "tbsp"
  - ingredient_name: "egg"
    quantity: 2
    unit: ""
  - ingredient_name: "whole milk"
    quantity: 1.25
    unit: "cup"
  - ingredient_name: "butter"
    quantity: 3
    unit: "tbsp"
    form: "melted"
  - ingredient_name: "salt"
    quantity: 0.5
    unit: "tsp"
instructions: |
  #### Preparation
  1. Whisk the flour, sugar, and salt together in a large bowl.
  2. In a separate bowl, whisk the eggs, milk, and melted butter.
  3. Pour the wet ingredients into the dry ingredients and stir just until combined — a few lumps are fine.

  #### Cooking
  1. Heat a lightly oiled griddle or pan over medium heat. Pour about 1/4 cup of batter per pancake.
  2. Cook until bubbles form on the surface, then flip and cook until golden on the other side.notes: |
  This is one of the plugin's example recipes — feel free to edit or delete it.
tags:
  - "breakfast"
  - "example"
cooked_dates: []
---
`,
	},
	{
		relativePath: 'Cocktails/whiskey sour.md',
		content: `---
base_servings: 1
servings_label: "glass"
requires_cooking: false
made_before_tracking: false
ingredients:
  - ingredient_name: "whiskey"
    quantity: 2
    unit: "oz"
  - ingredient_name: "lemon juice"
    quantity: 0.75
    unit: "oz"
  - ingredient_name: "sugar"
    quantity: 0.5
    unit: "oz"
instructions: |
  #### Preparation
  1. Combine the whiskey, lemon juice, and sugar in a shaker with ice.
  2. Shake well until chilled.
  3. Strain into a glass over fresh ice.
notes: |
  This is one of the plugin's example recipes, created from the "Cocktail" template — it lives in the "Cocktails" subfolder, matching that template's default_subfolder.
tags:
  - "cocktail"
  - "drink"
  - "example"
cooked_dates: []
---
`,
	},
	{
		relativePath: 'fried Chicken Tenders.md',
		content: `---
base_servings: 4
servings_label: "servings"
preparation_duration_min: 15
cooking_duration_min: 12
requires_cooking: true
made_before_tracking: false
total_weight_g: 620
frying_oil_name: "vegetable oil"
ingredients:
  - is_section_header: true
    section_title: "For the coating"
    order: 0
  - ingredient_name: "flour"
    quantity: 1
    unit: "cup"
    order: 1
  - ingredient_name: "salt"
    quantity: 1
    unit: "tsp"
    order: 2
  - is_section_header: true
    section_title: "For the chicken"
    order: 3
  - ingredient_name: "chicken breast"
    quantity: 1
    unit: "lb"
    form: "diced"
    fried: true
    order: 4
instructions: |
  #### Preparation
  1. Cut the chicken breast into strips.
  2. Season the flour with salt, then coat each piece of chicken.

  #### Cooking
  1. Heat the vegetable oil in a deep pan to 350°F (175°C).
  2. Fry the chicken in batches until golden and cooked through, about 4-5 minutes per batch.
  3. Drain on paper towels before serving.
  
notes: |
  This is one of the plugin's example recipes — a good one to check out the Frying & Oil Absorption feature on.
tags:
  - "dinner"
  - "fried"
  - "example"
cooked_dates: []
---
`,
	},
	{
		relativePath: 'lemonade Base Syrup.md',
		content: `---
base_servings: 2
servings_label: "cup"
requires_cooking: true
cooking_duration_min: 5
made_before_tracking: false
ingredients:
  - ingredient_name: "sugar"
    quantity: 1
    unit: "cup"
  - ingredient_name: "lemon juice"
    quantity: 1
    unit: "cup"
instructions: |
  #### Preparation
  1. Combine the sugar and lemon juice in a small saucepan.
  #### Cooking
  1. Warm over low heat, stirring until the sugar fully dissolves. Let cool before using.  
notes: |
  This recipe is tagged "base" — it's meant to be used as a component of other recipes, like "Lemonade". See the plugin's Base Recipes feature.
source: |
  Example base recipe
tags:
  - "base"
  - "example"
cooked_dates: []
---
`,
	},
	{
		relativePath: 'lemonade.md',
		content: `---
base_servings: 1
servings_label: "glass"
requires_cooking: false
made_before_tracking: false
ingredients:
  - ingredient_name: "lemon"
    quantity: null
    unit: ""
    complement: "slice, for garnish"
base_recipes:
  - recipe_name: "lemonade Base Syrup"
    quantity: 0.25
    unit: "cup"
instructions: |
  #### Preparation
  1. Pour the lemonade base syrup into a glass.
  2. Fill with cold water and ice, stir well.
  3. Garnish with a lemon slice.
notes: |
  This recipe references "Lemonade Base Syrup" as a base recipe — try scaling the servings here and watch the base recipe's contribution scale with it.
tags:
  - "drink"
  - "example"
cooked_dates: []
---
`,
	},
];

const EXAMPLE_TEMPLATES: ExampleFile[] = [
	{
		relativePath: 'Cocktails.md',
		content: `---
base_servings: 1
servings_label: "glass"
requires_cooking: false
made_before_tracking: false
ingredients: []
default_subfolder: "Tuto examples/Cocktails"
instructions: |
  #### Preparation
tags:
  - "cocktail"
---
`,
	},
];

async function writeExampleFiles(app: App, baseFolder: string, files: ExampleFile[]): Promise<number> {
	const examplesFolder = `${baseFolder}/Tuto examples`;
	await ensureFolderExists(app, examplesFolder);

	let count = 0;
	for (const file of files) {
		const path = `${examplesFolder}/${file.relativePath}`;
		if (app.vault.getAbstractFileByPath(path)) continue;
		await app.vault.create(path, file.content);
		count++;
	}
	return count;
}

export interface LoadExampleDataSettings {
	ingredientsFolder: string;
	recipesFolder: string;
	recipeTemplatesFolder: string;
}

// Populates the vault with a small set of example ingredients, recipes, and
// a template — written into an "Examples" subfolder under each configured
// folder, so they're easy to find and delete as a group once no longer
// needed. Never overwrites existing files with the same name (skips them
// silently), so running this command again after editing an example is safe.
export async function loadExampleData(app: App, settings: LoadExampleDataSettings): Promise<void> {
	const ingredientsExamplesPath = `${settings.ingredientsFolder}/Tuto examples`;

	if (app.vault.getAbstractFileByPath(ingredientsExamplesPath)) {
		new Notice(`Example data already exists at "${ingredientsExamplesPath}". Delete that folder first if you want to reload the examples from scratch.`);
		return;
	}

	const ingredientCount = await writeExampleFiles(app, settings.ingredientsFolder, EXAMPLE_INGREDIENTS);

	// Pre-create the "Cocktails" subfolder the example template points to
	// (via default_subfolder), so it's visible right away even before the
	// user has saved any recipe into it.
	await ensureFolderExists(app, `${settings.recipesFolder}/Tuto examples/Cocktails`);

	const recipeCount = await writeExampleFiles(app, settings.recipesFolder, EXAMPLE_RECIPES);
	const templateCount = await writeExampleFiles(app, settings.recipeTemplatesFolder, EXAMPLE_TEMPLATES);


	new Notice(
		`Example data loaded: ${ingredientCount} ingredients, ${recipeCount} recipes, ${templateCount} template — see the "Examples" subfolder in each of your configured folders.`
	);
}

