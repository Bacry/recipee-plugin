import { App, TFolder } from 'obsidian';

// Returns existing subfolder paths under ingredientsFolder, e.g. ["Légumes",
// "Fruits", "Épices"] — same principle as listRecipeSubfolders.
export function listIngredientSubfolders(app: App, ingredientsFolder: string): string[] {
	const rootFolder = app.vault.getAbstractFileByPath(ingredientsFolder);
	if (!(rootFolder instanceof TFolder)) return [];

	const subfolders: string[] = [];

	function walk(folder: TFolder) {
		for (const child of folder.children) {
			if (child instanceof TFolder) {
				const relativePath = child.path.slice(ingredientsFolder.length + 1);
				subfolders.push(relativePath);
				walk(child);
			}
		}
	}

	walk(rootFolder);
	return subfolders.sort((a, b) => a.localeCompare(b));
}
