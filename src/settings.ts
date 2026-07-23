import { App, PluginSettingTab, Setting } from 'obsidian';
import MyPlugin from './main';

export interface MyPluginSettings {
	ingredientTypes: string[];
	shopSections: string[];
	ingredientsFolder: string;
	usdaApiKey: string;
	shoppingListPath: string; // path to the single "Courses" note
	otherItemsNotePath: string; // single note listing non-ingredient item names, used for autocomplete
	recipesFolder: string; // folder where recipe notes are stored
	recipeTemplatesFolder: string;
	recipeImagesFolder: string;
	anthropicApiKey: string;
	anthropicModel: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	ingredientTypes: ['dairy', 'fish', 'meat', 'vegetable', 'fruit', 'cereal', 'other'],
	shopSections: ['dairy', 'fresh', 'frozen', 'bakery', 'pantry', 'produce', 'meat_fish', 'beverages', 'other'],
	ingredientsFolder: 'Ingredients',
	usdaApiKey: '',
	shoppingListPath: 'Courses.md',
	otherItemsNotePath: 'Autres.md',
	recipeImagesFolder: 'Images',
	anthropicApiKey: '',
	anthropicModel: 'claude-sonnet-5',
};
export class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Ingredients folder')
			.setDesc('Folder where your ingredient notes are stored')
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
			.setName('Recipes folder')
			.setDesc('Folder where your recipe notes are stored')
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
			.setName('Recipe templates folder')
			.setDesc('Root-level folder containing recipe templates (e.g. a "Cocktail" template) — used by "Create new recipe from template"')
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
			.setName('Recipe images folder')
			.setDesc('Folder where recipe images are stored — independent from the recipes folder, created automatically if missing')
			.addText((text) =>
				text
					.setValue(this.plugin.settings.recipeImagesFolder || DEFAULT_SETTINGS.recipeImagesFolder)
					.onChange(async (value) => {
						this.plugin.settings.recipeImagesFolder = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Ingredient types')
			.setDesc('Comma-separated list (e.g. dairy, fish, meat)')
			.addTextArea((text) =>
				text
					.setValue(this.plugin.settings.ingredientTypes.join(', '))
					.onChange(async (value) => {
						this.plugin.settings.ingredientTypes = value.split(',').map((s) => s.trim()).filter(Boolean);
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Shop sections')
			.setDesc('Comma-separated list (e.g. dairy, fresh, frozen)')
			.addTextArea((text) =>
				text
					.setValue(this.plugin.settings.shopSections.join(', '))
					.onChange(async (value) => {
						this.plugin.settings.shopSections = value.split(',').map((s) => s.trim()).filter(Boolean);
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('USDA API key')
			.setDesc('Free API key from fdc.nal.usda.gov, used to search nutritional data')
			.addText((text) =>
				text
					.setPlaceholder('Ta clé API')
					.setValue(this.plugin.settings.usdaApiKey)
					.onChange(async (value) => {
						this.plugin.settings.usdaApiKey = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Anthropic API key')
			.setDesc('Your own Anthropic API key, used to extract structured recipes from pasted text')
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
			.setName('Anthropic model')
			.setDesc('Model used for recipe text extraction')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('claude-haiku-4-5-20251001', 'Claude Haiku 4.5 (fast, cheap)')
					.addOption('claude-sonnet-5', 'Claude Sonnet 5 (balanced)')
					.addOption('claude-opus-4-8', 'Claude Opus 4.8 (most capable)')
					.setValue(this.plugin.settings.anthropicModel)
					.onChange(async (value) => {
						this.plugin.settings.anthropicModel = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Shopping list note path')
			.setDesc('Path to the single note used as your shopping list')
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
			.setName('Other items note path')
			.setDesc('Single note listing non-ingredient item names, used to grow autocomplete over time')
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
