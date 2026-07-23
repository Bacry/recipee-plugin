import { App, TFile } from 'obsidian';

// Finds a recipe file by its basename (not by guessing a path), searching
// recursively through recipesFolder and all its subfolders — since recipes
// can live anywhere under recipesFolder (e.g. "Recettes/Cocktails"), a naive
// "${recipesFolder}/${name}.md" path would miss anything not directly at
// the root. Used anywhere a recipe is looked up by NAME alone (base recipe
// references, "used in" links) — not needed where a full file path is
// already known (e.g. editing an already-open recipe).
export function findRecipeFileByName(app: App, recipesFolder: string, recipeName: string): TFile | null {
	const files = app.vault
		.getMarkdownFiles()
		.filter((f: TFile) => f.path.startsWith(recipesFolder + '/') && f.basename === recipeName);

	return files[0] ?? null;
}
