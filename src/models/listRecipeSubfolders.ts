import { App } from 'obsidian';
import { listSubfolders } from './fileSystemUtils';

export function listRecipeSubfolders(app: App, recipesFolder: string): string[] {
	return listSubfolders(app, recipesFolder);
}
