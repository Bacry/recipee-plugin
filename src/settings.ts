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
	dietFlags: string[];
	dietPresets: DietPreset[];
	pinnedTags: string[];
	oilIngredientTypes: string[]; // parmi ingredientTypes, lesquels comptent comme "huile" (affiche "Peut être utilisé pour la friture" dans le formulaire ingrédient)
	defaultFryingAbsorptionPercent: number;
	fruitIngredientTypes: string[]; // parmi ingredientTypes, lesquels comptent comme "fruit" (affiche "Rendement en jus")
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
	shoppingListPath: 'Courses.md',
	otherItemsNotePath: 'Autres.md',
	recipeImagesFolder: 'Images',
	anthropicApiKey: '',
	anthropicModel: 'claude-sonnet-5',
	dietFlags: ['gluten', 'lactose', 'oeuf', 'arachide', 'fruits à coque', 'soja', 'poisson', 'crustacés', 'viande'],
	dietPresets: [
		{ name: 'Végétarien', flags: ['viande', 'poisson', 'crustacés'] },
		{ name: 'Végan', flags: ['viande', 'poisson', 'crustacés', 'oeuf', 'lactose'] },
	],
	pinnedTags: [],
	oilIngredientTypes: ['oil'],
	defaultFryingAbsorptionPercent: 15,
	fruitIngredientTypes: ['fruit juice'],
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
			.setName('Ingredient types, shop sections & diet flags')
			.setDesc('Managed via a dedicated view — run the "Manage lists" command or click the tag icon in the ribbon.');

		new Setting(containerEl)
			.setName('Catégories spéciales')
			.setDesc('Parmi tes types d\'ingrédients existants, lesquels correspondent à une huile (active "Peut être utilisé pour la friture") ou un fruit (active "Rendement en jus") sur la fiche ingrédient.')
			.setHeading();

		this.renderCategoryPicker(containerEl, 'Types "huile" (friture)', 'oilIngredientTypes');

		new Setting(containerEl)
			.setName('Absorption d\'huile par défaut')
			.setDesc('Pourcentage utilisé au départ pour estimer l\'huile absorbée par les aliments frits — ajustable ensuite dans chaque recette. La littérature situe l\'absorption entre 8% et 25% selon la porosité de l\'aliment.')
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
		this.renderCategoryPicker(containerEl, 'Types "fruit" (rendement en jus)', 'fruitIngredientTypes');


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
