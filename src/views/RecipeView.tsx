import { ItemView, WorkspaceLeaf, TFile, Notice } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { parseRecipeFromFrontmatter } from '../models/parseRecipe';
import { RecipeDetails } from '../components/RecipeDetails';
import { RecipeForm, RecipeFormValues } from '../components/RecipeForm';
import { INGREDIENT_VIEW_TYPE } from './IngredientView';
import { NEW_INGREDIENT_VIEW_TYPE } from './NewIngredientView';
import { findUnit, convertQuantity } from '../models/units';
import type MyPlugin from '../main';
import { addRecipeToShoppingList, isRecipeAlreadyInShoppingList } from '../models/addRecipeToShoppingList';
import { SHOPPING_LIST_VIEW_TYPE } from './ShoppingListView';
import { Recipe } from '../models/recipe';
import { findRecipeFileByName } from '../models/findRecipeFile';
import { findIngredientFileByName } from '../models/findIngredientFile';
import { upperFirstLetter } from '../models/textNormalize';
import { recipeToFormValues, formValuesToRecipe } from '../models/recipeFormConversion';
import { updateRecipe } from '../models/recipePersistence';
import { ErrorModal } from '../components/ErrorModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { buildRecipeMarkdown } from '../models/buildRecipeMarkdown'
import { recordRecipeCookedToday } from '../models/recordRecipeCooked';
import { NavigableViewState, NavigationEntry, closeOrGoBack, navigateTo, canNavigateBack } from '../navigation';
import { createRef } from 'react';
import { RecipeForm, RecipeFormValues, RecipeFormHandle } from '../components/RecipeForm';
import { recordRecipeCookedTodayRecursive } from '../models/recordRecipeCookedRecursive';
import { propagateMadeBeforeTracking } from '../models/propagateMadeBeforeTracking';

export const RECIPE_VIEW_TYPE = 'recipe-view';

interface RecipeViewState extends NavigableViewState {
	filePath?: string;
	initialServings?: number; // set when opened as a base recipe, scaled to the quantity used by the parent
	readOnly?: boolean;
}

