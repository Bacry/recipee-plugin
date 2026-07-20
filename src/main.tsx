import { Plugin, WorkspaceLeaf } from 'obsidian';
import {
	DEFAULT_SETTINGS,
	MyPluginSettings,
	SampleSettingTab,
} from './settings';
import { IngredientView, INGREDIENT_VIEW_TYPE } from './views/IngredientView';
import { NewIngredientView, NEW_INGREDIENT_VIEW_TYPE } from './views/NewIngredientView';

export default class MyPlugin extends Plugin {
	settings!: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.registerView(
			INGREDIENT_VIEW_TYPE,
			(leaf: WorkspaceLeaf) => new IngredientView(leaf, this),
		);

		this.registerView(
			NEW_INGREDIENT_VIEW_TYPE,
			(leaf: WorkspaceLeaf) => new NewIngredientView(leaf, this),
		);

		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.addCommand({
			id: 'open-ingredient-view',
			name: 'Open ingredient view for current note',
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				if (!file) return false; // pas de note ouverte → commande indisponible

				const folder = this.settings.ingredientsFolder;
				if (!file.path.startsWith(folder + '/')) return false; // note pas dans Ingredients/ → indisponible

				if (!checking) {
					this.activateIngredientView(file.path); // exécution réelle, seulement si ce n'est pas juste une vérification
				}
				return true;
			},
		});

		this.addCommand({
			id: 'create-new-ingredient',
			name: 'Create new ingredient',
			callback: () => {
				this.activateNewIngredientView();
			},
		});
	}
	async activateIngredientView(filePath: string) {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(INGREDIENT_VIEW_TYPE)[0];

		if (!leaf) {
			leaf = workspace.getLeaf(true);
		}

		await leaf.setViewState({
			type: INGREDIENT_VIEW_TYPE,
			active: true,
			state: { filePath },
		});

		workspace.revealLeaf(leaf);
	}

	async activateNewIngredientView() {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(NEW_INGREDIENT_VIEW_TYPE)[0];

		if (!leaf) {
			leaf = workspace.getLeaf(true);
			await leaf.setViewState({ type: NEW_INGREDIENT_VIEW_TYPE, active: true });
		}

		workspace.revealLeaf(leaf);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<MyPluginSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
