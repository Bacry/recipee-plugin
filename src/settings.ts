import { App, PluginSettingTab, Setting } from 'obsidian';
import MyPlugin from './main';
import { t } from './i18n/strings';

export interface MyPluginSettings {
	ingredientTypes: string[];
	shopSections: string[];
	ingredientsFolder: string;
	unitSystem: 'metric' | 'us';
	usdaApiKey: string;
	shoppingListPath: string; // path to the single "Courses" note
	otherItemsNotePath: string; // single note listing non-ingredient item names, used for autocomplete
	recipesFolder: string; // folder where recipe notes are stored
	recipeTemplatesFolder: string;
	recipeImagesFolder: string;
	anthropicApiKey: string;
	anthropicModel: string;
	dietFlags: string[];
	dietPresets: DietPreset[];
	pinnedTags: string[];
	oilIngredientTypes: string[]; // parmi ingredientTypes, lesquels comptent comme "huile" (affiche "Peut être utilisé pour la friture" dans le formulaire ingrédient)
	defaultFryingAbsorptionPercent: number;
	fruitIngredientTypes: string[]; // parmi ingredientTypes, lesquels comptent comme "fruit" (affiche "Rendement en jus")
	language: 'fr' | 'en';
}

export interface DietPreset {
	name: string;
	flags: string[];
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	ingredientTypes: ['dairy', 'fish', 'meat', 'vegetable', 'fruit', 'fruit juice', 'cereal', 'other', 'oil'],
	shopSections: ['dairy', 'fresh', 'frozen', 'bakery', 'pantry', 'produce', 'meat_fish', 'beverages', 'other'],
	ingredientsFolder: 'Ingredients',
	usdaApiKey: '',
	unitSystem: 'metric',
	shoppingListPath: 'Shopping list.md',
	otherItemsNotePath: 'Other items.md',
	recipeImagesFolder: 'Images',
	anthropicApiKey: '',
	anthropicModel: 'claude-sonnet-5',
	dietFlags: ['gluten', 'lactose', 'egg', 'peanut', 'tree nuts', 'soy', 'fish', 'shellfish', 'meat'],
	dietPresets: [
		{ name: 'Vegetarian', flags: ['meat', 'fish', 'shellfish'] },
		{ name: 'Vegan', flags: ['meat', 'fish', 'shellfish', 'egg', 'lactose'] },
	],
	pinnedTags: [],
	oilIngredientTypes: ['oil'],
	defaultFryingAbsorptionPercent: 15,
	fruitIngredientTypes: ['fruit juice'],
	language: 'en',
};