export class RecipeView extends ItemView {
	private filePath?: string;
	private initialServings?: number;
	private history: NavigationEntry[] = [];
	private root: Root | null = null;
	private plugin: MyPlugin;
	private readOnly = false;
	private isEditing = false;
	private modifyAction!: HTMLElement; // set in onOpen, before any code that reads it runs
	private closeAction!: HTMLElement;
	private saveAction!: HTMLElement;
	private formRef = createRef<RecipeFormHandle>();

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return RECIPE_VIEW_TYPE;
	}

	getDisplayText(): string {
		if (!this.filePath) {
			return this.isEditing ? 'Modification de la recette' : 'Recette';
		}

		const file = this.app.vault.getAbstractFileByPath(this.filePath);
		const name = file instanceof TFile ? upperFirstLetter(file.basename) : 'Recette';

		return this.isEditing ? `Modification — ${name}` : name;
	}

	private updateTitle(): void {
		this.titleEl.setText(this.getDisplayText());
		this.leaf.updateHeader();
	}

	private updateSaveButtonVisibility(): void {
		if (!this.saveAction) return;
		this.saveAction.style.display = this.isEditing ? '' : 'none';
	}

	// Disables the pencil button while already editing, or while read-only
	// (opened as a base recipe reference from another recipe).
	private updateModifyButton(): void {
		if (!this.modifyAction) return;

		this.modifyAction.toggleClass(
			"is-disabled",
			this.isEditing
		);

		this.modifyAction.setAttribute(
			"aria-disabled",
			this.isEditing ? "true" : "false"
		);
	}

	private updateCloseAction(): void {
		if (!this.closeAction) return;
		this.closeAction.setAttribute('aria-label', canNavigateBack({ history: this.history }) ? 'Retour' : 'Fermer');
	}

	private setEditing(isEditing: boolean): void {
		this.isEditing = isEditing;
		this.updateModifyButton();
		this.updateSaveButtonVisibility();
		this.updateTitle();
		this.render();
	}

	async setState(state: RecipeViewState, result: unknown): Promise<void> {
		this.filePath = state.filePath;
		this.initialServings = state.initialServings;
		this.readOnly = state.readOnly ?? false;
		this.history = state.history ?? [];
		this.updateModifyButton();
		this.updateModifyButton();
		this.updateCloseAction();


		await super.setState(state, result as never);

		if (this.root) {
			this.render();
		}

		this.updateTitle();
	}

	getState(): RecipeViewState {
		return {
			filePath: this.filePath,
			initialServings: this.initialServings,
			readOnly: this.readOnly,
			history: this.history,
		};
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		this.root = createRoot(container);

		const imagesFolder = this.plugin.settings.recipeImagesFolder;
		if (!this.app.vault.getAbstractFileByPath(imagesFolder)) {
			await this.app.vault.createFolder(imagesFolder);
		}

		this.registerEvent(
			this.app.metadataCache.on('changed', (file) => {
				if (file.path === this.filePath) {
					this.render();
				}
			})
		);

		this.modifyAction = this.addAction('pencil', 'Modifier la recette', () => {
			this.setEditing(true);
		});
		this.modifyAction.addClass('recipe-ingredient-view-actions');

		this.closeAction = this.addAction(
			'arrow-left',
			'Fermer',
			() => {
				if (this.isEditing) {
					this.setEditing(false);
					return;
				}
				this.handleClose();
			}
		);
		this.closeAction.addClass('ingredient-recipe-view-actions');

		this.saveAction = this.addAction('save', 'Enregistrer les modifications', () => {
			this.formRef.current?.triggerSubmit();
		});
		this.saveAction.addClass('recipe-ingredient-view-actions');
		this.updateSaveButtonVisibility();

		if (this.filePath) {
			this.render();
		}
	}

	handleIngredientClick(ingredientName: string) {
		const file = findIngredientFileByName(this.app, this.plugin.settings.ingredientsFolder, ingredientName);

		if (file) {
			navigateTo(this.leaf, INGREDIENT_VIEW_TYPE, { filePath: file.path });
		} else {
			navigateTo(this.leaf, NEW_INGREDIENT_VIEW_TYPE, { prefilledName: ingredientName });
		}
	}

	ingredientExists(ingredientName: string): boolean {
		return findIngredientFileByName(this.app, this.plugin.settings.ingredientsFolder, ingredientName) !== null;
	}

	handleBaseRecipeClick(recipeName: string, scaledQuantity: number, unit: string) {
		const file = findRecipeFileByName(this.app, this.plugin.settings.recipesFolder, recipeName);
		if (!file) return;

		let initialServings: number | undefined;
		const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
		const { recipe: baseRecipe } = parseRecipeFromFrontmatter(frontmatter, file.basename);
		if (baseRecipe) {
			const fromUnit = unit === '' ? null : findUnit(unit);
			const targetUnit = findUnit(baseRecipe.servingsLabel);
			const converted = convertQuantity(scaledQuantity, fromUnit, targetUnit);
			if (converted !== null) {
				initialServings = converted;
			}
		}

		navigateTo(this.leaf, RECIPE_VIEW_TYPE, { filePath: file.path, initialServings, readOnly: true });
	}

	async handleShop(servings: number) {
		if (!this.filePath) return;
		const file = this.app.vault.getAbstractFileByPath(this.filePath);
		if (!(file instanceof TFile)) return;

		const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
		const { recipe } = parseRecipeFromFrontmatter(frontmatter, file.basename);
		if (!recipe) return;

		const shoppingListPath = this.plugin.settings.shoppingListPath;

		let shoppingListFile = this.app.vault.getAbstractFileByPath(shoppingListPath);
		if (!(shoppingListFile instanceof TFile)) {
			shoppingListFile = await this.app.vault.create(shoppingListPath, '---\nitems: []\nrecipes: []\n---\n');
		}

		const alreadyAdded = await isRecipeAlreadyInShoppingList(this.app, shoppingListPath, recipe.name);

		if (alreadyAdded) {
			new ConfirmModal(
				this.app,
				`"${recipe.name}" est déjà dans votre liste de courses. Ajouter quand même ?`,
				async () => {
					await this.performShop(recipe, servings, shoppingListPath);
				}
			).open();
		} else {
			await this.performShop(recipe, servings, shoppingListPath);
		}
	}

	async performShop(recipe: Recipe, servings: number, shoppingListPath: string) {
		const { warnings } = await addRecipeToShoppingList(
			this.app,
			shoppingListPath,
			this.plugin.settings.ingredientsFolder,
			this.plugin.settings.recipesFolder,
			this.plugin.settings.otherItemsNotePath,
			recipe,
			servings
		);

		if (warnings.length > 0) {
			new Notice(`Ajouté avec ${warnings.length} avertissement(s) — voir la console.`);
			console.warn('Shop warnings:', warnings);
		} else {
			new Notice(`"${recipe.name}" ajouté à la liste de courses.`);
		}

		const { workspace } = this.app;
		const existing = workspace.getLeavesOfType(SHOPPING_LIST_VIEW_TYPE)[0];
		if (existing) {
			workspace.revealLeaf(existing);
		} else {
			const leaf = workspace.getLeaf(false);
			await leaf.setViewState({
				type: SHOPPING_LIST_VIEW_TYPE,
				active: true,
				state: { history: [] },
			});
			workspace.revealLeaf(leaf);
		}
	}

	async handleMarkCookedToday() {
		if (!this.filePath) return;
		const file = this.app.vault.getAbstractFileByPath(this.filePath);
		if (!(file instanceof TFile)) return;

		const result = await recordRecipeCookedTodayRecursive(this.app, this.plugin.settings.recipesFolder, file);

		if (result.recordedNames.length === 0) {
			new Notice('Déjà marquée comme réalisée aujourd\'hui.');
		} else {
			new Notice(`Réalisée aujourd'hui : ${result.recordedNames.join(', ')}.`);
		}

		this.render();
	}

	handleClose() {
		closeOrGoBack(this.leaf, this.history);
	}

	async handleSaveNotes(newContent: string) {
		if (!this.filePath) return;
		const file = this.app.vault.getAbstractFileByPath(this.filePath);
		if (!(file instanceof TFile)) return;

		const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
		const { recipe } = parseRecipeFromFrontmatter(frontmatter, file.basename);
		if (!recipe) return;

		const updatedRecipe = { ...recipe, notes: newContent };
		await this.app.vault.modify(file, buildRecipeMarkdown(updatedRecipe));
	}

	// Called when the inline edit form is submitted: validates, moves the
	// file if its name/subfolder changed, then overwrites its content.
	async handleSave(values: RecipeFormValues) {
		const { recipe, errors } = formValuesToRecipe(values);

		if (errors.length > 0) {
			new ErrorModal(this.app, errors).open();
			return;
		}

		if (!this.filePath) return;
		const file = this.app.vault.getAbstractFileByPath(this.filePath);
		if (!(file instanceof TFile)) return;

		// Preserve the existing cooked_dates history — the edit form never
		// touches this field, so re-read it from disk rather than letting
		// formValuesToRecipe's empty default silently wipe it out.
		const existingFrontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
		const { recipe: existingRecipe } = parseRecipeFromFrontmatter(existingFrontmatter, file.basename);
		const recipeWithHistory = { ...recipe!, cookedDates: existingRecipe?.cookedDates ?? [] };

		try {
			const updatedFile = await updateRecipe({
				app: this.app,
				recipesFolder: this.plugin.settings.recipesFolder,
				file,
				recipe: recipeWithHistory,
				subfolder: values.subfolder,
			});

			this.filePath = updatedFile.path;
			this.isEditing = false;
			this.updateModifyButton();
			this.updateSaveButtonVisibility();
			this.updateTitle();

			new Notice(`Recette "${updatedFile.basename}" mise à jour.`);
			if (recipeWithHistory.madeBeforeTracking) {
				await propagateMadeBeforeTracking(this.app, this.plugin.settings.recipesFolder, recipeWithHistory.baseRecipes);
			}
			this.render();
		} catch (error) {
			const message = error instanceof Error ? error.message : "Impossible de modifier la recette.";
			new Notice(message);
		}
	}

	render() {
		if (!this.root) return;

		if (!this.filePath) {
			this.root.render(<p>Aucun fichier sélectionné.</p>);
			return;
		}

		const file = this.app.vault.getAbstractFileByPath(this.filePath);
		if (!(file instanceof TFile)) {
			this.root.render(<p>Fichier introuvable : {this.filePath}</p>);
			return;
		}

		const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
		const { recipe, errors, warnings } = parseRecipeFromFrontmatter(frontmatter, file.basename);

		if (errors.length > 0) {
			this.root.render(
				<div>
					<h4>Cette recette contient des erreurs :</h4>
					<ul>
						{errors.map((error, index) => (
							<li key={index} className="recipe-ingredient-validation-error">{error}</li>
						))}
					</ul>
				</div>
			);
			return;
		}

		if (this.isEditing) {
			this.root.render(
				<RecipeForm
					ref={this.formRef}
					app={this.app}
					recipesFolder={this.plugin.settings.recipesFolder}
					ingredientsFolder={this.plugin.settings.ingredientsFolder}
					recipeImagesFolder={this.plugin.settings.recipeImagesFolder}
					anthropicApiKey={this.plugin.settings.anthropicApiKey}
					anthropicModel={this.plugin.settings.anthropicModel}
					onSubmit={(values) => this.handleSave(values)}
					initialValues={recipeToFormValues(recipe!, this.filePath, this.plugin.settings.recipesFolder)}
					submitLabel="Enregistrer les modifications"
				/>
			);
			return;
		}

		this.root.render(
			<div>
				{warnings.length > 0 && (
					<ul className="ingredient-validation-warnings">
						{warnings.map((warning, index) => (
							<li key={index}>{warning}</li>
						))}
					</ul>
				)}
				<RecipeDetails
					app={this.app}
					recipe={recipe!}
					ingredientsFolder={this.plugin.settings.ingredientsFolder}
					recipesFolder={this.plugin.settings.recipesFolder}
					initialServings={this.initialServings}
					onIngredientClick={(name) => this.handleIngredientClick(name)}
					ingredientExists={(name) => this.ingredientExists(name)}
					onBaseRecipeClick={(name, qty, unit) => this.handleBaseRecipeClick(name, qty, unit)}
					onSaveNotes={(content) => this.handleSaveNotes(content)}
					onShop={(servings) => this.handleShop(servings)}
					onMarkCookedToday={() => this.handleMarkCookedToday()}
				/>
			</div>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
