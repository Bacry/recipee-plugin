import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { RecipeForm, RecipeFormValues,RecipeFormHandle } from '../components/RecipeForm';
import { formValuesToRecipe } from '../models/recipeFormConversion';
import { ErrorModal } from '../components/ErrorModal';
import { NavigableViewState, NavigationEntry, closeOrGoBack, canNavigateBack } from '../navigation';
import { RECIPE_VIEW_TYPE } from './RecipeView';
import type MyPlugin from '../main';
import { createRecipe } from '../models/recipePersistence';
import { createRef } from 'react';
import { propagateMadeBeforeTracking } from '../models/propagateMadeBeforeTracking';
import { t } from '../i18n/strings';
import { LanguageProvider } from '../i18n/LanguageContext';
import { UnitSystemProvider } from '../models/UnitSystemContext';

export const NEW_RECIPE_VIEW_TYPE = 'new-recipe-view';

interface NewRecipeViewState extends NavigableViewState {
	prefilledValues?: RecipeFormValues; // set when opened from a template
	templateKey?: string; // forces RecipeForm to remount when a different template is picked
}

export class NewRecipeView extends ItemView {
	private plugin: MyPlugin;
	private root: Root | null = null;
	private prefilledValues?: RecipeFormValues;
	private templateKey?: string;
	private history: NavigationEntry[] = [];
	private closeAction!: HTMLElement;
	private formRef = createRef<RecipeFormHandle>();

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return NEW_RECIPE_VIEW_TYPE;
	}

	getDisplayText(): string {
		return t('newRecipeView.title', this.plugin.settings.language);
	}

	async setState(state: NewRecipeViewState, result: unknown) {
		this.prefilledValues = state.prefilledValues;
		this.templateKey = state.templateKey;
		this.history = state.history ?? [];
		this.updateCloseAction();
		this.render();
		return super.setState(state, result as never);
	}

	getState(): NewRecipeViewState {
		return { prefilledValues: this.prefilledValues, templateKey: this.templateKey, history: this.history };
	}
	private updateCloseAction(): void {
		if (!this.closeAction) return;
		const language = this.plugin.settings.language;
		this.closeAction.setAttribute('aria-label', canNavigateBack({ history: this.history }) ? t('newRecipeView.closeAction.back', language) : t('newRecipeView.closeAction.close', language));
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		this.root = createRoot(container);
		const language = this.plugin.settings.language;

		const saveAction = this.addAction('save', t('newRecipeView.saveAction', language), () => {
			this.formRef.current?.triggerSubmit();
		});
		saveAction.addClass('header-button');

		const closeAction = this.addAction('x', t('newRecipeView.closeAction', language), () => {
			this.handleClose();
		});
		closeAction.addClass('header-button');

		this.render();
	}


	handleClose() {
		closeOrGoBack(this.leaf, this.history);
	}

	render() {
		if (!this.root) return;

		this.root.render(
			<LanguageProvider value={this.plugin.settings.language}>
				<UnitSystemProvider value={this.plugin.settings.unitSystem}>
				<RecipeForm
					ref={this.formRef}
					key={this.templateKey ?? 'new'}
					app={this.app}
					recipesFolder={this.plugin.settings.recipesFolder}
					ingredientsFolder={this.plugin.settings.ingredientsFolder}
					recipeImagesFolder={this.plugin.settings.recipeImagesFolder}
					anthropicApiKey={this.plugin.settings.anthropicApiKey}
					anthropicModel={this.plugin.settings.anthropicModel}
					onSubmit={(values) => this.handleSubmit(values)}
					initialValues={this.prefilledValues}
					oilIngredientTypes={this.plugin.settings.oilIngredientTypes}
				/>
				</UnitSystemProvider>
			</LanguageProvider>
		);
	}

	async handleSubmit(values: RecipeFormValues) {
		const { recipe, errors } = formValuesToRecipe(values);

		if (errors.length > 0) {
			new ErrorModal(this.app, errors, this.plugin.settings.language).open();
			return;
		}

		try {
			const file = await createRecipe({
				app: this.app,
				recipesFolder: this.plugin.settings.recipesFolder,
				recipe: recipe!,
				subfolder: values.subfolder,
			});

			new Notice(t('newRecipeView.created', this.plugin.settings.language).replace('{name}', file.basename));
			if (recipe!.madeBeforeTracking) {
				await propagateMadeBeforeTracking(this.app, this.plugin.settings.recipesFolder, recipe!.baseRecipes);
			}

			await this.leaf.setViewState({
				type: RECIPE_VIEW_TYPE,
				active: true,
				state: { filePath: file.path, history: [] },
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : t('newRecipeView.error.create', this.plugin.settings.language);
			new Notice(message);
		}
	}

	async onClose() {
		this.root?.unmount();
	}
}
