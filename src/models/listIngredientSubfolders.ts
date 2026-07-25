import { App } from 'obsidian';
import { listSubfolders } from './fileSystemUtils';

export function listIngredientSubfolders(app: App, ingredientsFolder: string): string[] {
	return listSubfolders(app, ingredientsFolder);
}
