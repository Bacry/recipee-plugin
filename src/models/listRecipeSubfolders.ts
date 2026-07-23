import { App, TFolder } from 'obsidian';

// Returns the relative paths of existing subfolders under recipesFolder,
// e.g. ["Cocktails", "Desserts", "Cocktails/Sans alcool"] — used to populate
// the subfolder picker when creating/editing a recipe. Sorted alphabetically.
// Note: the templates folder lives at the vault root by design (not nested
// under recipesFolder), so it can never appear here — no explicit exclusion needed.
export function listRecipeSubfolders(app: App, recipesFolder: string): string[] {
	const rootFolder = app.vault.getAbstractFileByPath(recipesFolder);
	if (!(rootFolder instanceof TFolder)) return [];

	const subfolders: string[] = [];

	function walk(folder: TFolder) {
		for (const child of folder.children) {
			if (child instanceof TFolder) {
				const relativePath = child.path.slice(recipesFolder.length + 1);
				subfolders.push(relativePath);
				walk(child);
			}
		}
	}

	walk(rootFolder);
	return subfolders.sort((a, b) => a.localeCompare(b));
}
