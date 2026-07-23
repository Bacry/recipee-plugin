import { App, TFile } from 'obsidian';
import { Recipe } from './recipe';
import { ShoppingList } from './ShoppingList';
import { parseShoppingList } from './parseShoppingList';
import { buildShoppingListMarkdown } from './buildShoppingListMarkdown';
import { flattenRecipeIngredients } from './flattenRecipeIngredients';
import { addSingleIngredientToShoppingList } from './addSingleIngredientToShoppingList';

function generateId(): string {
	return Math.random().toString(36).slice(2, 10);
}

export interface AddRecipeResult {
	success: boolean;
	warnings: string[];
}

export async function addRecipeToShoppingList(
	app: App,
	shoppingListPath: string,
	ingredientsFolder: string,
	recipesFolder: string,
	otherItemsNotePath: string,
	recipe: Recipe,
	servings: number
): Promise<AddRecipeResult> {
	const file = app.vault.getAbstractFileByPath(shoppingListPath);
	if (!(file instanceof TFile)) {
		throw new Error(`Shopping list file not found at ${shoppingListPath}`);
	}

	const scaleFactor = recipe.baseServings > 0 ? servings / recipe.baseServings : 1;
	const { ingredients: flattened, warnings } = flattenRecipeIngredients(
		app, ingredientsFolder, recipesFolder, recipe, scaleFactor
	);

	const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
	const { list } = parseShoppingList(frontmatter);

	const recipeEntryId = generateId();

	let updatedItems = list.items;
	for (const ing of flattened) {
		updatedItems = await addSingleIngredientToShoppingList(
			app,
			ingredientsFolder,
			otherItemsNotePath,
			updatedItems,
			{
				name: ing.ingredientName,
				complement: '',
				quantity: ing.quantity,
				unit: ing.unit,
				source: `recipe:${recipeEntryId}`,
			}
		);
	}

	const updatedList: ShoppingList = {
		items: updatedItems,
		recipes: [...list.recipes, { id: recipeEntryId, recipeName: recipe.name, servings }],
	};

	await app.vault.modify(file, buildShoppingListMarkdown(updatedList));

	return { success: true, warnings };
}

export async function isRecipeAlreadyInShoppingList(
	app: App,
	shoppingListPath: string,
	recipeName: string
): Promise<boolean> {
	const file = app.vault.getAbstractFileByPath(shoppingListPath);
	if (!(file instanceof TFile)) return false;

	const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
	const { list } = parseShoppingList(frontmatter);

	return list.recipes.some((r) => r.recipeName.toLowerCase() === recipeName.toLowerCase());
}