export class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}
	private renderCategoryPicker(
		containerEl: HTMLElement,
		label: string,
		settingsKey: 'oilIngredientTypes' | 'fruitIngredientTypes'
	): void {
		const wrapper = containerEl.createDiv({ cls: 'recipe-list-tag-menu-wrapper' });

		const updateButtonText = () => {
			const stored = this.plugin.settings[settingsKey] as string[];
			const validCount = stored.filter((v) => this.plugin.settings.ingredientTypes.includes(v)).length;
			button.setText(validCount > 0 ? `${label} (${validCount})` : label);
		};

		const button = wrapper.createEl('button', { cls: 'recipe-list-tag-menu-button' });
		updateButtonText();

		const menu = wrapper.createEl('ul', { cls: 'recipe-list-tag-menu' });
		menu.style.display = 'none';

		for (const type of this.plugin.settings.ingredientTypes) {
			const item = menu.createEl('li', { cls: 'recipe-list-tag-menu-item' });
			const itemLabel = item.createEl('label');
			const checkbox = itemLabel.createEl('input', { type: 'checkbox' }) as HTMLInputElement;
			checkbox.checked = (this.plugin.settings[settingsKey] as string[]).includes(type);
			itemLabel.createSpan({ text: type });

			checkbox.addEventListener('change', async () => {
				const current = this.plugin.settings[settingsKey] as string[];
				this.plugin.settings[settingsKey] = checkbox.checked
					? Array.from(new Set([...current, type]))
					: current.filter((t) => t !== type);
				await this.plugin.saveSettings();
				updateButtonText();
			});
		}

		button.addEventListener('click', () => {
			menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
		});
	}
	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		const language = this.plugin.settings.language;

		new Setting(containerEl)
			.setName(t('settings.language.name', language))
			.setDesc(t('settings.language.desc', language))
			.addDropdown((dropdown) =>
				dropdown
					.addOption('fr', 'Français')
					.addOption('en', 'English')
					.setValue(this.plugin.settings.language)
					.onChange(async (value) => {
						this.plugin.settings.language = value as 'fr' | 'en';
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		new Setting(containerEl)
			.setName(t('settings.unitSystem.name', language))
			.setDesc(t('settings.unitSystem.desc', language))
			.addDropdown((dropdown) =>
				dropdown
					.addOption('metric', t('settings.unitSystem.metric', language))
					.addOption('us', t('settings.unitSystem.us', language))
					.setValue(this.plugin.settings.unitSystem)
					.onChange(async (value) => {
						this.plugin.settings.unitSystem = value as 'metric' | 'us';
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settings.ingredientsFolder.name', language))
			.setDesc(t('settings.ingredientsFolder.desc', language))
			.addText((text) =>
				text
					.setPlaceholder('Ingredients')
					.setValue(this.plugin.settings.ingredientsFolder)
					.onChange(async (value) => {
						this.plugin.settings.ingredientsFolder = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settings.recipesFolder.name', language))
			.setDesc(t('settings.recipesFolder.desc', language))
			.addText((text) =>
				text
					.setPlaceholder('Recettes')
					.setValue(this.plugin.settings.recipesFolder)
					.onChange(async (value) => {
						this.plugin.settings.recipesFolder = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settings.recipeTemplatesFolder.name', language))
			.setDesc(t('settings.recipeTemplatesFolder.desc', language))
			.addText((text) =>
				text
					.setPlaceholder('Templates')
					.setValue(this.plugin.settings.recipeTemplatesFolder)
					.onChange(async (value) => {
						this.plugin.settings.recipeTemplatesFolder = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settings.recipeImagesFolder.name', language))
			.setDesc(t('settings.recipeImagesFolder.desc', language))
			.addText((text) =>
				text
					.setValue(this.plugin.settings.recipeImagesFolder || DEFAULT_SETTINGS.recipeImagesFolder)
					.onChange(async (value) => {
						this.plugin.settings.recipeImagesFolder = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settings.lists.name', language))
			.setDesc(t('settings.lists.desc', language));

		new Setting(containerEl)
			.setName(t('settings.specialCategories.name', language))
			.setDesc(t('settings.specialCategories.desc', language))
			.setHeading();

		this.renderCategoryPicker(containerEl, t('settings.oilTypes.label', language), 'oilIngredientTypes');

		new Setting(containerEl)
			.setName(t('settings.absorptionPercent.name', language))
			.setDesc(t('settings.absorptionPercent.desc', language))
			.addText((text) =>
				text
					.setPlaceholder('15')
					.setValue(this.plugin.settings.defaultFryingAbsorptionPercent.toString())
					.onChange(async (value) => {
						const parsed = Number(value);
						if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 100) {
							this.plugin.settings.defaultFryingAbsorptionPercent = parsed;
							await this.plugin.saveSettings();
						}
					}),
			);

		this.renderCategoryPicker(containerEl, t('settings.fruitTypes.label', language), 'fruitIngredientTypes');

		new Setting(containerEl)
			.setName(t('settings.usdaApiKey.name', language))
			.setDesc(t('settings.usdaApiKey.desc', language))
			.addText((text) =>
				text
					.setPlaceholder(t('settings.usdaApiKey.placeholder', language))
					.setValue(this.plugin.settings.usdaApiKey)
					.onChange(async (value) => {
						this.plugin.settings.usdaApiKey = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settings.anthropicApiKey.name', language))
			.setDesc(t('settings.anthropicApiKey.desc', language))
			.addText((text) =>
				text
					.setPlaceholder('sk-ant-...')
					.setValue(this.plugin.settings.anthropicApiKey)
					.onChange(async (value) => {
						this.plugin.settings.anthropicApiKey = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settings.anthropicModel.name', language))
			.setDesc(t('settings.anthropicModel.desc', language))
			.addDropdown((dropdown) =>
				dropdown
					.addOption('claude-haiku-4-5-20251001', t('settings.anthropicModel.haiku', language))
					.addOption('claude-sonnet-5', t('settings.anthropicModel.sonnet', language))
					.addOption('claude-opus-4-8', t('settings.anthropicModel.opus', language))
					.setValue(this.plugin.settings.anthropicModel)
					.onChange(async (value) => {
						this.plugin.settings.anthropicModel = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settings.shoppingListPath.name', language))
			.setDesc(t('settings.shoppingListPath.desc', language))
			.addText((text) =>
				text
					.setPlaceholder('Courses.md')
					.setValue(this.plugin.settings.shoppingListPath)
					.onChange(async (value) => {
						this.plugin.settings.shoppingListPath = value;
						await this.plugin.saveSettings();
					}),
			);
		new Setting(containerEl)
			.setName(t('settings.otherItemsNotePath.name', language))
			.setDesc(t('settings.otherItemsNotePath.desc', language))
			.addText((text) =>
				text
					.setPlaceholder('Autres.md')
					.setValue(this.plugin.settings.otherItemsNotePath)
					.onChange(async (value) => {
						this.plugin.settings.otherItemsNotePath = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
