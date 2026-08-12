import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { NavigableViewState, NavigationEntry, canNavigateBack, closeOrGoBack } from '../navigation';
import { ManageListsDisplay } from '../components/ManageListsDisplay';
import { wouldMergeWithExisting, renameListValue, ListField } from '../models/renameListValue';
import { ConfirmModal } from '../components/ConfirmModal';
import type MyPlugin from '../main';

export const MANAGE_LISTS_VIEW_TYPE = 'manage-lists-view';

interface ManageListsViewState extends NavigableViewState {}

export class ManageListsView extends ItemView {
	private plugin: MyPlugin;
	private root: Root | null = null;
	private history: NavigationEntry[] = [];
	private closeAction!: HTMLElement;

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return MANAGE_LISTS_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Gérer les listes';
	}

	private updateCloseAction(): void {
		if (!this.closeAction) return;
		this.closeAction.setAttribute('aria-label', canNavigateBack({ history: this.history }) ? 'Retour' : 'Fermer');
	}

	async setState(state: ManageListsViewState, result: unknown) {
		this.history = state.history ?? [];
		this.updateCloseAction();
		this.render();
		return super.setState(state, result as never);
	}

	getState(): ManageListsViewState {
		return { history: this.history };
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		this.root = createRoot(container);
		this.closeAction = this.addAction('arrow-left', 'Fermer', () => {
			closeOrGoBack(this.leaf, this.history);
		});
		this.closeAction.addClass('header-buttons');
		this.render();
	}

	// Adds a brand new value — safe by definition, nothing to merge since
	// it doesn't exist anywhere yet.
	async handleAdd(field: ListField, value: string) {
		const trimmed = value.trim();
		if (trimmed === '') return;

		const settingsKey = field === 'type' ? 'ingredientTypes' : field === 'shop_section' ? 'shopSections' : 'dietFlags';
		const current = this.plugin.settings[settingsKey] as string[];

		if (current.includes(trimmed)) {
			new Notice(`"${trimmed}" existe déjà.`);
			return;
		}

		this.plugin.settings[settingsKey] = [...current, trimmed];
		await this.plugin.saveSettings();
		this.render();
	}

	async handleRename(field: ListField, oldValue: string, newValue: string) {
		const trimmed = newValue.trim();
		if (trimmed === '' || trimmed === oldValue) return;

		const wouldMerge = wouldMergeWithExisting(
			this.app,
			this.plugin.settings.ingredientsFolder,
			field,
			oldValue,
			trimmed
		);

		if (wouldMerge) {
			new ConfirmModal(
				this.app,
				`"${trimmed}" existe déjà — renommer "${oldValue}" en "${trimmed}" fusionnera ces deux valeurs sur les ingrédients concernés. Continuer ?`,
				async () => {
					await this.performRename(field, oldValue, trimmed);
				}
			).open();
		} else {
			await this.performRename(field, oldValue, trimmed);
		}
	}

	private async performRename(field: ListField, oldValue: string, newValue: string) {
		const { affectedCount } = await renameListValue(
			this.app,
			this.plugin.settings.ingredientsFolder,
			field,
			oldValue,
			newValue
		);

		const settingsKey = field === 'type' ? 'ingredientTypes' : field === 'shop_section' ? 'shopSections' : 'dietFlags';
		const current = this.plugin.settings[settingsKey] as string[];
		const updated = Array.from(new Set(current.map((v) => (v === oldValue ? newValue : v))));
		this.plugin.settings[settingsKey] = updated;

		if (field === 'type') {
			this.plugin.settings.oilIngredientTypes = this.plugin.settings.oilIngredientTypes.map((v) => (v === oldValue ? newValue : v));
			this.plugin.settings.fruitIngredientTypes = this.plugin.settings.fruitIngredientTypes.map((v) => (v === oldValue ? newValue : v));
		}

		await this.plugin.saveSettings();

		new Notice(`"${oldValue}" renommé en "${newValue}" (${affectedCount} ingrédient(s) mis à jour).`);
		this.render();
	}

	async handleRemove(field: ListField, value: string) {
		const settingsKey = field === 'type' ? 'ingredientTypes' : field === 'shop_section' ? 'shopSections' : 'dietFlags';
		const current = this.plugin.settings[settingsKey] as string[];

		if (field === 'type') {
			if (this.plugin.settings.oilIngredientTypes.includes(value)) {
				new Notice(`Impossible de supprimer "${value}" : ce type est utilisé dans les réglages (catégorie "Huile"). Retire-le d'abord dans Réglages → Catégories spéciales.`);
				return;
			}
			if (this.plugin.settings.fruitIngredientTypes.includes(value)) {
				new Notice(`Impossible de supprimer "${value}" : ce type est utilisé dans les réglages (catégorie "Fruit"). Retire-le d'abord dans Réglages → Catégories spéciales.`);
				return;
			}
		}

		const stillUsed = wouldMergeWithExisting(this.app, this.plugin.settings.ingredientsFolder, field, '', value);

		if (stillUsed) {
			new ConfirmModal(
				this.app,
				`"${value}" est encore utilisé par au moins un ingrédient. Retirer quand même de la liste (les ingrédients concernés garderont cette valeur, juste signalée comme inconnue) ?`,
				async () => {
					this.plugin.settings[settingsKey] = current.filter((v) => v !== value);
					await this.plugin.saveSettings();
					this.render();
				}
			).open();
		} else {
			this.plugin.settings[settingsKey] = current.filter((v) => v !== value);
			await this.plugin.saveSettings();
			this.render();
		}
	}
	async handleAddPreset(name: string, flags: string[]) {
		const trimmed = name.trim();
		if (trimmed === '') return;

		const current = this.plugin.settings.dietPresets;
		if (current.some((p) => p.name === trimmed)) {
			new Notice(`Un préréglage "${trimmed}" existe déjà.`);
			return;
		}

		this.plugin.settings.dietPresets = [...current, { name: trimmed, flags }];
		await this.plugin.saveSettings();
		this.render();
	}

	async handleRemovePreset(name: string) {
		this.plugin.settings.dietPresets = this.plugin.settings.dietPresets.filter((p) => p.name !== name);
		await this.plugin.saveSettings();
		this.render();
	}
	render() {
		if (!this.root) return;

		this.root.render(
			<ManageListsDisplay
				types={this.plugin.settings.ingredientTypes}
				shopSections={this.plugin.settings.shopSections}
				dietFlags={this.plugin.settings.dietFlags}
				dietPresets={this.plugin.settings.dietPresets}
				onAdd={(field, value) => this.handleAdd(field, value)}
				onRename={(field, oldValue, newValue) => this.handleRename(field, oldValue, newValue)}
				onRemove={(field, value) => this.handleRemove(field, value)}
				onAddPreset={(name, flags) => this.handleAddPreset(name, flags)}
				onRemovePreset={(name) => this.handleRemovePreset(name)}
			/>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
