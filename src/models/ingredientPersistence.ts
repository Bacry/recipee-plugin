import { App, TFile } from "obsidian";
import type { IngredientFormValues } from "../components/IngredientForm";
import { buildIngredientMarkdown } from "./buildIngredientMarkdown";
import { findIngredientFileByName } from "./findIngredientFile";
import { normalizeNameForFile } from "./textNormalize";
import { ensureFolderExists } from "./fileSystemUtils";

interface CreateIngredientOptions {
	app: App;
	ingredientsFolder: string;
	values: IngredientFormValues;
}

interface UpdateIngredientOptions {
	app: App;
	ingredientsFolder: string;
	file: TFile;
	values: IngredientFormValues;
}

export async function createIngredient({
										   app,
										   ingredientsFolder,
										   values,
									   }: CreateIngredientOptions): Promise<TFile> {
	const normalizedName = normalizeNameForFile(values.name);

	if (!normalizedName) {
		throw new Error("Le nom est obligatoire.");
	}

	const existing = findIngredientFileByName(
		app,
		ingredientsFolder,
		normalizedName
	);

	if (existing) {
		throw new Error(
			`Un ingrédient "${normalizedName}" existe déjà (${existing.path}).`
		);
	}

	const targetFolder = `${ingredientsFolder}/${values.type}`;
	await ensureFolderExists(app, targetFolder);

	const path = `${targetFolder}/${normalizedName}.md`;

	const content = buildIngredientMarkdown({
		...values,
		name: normalizedName,
	});

	return app.vault.create(path, content);
}

export async function updateIngredient({
										   app,
										   ingredientsFolder,
										   file,
										   values,
									   }: UpdateIngredientOptions): Promise<TFile> {
	const normalizedName = normalizeNameForFile(values.name);

	if (!normalizedName) {
		throw new Error("Le nom est obligatoire.");
	}

	const existing = findIngredientFileByName(
		app,
		ingredientsFolder,
		normalizedName
	);

	if (existing && existing.path !== file.path) {
		throw new Error(
			`Un ingrédient "${normalizedName}" existe déjà (${existing.path}).`
		);
	}

	const targetFolder = `${ingredientsFolder}/${values.type}`;
	await ensureFolderExists(app, targetFolder);

	const newPath = `${targetFolder}/${normalizedName}.md`;

	if (newPath !== file.path) {
		await app.fileManager.renameFile(file, newPath);
	}

	const content = buildIngredientMarkdown({
		...values,
		name: normalizedName,
	});

	await app.vault.modify(file, content);

	return file;
}
