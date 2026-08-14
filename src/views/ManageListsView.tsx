import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { NavigableViewState, NavigationEntry, canNavigateBack, closeOrGoBack } from '../navigation';
import { ManageListsDisplay } from '../components/ManageListsDisplay';
import { wouldMergeWithExisting, renameListValue, ListField } from '../models/renameListValue';
import { ConfirmModal } from '../components/ConfirmModal';
import type MyPlugin from '../main';
import { t } from '../i18n/strings';
import { LanguageProvider } from '../i18n/LanguageContext';

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
		return t('manageListsView.title', this.plugin.settings.language);
	}

	private updateCloseAction(): void {
		if (!this.closeAction) return;
		const language = this.plugin.settings.language;
		this.closeAction.setAttribute('aria-label', canNavigateBack({ history: this.history }) ? t('manageListsView.closeAction.back', language) : t('manageListsView.closeAction.close', language));
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
		this.closeAction = this.addAction('arrow-left', t('manageListsView.closeAction.close', this.plugin.settings.language), () => {
			closeOrGoBack(this.leaf, this.history);
		});
		this.closeAction.addClass('header-button');
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
			new Notice(t('manageListsView.alreadyExists', this.plugin.settings.language).replace('{value}', trimmed));
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
				t('manageListsView.rename.wouldMerge', this.plugin.settings.language).replace('{newValue}', trimmed).replace('{oldValue}', oldValue),
				async () => {
					await this.performRename(field, oldValue, trimmed);
				},
				this.plugin.settings.language
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

		new Notice(t('manageListsView.rename.success', this.plugin.settings.language).replace('{oldValue}', oldValue).replace('{newValue}', newValue).replace('{count}', affectedCount.toString()));
		this.render();
	}

	async handleRemove(field: ListField, value: string) {
		const settingsKey = field === 'type' ? 'ingredientTypes' : field === 'shop_section' ? 'shopSections' : 'dietFlags';
		const current = this.plugin.settings[settingsKey] as string[];

		if (field === 'type') {
			const language = this.plugin.settings.language;
			if (this.plugin.settings.oilIngredientTypes.includes(value)) {
				new Notice(t('manageListsView.remove.usedAsOil', language).replace('{value}', value));
				return;
			}
			if (this.plugin.settings.fruitIngredientTypes.includes(value)) {
				new Notice(t('manageListsView.remove.usedAsFruit', language).replace('{value}', value));
				return;
			}
		}

		const stillUsed = wouldMergeWithExisting(this.app, this.plugin.settings.ingredientsFolder, field, '', value);

		if (stillUsed) {
			new ConfirmModal(
				this.app,
				t('manageListsView.remove.stillUsed', this.plugin.settings.language).replace('{value}', value),
				async () => {
					this.plugin.settings[settingsKey] = current.filter((v) => v !== value);
					await this.plugin.saveSettings();
					this.render();
				},
				this.plugin.settings.language
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
			new Notice(t('manageListsView.preset.alreadyExists', this.plugin.settings.language).replace('{name}', trimmed));
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
			<LanguageProvider value={this.plugin.settings.language}>
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
			</LanguageProvider>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
