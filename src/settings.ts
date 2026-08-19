import { App, PluginSettingTab, Setting } from 'obsidian';
import MyPlugin from './main';
import { t } from './i18n/strings';
import { AIProviderId, AICredentials, AI_PROVIDERS, DEFAULT_AI_CREDENTIALS } from './services/ai/types';

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
	aiCredentials: Record<AIProviderId, AICredentials>;
	dietFlags: string[];
	dietPresets: DietPreset[];
	pinnedTags: string[];
	oilIngredientTypes: string[]; // parmi ingredientTypes, lesquels comptent comme "huile" (affiche "Peut être utilisé pour la friture" dans le formulaire ingrédient)
	defaultFryingAbsorptionPercent: number;
	fruitIngredientTypes: string[]; // parmi ingredientTypes, lesquels comptent comme "fruit" (affiche "Rendement en jus")
	language: 'fr' | 'en';
	usdaEnabled: boolean;
	aiEnabled: boolean;
	aiProvider: 'anthropic';
}

export interface DietPreset {
	name: string;
	flags: string[];
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	ingredientTypes: ['dairy', 'fish', 'meat', 'vegetable', 'fruit', 'fruit juice', 'cereal', 'other', 'oil'],
	shopSections: ['dairy', 'fresh', 'frozen', 'bakery', 'pantry', 'produce', 'meat_fish', 'beverages'],
	ingredientsFolder: 'Ingredients',
	recipesFolder: 'Recipes',
	recipeTemplatesFolder: 'Templates',
	usdaApiKey: '',
	unitSystem: 'us',
	shoppingListPath: 'Shopping list.md',
	otherItemsNotePath: 'Other items.md',
	recipeImagesFolder: 'Images',
	aiCredentials: DEFAULT_AI_CREDENTIALS,
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
	usdaEnabled: false,
	aiEnabled: false,
	aiProvider: 'anthropic',
};


export class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}
	private renderCategoryPicker(
		containerEl: HTMLElement,
		name: string,
		desc: string,
		label: string,
		settingsKey: 'oilIngredientTypes' | 'fruitIngredientTypes'
	): void {
		const setting = new Setting(containerEl)
			.setName(name)
			.setDesc(desc);

		const wrapper = setting.controlEl.createDiv({ cls: 'recipe-list-tag-menu-wrapper' });

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
			.setName(t('settings.language.heading', language))
			.setHeading();

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
			.setName(t('settings.paths.heading', language))
			.setHeading();


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
					.setPlaceholder('Recipes')
					.setValue(this.plugin.settings.recipesFolder || DEFAULT_SETTINGS.recipesFolder)
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
					.setValue(this.plugin.settings.recipeTemplatesFolder || DEFAULT_SETTINGS.recipeTemplatesFolder)					.onChange(async (value) => {
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
			.setName(t('settings.notes.heading', language))
			.setHeading();

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

		new Setting(containerEl)
			.setName(t('settings.specialcategories.heading', language))
			.setHeading();

		new Setting(containerEl)
			.setName(t('settings.lists.name', language))
			.setDesc(t('settings.lists.desc', language));

		this.renderCategoryPicker(
			containerEl,
			t('settings.oilTypes.name', language),
			t('settings.oilTypes.desc', language),
			t('settings.oilTypes.label', language),
			'oilIngredientTypes'
		);

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

		this.renderCategoryPicker(
			containerEl,
			t('settings.fruitTypes.name', language),
			t('settings.fruitTypes.desc', language),
			t('settings.fruitTypes.label', language),
			'fruitIngredientTypes'
		);

		new Setting(containerEl)
			.setName(t('settings.ai.heading', language))
			.setHeading();

		new Setting(containerEl)
			.setName(t('settings.aiEnabled.name', language))
			.setDesc(t('settings.aiEnabled.desc', language))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.aiEnabled)
					.onChange(async (value) => {
						this.plugin.settings.aiEnabled = value;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		if (this.plugin.settings.aiEnabled) {
			new Setting(containerEl)
				.setName(t('settings.aiProvider.name', language))
				.setDesc(t('settings.aiProvider.desc', language))
				.addDropdown((dropdown) => {
					for (const provider of AI_PROVIDERS) {
						dropdown.addOption(provider.id, provider.label);
					}
					dropdown
						.setValue(this.plugin.settings.aiProvider)
						.onChange(async (value) => {
							this.plugin.settings.aiProvider = value as AIProviderId;
							await this.plugin.saveSettings();
							this.display();
						});
				});

			const activeProvider = AI_PROVIDERS.find((p) => p.id === this.plugin.settings.aiProvider);
			if (activeProvider) {
				const credentials = this.plugin.settings.aiCredentials[activeProvider.id];

				new Setting(containerEl)
					.setName(t('settings.aiApiKey.name', language).replace('{provider}', activeProvider.label))
					.addText((text) =>
						text
							.setPlaceholder(activeProvider.apiKeyPlaceholder)
							.setValue(credentials.apiKey)
							.onChange(async (value) => {
								this.plugin.settings.aiCredentials[activeProvider.id].apiKey = value;
								await this.plugin.saveSettings();
							}),
					);

				new Setting(containerEl)
					.setName(t('settings.aiModel.name', language))
					.addDropdown((dropdown) => {
						for (const modelOption of activeProvider.models) {
							dropdown.addOption(modelOption.id, modelOption.label);
						}
						dropdown
							.setValue(credentials.model)
							.onChange(async (value) => {
								this.plugin.settings.aiCredentials[activeProvider.id].model = value;
								await this.plugin.saveSettings();
							});
					});
			}


			new Setting(containerEl)
				.setName(t('settings.usda.heading', language))
				.setHeading();

			new Setting(containerEl)
				.setName(t('settings.usdaEnabled.name', language))
				.setDesc(t('settings.usdaEnabled.desc', language))
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.usdaEnabled)
						.onChange(async (value) => {
							this.plugin.settings.usdaEnabled = value;
							await this.plugin.saveSettings();
							this.display();
						}),
				);

			if (this.plugin.settings.usdaEnabled) {
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
			}


		}

	}
}
