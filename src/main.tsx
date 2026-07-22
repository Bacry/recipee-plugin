import { Plugin, WorkspaceLeaf } from 'obsidian';
import {
	DEFAULT_SETTINGS,
	MyPluginSettings,
	SampleSettingTab,
} from './settings';
import { IngredientView, INGREDIENT_VIEW_TYPE } from './views/IngredientView';
import { NewIngredientView, NEW_INGREDIENT_VIEW_TYPE } from './views/NewIngredientView';
import { ShoppingListView, SHOPPING_LIST_VIEW_TYPE } from './views/ShoppingListView';
import { RecipeView, RECIPE_VIEW_TYPE } from './views/RecipeView';
import { NewRecipeView, NEW_RECIPE_VIEW_TYPE } from './views/NewRecipeView';

export default class MyPlugin extends Plugin {
	settings!: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.registerView(
			INGREDIENT_VIEW_TYPE,
			(leaf: WorkspaceLeaf) => new IngredientView(leaf, this),
		);

		this.registerView(
			NEW_INGREDIENT_VIEW_TYPE,
			(leaf: WorkspaceLeaf) => new NewIngredientView(leaf, this),
		);

		this.registerView(
			RECIPE_VIEW_TYPE,
			(leaf: WorkspaceLeaf) => new RecipeView(leaf, this),
		);

		this.registerView(
			SHOPPING_LIST_VIEW_TYPE,
			(leaf: WorkspaceLeaf) => new ShoppingListView(leaf, this),
		);

		this.registerView(
			NEW_RECIPE_VIEW_TYPE,
			(leaf: WorkspaceLeaf) => new NewRecipeView(leaf, this),
		);

		this.addCommand({
			id: 'create-new-recipe',
			name: 'Create new recipe',
			callback: () => {
				this.activateNewRecipeView();
			},
		});

		this.addCommand({
			id: 'open-recipe-view',
			name: 'Open recipe view for current note',
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				if (!file) return false;

				const folder = this.settings.recipesFolder;
				if (!file.path.startsWith(folder + '/')) return false;

				if (!checking) {
					this.activateRecipeView(file.path);
				}
				return true;
			},
		});

		this.addCommand({
			id: 'open-ingredient-view',
			name: 'Open ingredient view for current note',
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				if (!file) return false;

				const folder = this.settings.ingredientsFolder;
				if (!file.path.startsWith(folder + '/')) return false;

				if (!checking) {
					this.activateIngredientView(file.path);
				}
				return true;
			},
		});

		this.addCommand({
			id: 'create-new-ingredient',
			name: 'Create new ingredient',
			callback: () => {
				this.activateNewIngredientView();
			},
		});

		this.addCommand({
			id: 'open-shopping-list',
			name: 'Open shopping list',
			callback: () => {
				this.activateShoppingListView();
			},
		});

		this.addCommand({
			id: 'create-new-cocktail',
			name: 'Create new cocktail',
			callback: () => {
				this.activateNewRecipeView(true);
			},
		});

		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	// Opens IngredientView by transforming the CURRENTLY ACTIVE leaf in place
	// (rather than reusing/creating a dedicated IngredientView leaf elsewhere).
	// This is what allows multiple independent tabs: if the user has two notes
	// open in two tabs and runs this command on each, they get two separate
	// IngredientView instances, each with its own leaf and its own history.
	// Started with an empty history since this is a fresh, direct open — not a
	// navigation from another one of our views (see navigation.ts for that case).
	async activateIngredientView(filePath: string) {
		const { workspace } = this.app;
		const leaf = workspace.getLeaf(false);

		await leaf.setViewState({
			type: INGREDIENT_VIEW_TYPE,
			active: true,
			state: { filePath, history: [] },
		});

		workspace.revealLeaf(leaf);
	}

	// Same "transform active leaf, fresh history" pattern as activateIngredientView.
	async activateNewIngredientView(prefilledName?: string) {
		const { workspace } = this.app;
		const leaf = workspace.getLeaf(false);

		await leaf.setViewState({
			type: NEW_INGREDIENT_VIEW_TYPE,
			active: true,
			state: { prefilledName, history: [] },
		});

		workspace.revealLeaf(leaf);
	}

	// Same pattern again.
	async activateRecipeView(filePath: string) {
		const { workspace } = this.app;
		const leaf = workspace.getLeaf(false);

		await leaf.setViewState({
			type: RECIPE_VIEW_TYPE,
			active: true,
			state: { filePath, history: [] },
		});

		workspace.revealLeaf(leaf);
	}

	// ShoppingListView doesn't currently navigate to/from other views, but it
	// still gets an empty history for consistency with NavigableViewState —
	// harmless now, and ready if it ever needs to participate in navigation later.
	async activateShoppingListView() {
		const { workspace } = this.app;
		const leaf = workspace.getLeaf(false);

		await leaf.setViewState({
			type: SHOPPING_LIST_VIEW_TYPE,
			active: true,
			state: { history: [] },
		});

		workspace.revealLeaf(leaf);
	}

	// Opens NewRecipeView in creation mode (no editFilePath), transforming the
// active leaf. Fresh history since this is a direct open, not a navigation
// from another one of our views.
	async activateNewRecipeView(isCocktail = false) {
		const { workspace } = this.app;
		const leaf = workspace.getLeaf(false);

		await leaf.setViewState({
			type: NEW_RECIPE_VIEW_TYPE,
			active: true,
			state: { isCocktail, history: [] },
		});

		workspace.revealLeaf(leaf);
	}


	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<MyPluginSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
