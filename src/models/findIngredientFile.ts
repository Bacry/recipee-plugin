import { App, TFile } from 'obsidian';
import { findFileByBasename } from './fileSystemUtils';

export function findIngredientFileByName(app: App, ingredientsFolder: string, ingredientName: string): TFile | null {
	return findFileByBasename(app, ingredientsFolder, ingredientName);
}
