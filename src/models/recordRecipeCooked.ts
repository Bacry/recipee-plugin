import { App, TFile } from 'obsidian';
import { parseRecipeFromFrontmatter } from './parseRecipe';
import { buildRecipeMarkdown } from './buildRecipeMarkdown';

// Returns today's date as "YYYY-MM-DD", in the local timezone.
function todayIso(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export interface RecordCookedResult {
	success: boolean;
	alreadyRecordedToday: boolean;
}

// Appends today's date to the recipe's cooked_dates list, unless today is
// already present (at most one entry per day).
export async function recordRecipeCookedToday(app: App, file: TFile): Promise<RecordCookedResult> {
	const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
	const { recipe } = parseRecipeFromFrontmatter(frontmatter, file.basename);
	if (!recipe) return { success: false, alreadyRecordedToday: false };

	const today = todayIso();
	if (recipe.cookedDates.includes(today)) {
		return { success: false, alreadyRecordedToday: true };
	}

	const updatedRecipe = { ...recipe, cookedDates: [...recipe.cookedDates, today] };
	await app.vault.modify(file, buildRecipeMarkdown(updatedRecipe));

	return { success: true, alreadyRecordedToday: false };
}
