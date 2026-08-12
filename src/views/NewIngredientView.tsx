import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import type MyPlugin from '../main';
import { removeOtherItemIfPresent } from '../models/otherItemsNote';
import { createIngredient } from "../models/ingredientPersistence";
import { NavigableViewState, NavigationEntry, closeOrGoBack, canNavigateBack } from '../navigation';
import { INGREDIENT_VIEW_TYPE } from './IngredientView';
import { createRef } from 'react';
import { IngredientForm, IngredientFormValues, IngredientFormHandle } from '../components/IngredientForm';

export const NEW_INGREDIENT_VIEW_TYPE = 'new-ingredient-view';

interface NewIngredientViewState extends NavigableViewState {
	prefilledName?: string; // set when opened from a "create missing ingredient" link, e.g. from a recipe
}

export class NewIngredientView extends ItemView {
	private root: Root | null = null;
	private plugin: MyPlugin;
	private prefilledName?: string;
	private history: NavigationEntry[] = [];
	private closeAction!: HTMLElement;
	private formRef = createRef<IngredientFormHandle>();


	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return NEW_INGREDIENT_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Formulaire ingrédient';
	}

	async setState(state: NewIngredientViewState, result: unknown) {
		this.prefilledName = state.prefilledName;
		this.history = state.history ?? [];
		this.updateCloseAction();
		this.render();
		return super.setState(state, result as never);
	}

	getState(): NewIngredientViewState {
		return { prefilledName: this.prefilledName, history: this.history };
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		this.root = createRoot(container);

		const saveAction = this.addAction('save', 'Enregistrer', () => {
			this.formRef.current?.triggerSubmit();
		});
		saveAction.addClass('header-buttons');

		const closeAction = this.addAction('x', 'Fermer le formulaire', () => {
			this.handleClose();
		});
		closeAction.addClass('header-buttons');

		this.render();
	}

	private updateCloseAction() {
		if (!this.closeAction) return;
		this.closeAction.setAttribute('aria-label', canNavigateBack({ history: this.history }) ? 'Retour' : 'Fermer');
	}

	// Same pattern as IngredientView: go back if we navigated here from
	// another screen, otherwise there's nothing to return to — just close.
	handleClose() {
		closeOrGoBack(this.leaf, this.history);
	}
	render() {
		if (!this.root) return;

		this.root.render(
			<IngredientForm
				ref={this.formRef}
				key={this.prefilledName ?? 'empty'}
				app={this.app}
				onSubmit={(values) => this.handleSubmit(values)}
				ingredientTypes={this.plugin.settings.ingredientTypes}
				shopSections={this.plugin.settings.shopSections}
				dietFlags={this.plugin.settings.dietFlags}
				fruitIngredientTypes={this.plugin.settings.fruitIngredientTypes}
				usdaApiKey={this.plugin.settings.usdaApiKey}
				anthropicApiKey={this.plugin.settings.anthropicApiKey}
				anthropicModel={this.plugin.settings.anthropicModel}
				autoSearchOnMount={!!this.prefilledName}
				initialValues={
					this.prefilledName
						? {
							name: this.prefilledName,
							nameEn: '',
							type: '',
							shopSection: '',
							densityGMl: '',
							entityWeightG: '',
							brand: '',
							dietFlags: '',
							possibleForms: '',
							juiceYieldMl: '',
							nutrition: {
								kcal: 0, lipids: 0, non_saturated_lipids: 0, glucids: 0,
								sugar: 0, proteins: 0, salt: 0, fibers: 0, cholesterol: 0,
							},
						}
						: undefined
				}
			/>
		);
	}

	async handleSubmit(values: IngredientFormValues): Promise<void> {
		try {
			const file = await createIngredient({
				app: this.app,
				ingredientsFolder: this.plugin.settings.ingredientsFolder,
				values,
			});

			await removeOtherItemIfPresent(
				this.app,
				this.plugin.settings.otherItemsNotePath,
				file.basename
			);

			new Notice(`Ingrédient "${file.basename}" créé.`);

			if (canNavigateBack({ history: this.history })) {
				// Came from a recipe's missing-ingredient link — go back there as before.
				this.handleClose();
			} else {
				// Direct creation (via command) — show the newly created ingredient
				// instead of just closing the tab.
				await this.leaf.setViewState({
					type: INGREDIENT_VIEW_TYPE,
					active: true,
					state: { filePath: file.path, history: [] },
				});
			}
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Impossible de créer l'ingrédient.";

			new Notice(message);
		}
	}

	async onClose() {
		this.root?.unmount();
	}
}
