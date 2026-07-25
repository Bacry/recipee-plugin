import { App, TFile } from 'obsidian';
import { Recipe } from './recipe';
import { buildRecipeMarkdown } from './buildRecipeMarkdown';
import { findRecipeFileByName } from './findRecipeFile';
import { normalizeNameForFile } from './textNormalize';
import { ensureFolderExists } from "./fileSystemUtils";

interface CreateRecipeOptions {
	app: App;
	recipesFolder: string;
	recipe: Recipe; // already validated via formValuesToRecipe
	subfolder: string; // "" = root of recipesFolder
}

interface UpdateRecipeOptions {
	app: App;
	recipesFolder: string;
	file: TFile;
	recipe: Recipe;
	subfolder: string;
}

function buildRecipePath(recipesFolder: string, subfolder: string, name: string): string {
	return subfolder.trim() === '' ? `${recipesFolder}/${name}.md` : `${recipesFolder}/${subfolder}/${name}.md`;
}

export async function createRecipe({ app, recipesFolder, recipe, subfolder }: CreateRecipeOptions): Promise<TFile> {
	const normalizedName = normalizeNameForFile(recipe.name);

	if (!normalizedName) {
		throw new Error('Le nom est obligatoire.');
	}

	const existing = findRecipeFileByName(app, recipesFolder, normalizedName);
	if (existing) {
		throw new Error(`Une recette "${normalizedName}" existe déjà (${existing.path}).`);
	}

	const path = buildRecipePath(recipesFolder, subfolder, normalizedName);
	const targetFolder = path.slice(0, path.lastIndexOf('/'));
	await ensureFolderExists(app, targetFolder);

	return app.vault.create(path, buildRecipeMarkdown({ ...recipe, name: normalizedName }));
}

export async function updateRecipe({ app, recipesFolder, file, recipe, subfolder }: UpdateRecipeOptions): Promise<TFile> {
	const normalizedName = normalizeNameForFile(recipe.name);

	if (!normalizedName) {
		throw new Error('Le nom est obligatoire.');
	}

	const existing = findRecipeFileByName(app, recipesFolder, normalizedName);
	if (existing && existing.path !== file.path) {
		throw new Error(`Une recette "${normalizedName}" existe déjà (${existing.path}).`);
	}

	const newPath = buildRecipePath(recipesFolder, subfolder, normalizedName);
	const targetFolder = newPath.slice(0, newPath.lastIndexOf('/'));
	await ensureFolderExists(app, targetFolder);

	// app.fileManager.renameFile (not app.vault.rename) also updates any
	// [[links]] pointing to this file elsewhere in the vault.
	if (newPath !== file.path) {
		await app.fileManager.renameFile(file, newPath);
	}

	await app.vault.modify(file, buildRecipeMarkdown({ ...recipe, name: normalizedName }));

	return file;
}
