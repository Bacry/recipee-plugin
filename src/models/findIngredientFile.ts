import { App, TFile } from 'obsidian';

// Finds an ingredient file by its basename, searching recursively through
// ingredientsFolder and all its subfolders — same principle as
// findRecipeFileByName, needed once ingredients can be organized into
// subfolders (e.g. "Ingredients/Légumes").
export function findIngredientFileByName(app: App, ingredientsFolder: string, ingredientName: string): TFile | null {
	const files = app.vault
		.getMarkdownFiles()
		.filter((f: TFile) => f.path.startsWith(ingredientsFolder + '/') && f.basename === ingredientName);

	return files[0] ?? null;
}
