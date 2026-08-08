import { App, TFile } from 'obsidian';

export type ListField = 'type' | 'shop_section' | 'diet_flag';

export interface RenameResult {
	affectedCount: number; // number of ingredient files that were updated
}

// Checks whether renaming oldValue -> newValue would merge into an already
// existing value (i.e. newValue is already used somewhere, different from
// oldValue) — used to trigger a confirmation warning before proceeding.
export function wouldMergeWithExisting(
	app: App,
	ingredientsFolder: string,
	field: ListField,
	oldValue: string,
	newValue: string
): boolean {
	if (oldValue === newValue) return false;

	const files = app.vault.getMarkdownFiles().filter((f: TFile) => f.path.startsWith(ingredientsFolder + '/'));

	for (const file of files) {
		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		if (!frontmatter) continue;

		if (field === 'diet_flag') {
			const flags = Array.isArray(frontmatter.diet_flags) ? frontmatter.diet_flags : [];
			if (flags.includes(newValue)) return true;
		} else {
			const key = field === 'type' ? 'type' : 'shop_section';
			if (frontmatter[key] === newValue) return true;
		}
	}

	return false;
}

// Renames a type/shop_section/diet_flag value across every ingredient file
// that uses it. For "type" specifically, also physically moves each
// affected file into the new subfolder (since subfolder mirrors type).
export async function renameListValue(
	app: App,
	ingredientsFolder: string,
	field: ListField,
	oldValue: string,
	newValue: string
): Promise<RenameResult> {
	const files = app.vault.getMarkdownFiles().filter((f: TFile) => f.path.startsWith(ingredientsFolder + '/'));

	let affectedCount = 0;

	for (const file of files) {
		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		if (!frontmatter) continue;

		let matches = false;
		if (field === 'diet_flag') {
			const flags = Array.isArray(frontmatter.diet_flags) ? frontmatter.diet_flags : [];
			matches = flags.includes(oldValue);
		} else {
			const key = field === 'type' ? 'type' : 'shop_section';
			matches = frontmatter[key] === oldValue;
		}

		if (!matches) continue;

		const content = await app.vault.read(file);
		let updatedContent: string;

		if (field === 'diet_flag') {
			// Replace the exact quoted list item line, e.g. '  - "gluten"' -> '  - "sans_gluten"'.
			updatedContent = content.replace(
				new RegExp(`(-\\s*"?)${escapeRegex(oldValue)}("?\\s*\\n)`, 'g'),
				`$1${newValue}$2`
			);
		} else {
			const key = field === 'type' ? 'type' : 'shop_section';
			updatedContent = content.replace(
				new RegExp(`^(${key}:\\s*"?)${escapeRegex(oldValue)}("?\\s*)$`, 'm'),
				`$1${newValue}$2`
			);
		}

		await app.vault.modify(file, updatedContent);

		// For "type", also move the file into the new subfolder.
		if (field === 'type') {
			const newFolder = `${ingredientsFolder}/${newValue}`;
			if (!app.vault.getAbstractFileByPath(newFolder)) {
				await app.vault.createFolder(newFolder);
			}
			const newPath = `${newFolder}/${file.name}`;
			await app.fileManager.renameFile(file, newPath);
		}

		affectedCount++;
	}

	return { affectedCount };
}

function escapeRegex(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
