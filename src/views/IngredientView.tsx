import { ItemView, WorkspaceLeaf, TFile, Notice, App } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { parseIngredientFromFrontmatter } from '../models/parseIngredientFromFrontmatter';
import type MyPlugin from '../main';
import { NavigableViewState, NavigationEntry, canNavigateBack, closeOrGoBack, navigateTo } from '../navigation';
import { upperFirstLetter } from '../models/textNormalize';
import { findRecipesUsingIngredient } from '../models/findRecipesUsingIngredient';
import { RECIPE_VIEW_TYPE } from './RecipeView';
import { updateIngredient } from "../models/ingredientPersistence";
import {IngredientDetails} from "../components/IngredientDetails";
import {ingredientToFormValues} from "../models/ingredientToFormValues";
import { createRef } from 'react';
import { IngredientForm, IngredientFormHandle } from '../components/IngredientForm';
import { findRecipeFileByName } from '../models/findRecipeFile';

export const INGREDIENT_VIEW_TYPE = 'ingredient-view';

// This view's state now includes `history` (via NavigableViewState), on top
// of its own specific field (filePath). See navigation.ts for the full
// explanation of how back-navigation works across all our views.
interface IngredientViewState extends NavigableViewState {
	filePath?: string;
}

export class IngredientView extends ItemView {
	private filePath?: string;
	private history: NavigationEntry[] = [];
	private root: Root | null = null;
	private plugin: MyPlugin;
	private isEditing = false;
	private modifyAction!: HTMLElement;
	private closeAction!: HTMLElement;
	private saveAction!: HTMLElement;
	private formRef = createRef<IngredientFormHandle>();

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return INGREDIENT_VIEW_TYPE;
	}

	getDisplayText(): string {
		if (!this.filePath) {
			return this.isEditing
				? "Modification de l’ingrédient"
				: "Ingrédient";
		}

		const file =
			this.app.vault.getAbstractFileByPath(this.filePath);

		const name =
			file instanceof TFile
				? upperFirstLetter(file.basename)
				: "Ingrédient";

		return this.isEditing
			? `Modification — ${name}`
			: name;
	}

	private updateTitle(): void {
		const title = this.getDisplayText();

		this.titleEl.setText(title);
		this.leaf.updateHeader();
	}

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

	async setState(
		state: IngredientViewState,
		result: unknown
	): Promise<void> {
		this.filePath = state.filePath;
		this.history = state.history ?? [];
		this.updateModifyButton();
		this.updateCloseAction();

		await super.setState(state, result as never);

		if (this.root) {
			this.render();
		}

		this.updateTitle();
	}

	getState(): IngredientViewState {
		return { filePath: this.filePath, history: this.history };
	}

	private updateSaveButtonVisibility(): void {
		if (!this.saveAction) return;
		this.saveAction.style.display = this.isEditing ? '' : 'none';
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		this.root = createRoot(container);

		this.registerEvent(
			this.app.metadataCache.on('changed', (file) => {
				if (file.path === this.filePath) {
					this.render();
				}
			})
		);

		/* If needed we add a modifying button */
		this.modifyAction = this.addAction(
			'pencil',
			"Modifier l'ingrédient",
			() => {
				this.setEditing(true);
			}
			);
		this.modifyAction.addClass('recipe-ingredient-view-actions');

		/* Adding the close button */
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

		this.saveAction = this.addAction(
			'save',
			'Enregistrer les modifications',
			() => {
				this.formRef.current?.triggerSubmit();
			}
		);
		this.saveAction.addClass('recipe-ingredient-view-actions');
		this.updateSaveButtonVisibility();


		if (this.filePath) {
			this.render();
		}
	}

	handleRecipeClick(recipeName: string) {
		const file = findRecipeFileByName(this.app, this.plugin.settings.recipesFolder, recipeName);
		if (!file) return;
		navigateTo(this.leaf, RECIPE_VIEW_TYPE, { filePath: file.path });
	}

	// If we got here by navigating from another view (history is non-empty),
	// go back to that view. Otherwise (opened fresh, e.g. via command), just
	// close this leaf — there's nothing in our navigation stack to return to.
	handleClose() {
		closeOrGoBack(this.leaf, this.history);
	}

	// Called when the edit form is submitted: moves the file if its type (and
	// thus its target subfolder) changed, then overwrites its content.
	async handleSave(
		values: IngredientFormValues
	): Promise<void> {
		if (!this.filePath) {
			new Notice("Aucun fichier ingrédient sélectionné.");
			return;
		}

		const file = this.app.vault.getAbstractFileByPath(
			this.filePath
		);

		if (!(file instanceof TFile)) {
			new Notice("Le fichier ingrédient est introuvable.");
			return;
		}

		try {
			const updatedFile = await updateIngredient({
				app: this.app,
				ingredientsFolder:
				this.plugin.settings.ingredientsFolder,
				file,
				values,
			});

			// Important si le fichier a été déplacé ou renommé.
			this.filePath = updatedFile.path;

			this.isEditing = false;
			this.updateModifyButton();
			this.updateSaveButtonVisibility();
			this.updateTitle();

			new Notice(
				`Ingrédient "${updatedFile.basename}" mis à jour.`
			);

			this.render();
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Impossible de modifier l’ingrédient.";

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

		const {ingredient, errors, warnings} = parseIngredientFromFrontmatter(
			frontmatter,
			file.basename,
			this.plugin.settings.ingredientTypes,
			this.plugin.settings.shopSections,
		);

		if (errors.length > 0) {
			this.root.render(
				<div>
					<h4>Cette note contient des erreurs :</h4>
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
				<IngredientForm
					ref={this.formRef}
					app={this.app}
					onSubmit={(values) => this.handleSave(values)}
					ingredientTypes={this.plugin.settings.ingredientTypes}
					shopSections={this.plugin.settings.shopSections}
					dietFlags={this.plugin.settings.dietFlags}
					fruitIngredientTypes={this.plugin.settings.fruitIngredientTypes}
					usdaApiKey={this.plugin.settings.usdaApiKey}
					initialValues={ingredientToFormValues(ingredient)}
					submitLabel="Enregistrer les modifications"
					autoSearchOnMount = {false}
				/>
			);
		}
		else {
			this.root.render(
				<IngredientDetails
					name={ingredient.name}
					type={ingredient.type}
					shopSection={ingredient.shop_section}
					densityGMl={ingredient.density_g_ml}
					entityWeightG={ingredient.entity_weight_g}
					brand={ingredient.brand}
					possibleForms={ingredient.possible_forms}
					dietFlags={ingredient.diet_flags}
					juiceYieldMl={ingredient.juice_yield_ml}
					nutrition={ingredient.nutrition_per_100g}
					usedInRecipes={findRecipesUsingIngredient(this.app, this.plugin.settings.recipesFolder, file.basename)}
					onRecipeClick={(name) => this.handleRecipeClick(name)}
					oilIngredientTypes={this.plugin.settings.oilIngredientTypes}
				/>
			)
		}
	}

	async onClose() {
		this.root?.unmount();
	}
}
