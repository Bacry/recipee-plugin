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

		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.addCommand({
			id: 'open-ingredient-view',
			name: 'Open ingredient view for current note',
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				if (!file) return false; // pas de note ouverte → commande indisponible

				const folder = this.settings.ingredientsFolder;
				if (!file.path.startsWith(folder + '/')) return false; // note pas dans Ingredients/ → indisponible

				if (!checking) {
					this.activateIngredientView(file.path); // exécution réelle, seulement si ce n'est pas juste une vérification
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

		this.registerView(
			SHOPPING_LIST_VIEW_TYPE,
			(leaf: WorkspaceLeaf) => new ShoppingListView(leaf, this),
		);

		this.addCommand({
			id: 'open-shopping-list',
			name: 'Open shopping list',
			callback: () => {
				this.activateShoppingListView();
			},
		});
	}

	async activateIngredientView(filePath: string, returnToPath?: string) {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(INGREDIENT_VIEW_TYPE)[0];

		if (!leaf) {
			leaf = workspace.getLeaf(true);
		}

		await leaf.setViewState({
			type: INGREDIENT_VIEW_TYPE,
			active: true,
			state: { filePath, returnToPath },
		});

		workspace.revealLeaf(leaf);
	}

	async activateNewIngredientView(prefilledName?: string, returnToPath?: string) {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(NEW_INGREDIENT_VIEW_TYPE)[0];

		if (!leaf) {
			leaf = workspace.getLeaf(true);
		}

		await leaf.setViewState({
			type: NEW_INGREDIENT_VIEW_TYPE,
			active: true,
			state: { prefilledName, returnToPath },
		});

		workspace.revealLeaf(leaf);
	}

	async activateRecipeView(filePath: string) {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(RECIPE_VIEW_TYPE)[0];

		if (!leaf) {
			leaf = workspace.getLeaf(true);
		}

		await leaf.setViewState({
			type: RECIPE_VIEW_TYPE,
			active: true,
			state: { filePath },
		});

		workspace.revealLeaf(leaf);
	}


	async activateShoppingListView() {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(SHOPPING_LIST_VIEW_TYPE)[0];

		if (!leaf) {
			leaf = workspace.getLeaf(true);
			await leaf.setViewState({ type: SHOPPING_LIST_VIEW_TYPE, active: true });
		}

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
