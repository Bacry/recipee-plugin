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
	recipeInstructionsTemplate: string;
	cocktailInstructionsTemplate: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	ingredientTypes: ['dairy', 'fish', 'meat', 'vegetable', 'fruit', 'cereal', 'other'],
	shopSections: ['dairy', 'fresh', 'frozen', 'bakery', 'pantry', 'produce', 'meat_fish', 'beverages', 'other'],
	ingredientsFolder: 'Ingredients',
	usdaApiKey: '',
	shoppingListPath: 'Courses.md',
	otherItemsNotePath: 'Autres.md',
	recipesFolder: 'Recettes',
	recipeInstructionsTemplate: '#### Préparation\n\n\n#### Cuisson\n\n',
	cocktailInstructionsTemplate: '#### Préparation\n\n\n#### Shaking',
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
			.setName('Recipe instructions template')
			.setDesc('Default markdown prefilled in the instructions field when creating a new recipe')
			.addTextArea((text) =>
				text
					.setValue(this.plugin.settings.recipeInstructionsTemplate)
					.onChange(async (value) => {
						this.plugin.settings.recipeInstructionsTemplate = value;
						await this.plugin.saveSettings();
					}),
			);
		new Setting(containerEl).setName('Cocktails').setHeading();

		new Setting(containerEl)
			.setName('Cocktail instructions template')
			.setDesc('Default markdown prefilled in the instructions field when creating a new cocktail')
			.addTextArea((text) =>
				text
					.setValue(this.plugin.settings.cocktailInstructionsTemplate)
					.onChange(async (value) => {
						this.plugin.settings.cocktailInstructionsTemplate = value;
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
