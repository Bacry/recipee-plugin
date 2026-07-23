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
import { TFile } from 'obsidian';
import { TemplatePickerModal } from './components/TemplatePickerModal';
import { templateToFormValues } from './models/recipeTemplateConversion';
import { parseRecipeFromFrontmatter } from './models/parseRecipe';
import { RecipeFormValues } from './components/RecipeForm';
import { parseRecipeTemplate } from './models/parseRecipe';
import { addIcon } from 'obsidian';



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
				this.createNewRecipe();
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

		this.addRibbonIcon('shopping-cart', 'Open shopping list', () => {
			this.activateShoppingListView();
		});

// Custom "chef hat with a plus" icon, since no built-in Lucide icon combines
// both. Roughly traces a simple chef's hat shape, with a "+" badge overlaid
// in the bottom-right corner to signal "create new".
// Lucide's actual "chef-hat" path (24x24 viewBox), with a small "+" badge
// overlaid in the bottom-right corner to signal "create new" — since no
// built-in icon combines both concepts.
		addIcon('chef-hat-plus', `
	<g transform="scale(4.1666)">
		<path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
		<line x1="6" x2="18" y1="17" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
	</g>
	<circle cx="82" cy="82" r="22" fill="currentColor"/>
	<line x1="82" y1="71" x2="82" y2="93" stroke="var(--background-primary)" stroke-width="5" stroke-linecap="round"/>
	<line x1="71" y1="82" x2="93" y2="82" stroke="var(--background-primary)" stroke-width="5" stroke-linecap="round"/>
`);

		this.addRibbonIcon('chef-hat-plus', 'Create new recipe', () => {
			this.createNewRecipe();
		});

		// Lucide's actual "carrot" path (24x24 viewBox), with a small "+" badge
// overlaid in the bottom-right corner to signal "create new".
		addIcon('carrot-plus', `
	<g transform="scale(4.1666)">
		<path d="M15 16a1 1 0 0 0-7-7q-4 4-5.987 12.385a.5.5 0 0 0 .602.602Q11 20 15 16l-3-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
		<path d="M15 9q4 4 7 0-3-4-7 0 4-4 0-7-4 3 0 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
		<path d="m8 15-2.58-2.58" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
	</g>
	<circle cx="82" cy="82" r="22" fill="currentColor"/>
	<line x1="82" y1="71" x2="82" y2="93" stroke="var(--background-primary)" stroke-width="5" stroke-linecap="round"/>
	<line x1="71" y1="82" x2="93" y2="82" stroke="var(--background-primary)" stroke-width="5" stroke-linecap="round"/>
`);
		this.addRibbonIcon('carrot-plus', 'Create new ingredient', () => {
			this.activateNewIngredientView();
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

		// If a shopping list view is already open somewhere, just reveal it
		// instead of creating/transforming another leaf into a duplicate.
		const existing = workspace.getLeavesOfType(SHOPPING_LIST_VIEW_TYPE)[0];
		if (existing) {
			workspace.revealLeaf(existing);
			return;
		}

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
	async activateNewRecipeView() {
		const { workspace } = this.app;
		const leaf = workspace.getLeaf(false);

		await leaf.setViewState({
			type: NEW_RECIPE_VIEW_TYPE,
			active: true,
			state: { history: [] },
		});

		workspace.revealLeaf(leaf);
	}


	// Entry point for "Create new recipe": if at least one template exists in
// the templates folder, opens a fuzzy picker to choose one (prefilling the
// form from it); otherwise opens a blank form directly, with no picker step.
	createNewRecipe() {
		const templatesFolder = this.settings.recipeTemplatesFolder;
		const templates = this.app.vault
			.getMarkdownFiles()
			.filter((f: TFile) => f.path.startsWith(templatesFolder + '/') || f.parent?.path === templatesFolder);

		if (templates.length === 0) {
			this.activateNewRecipeView();
			return;
		}

		new TemplatePickerModal(this.app, templates, (templateFile) => {
			const frontmatter = this.app.metadataCache.getFileCache(templateFile)?.frontmatter;
			const templateRecipe = parseRecipeTemplate(frontmatter, templateFile.basename);

			const defaultSubfolder = typeof frontmatter?.default_subfolder === 'string'
				? frontmatter.default_subfolder
				: undefined;

			this.activateNewRecipeViewFromTemplate(templateToFormValues(templateRecipe, defaultSubfolder), templateFile.path);		}).open();
	}

	async activateNewRecipeViewFromTemplate(prefilledValues: RecipeFormValues, templateKey: string) {
		const { workspace } = this.app;
		const leaf = workspace.getLeaf(false);

		await leaf.setViewState({
			type: NEW_RECIPE_VIEW_TYPE,
			active: true,
			state: { prefilledValues, templateKey, history: [] },
		});

		workspace.revealLeaf(leaf);
	}

	onunload() {}

	async loadSettings() {
		const loaded = (await this.loadData()) as Partial<MyPluginSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded);

		// Guard against empty-string values that may have been persisted by
		// mistake in the past (e.g. from a settings field's onChange firing
		// with '' before the user typed anything) — these should never silently
		// override a sensible default.
		if (this.settings.recipeTemplatesFolder.trim() === '') {
			this.settings.recipeTemplatesFolder = DEFAULT_SETTINGS.recipeTemplatesFolder;
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
