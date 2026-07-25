import { App, TFile, TFolder } from 'obsidian';

// Finds a file by its basename, searching recursively through rootFolder
// and all its subfolders — needed since both ingredients and recipes can be
// organized into subfolders (e.g. "Ingredients/Légumes", "Recettes/Cocktails"),
// so a naive "${rootFolder}/${name}.md" path would miss anything not
// directly at the root.
export function findFileByBasename(app: App, rootFolder: string, basename: string): TFile | null {
	const files = app.vault
		.getMarkdownFiles()
		.filter((f: TFile) => f.path.startsWith(rootFolder + '/') && f.basename === basename);

	return files[0] ?? null;
}

// Returns the relative paths of existing subfolders under rootFolder, e.g.
// ["Légumes", "Fruits", "Épices"] or ["Cocktails", "Desserts"] — used to
// populate the subfolder picker when creating/editing an ingredient or recipe.
export function listSubfolders(app: App, rootFolder: string): string[] {
	const root = app.vault.getAbstractFileByPath(rootFolder);
	if (!(root instanceof TFolder)) return [];

	const subfolders: string[] = [];

	function walk(folder: TFolder) {
		for (const child of folder.children) {
			if (child instanceof TFolder) {
				const relativePath = child.path.slice(rootFolder.length + 1);
				subfolders.push(relativePath);
				walk(child);
			}
		}
	}

	walk(root);
	return subfolders.sort((a, b) => a.localeCompare(b));
}

// Creates a folder if it doesn't already exist — used before writing a new
// file into a subfolder that might not exist yet (e.g. the first ingredient
// of a given type, or the first recipe in a given subfolder).
export async function ensureFolderExists(app: App, folderPath: string): Promise<void> {
	if (!app.vault.getAbstractFileByPath(folderPath)) {
		await app.vault.createFolder(folderPath);
	}
}
