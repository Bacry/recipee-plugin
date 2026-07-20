import { App, PluginSettingTab, Setting } from 'obsidian';
import MyPlugin from './main';

export interface MyPluginSettings {
	ingredientTypes: string[];
	shopSections: string[];
	ingredientsFolder: string;
	usdaApiKey: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	ingredientTypes: ['dairy', 'fish', 'meat', 'vegetable', 'fruit', 'cereal', 'other'],
	shopSections: ['dairy', 'fresh', 'frozen', 'bakery', 'pantry', 'produce', 'meat_fish', 'beverages', 'other'],
	ingredientsFolder: 'Ingredients',
	usdaApiKey: '',
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
	}
}
