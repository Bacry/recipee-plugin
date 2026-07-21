import { App, TFile } from 'obsidian';

// The "Autres" note is a plain markdown checklist — one line per known
// non-ingredient item name, e.g. "- [ ] Éponges". It's intentionally simple
// (no frontmatter) so it stays easy to read/edit by hand, unlike the
// structured shopping list note.

// Makes sure the note exists, creating it empty if needed.
async function ensureOtherItemsNoteExists(app: App, path: string): Promise<TFile> {
	const existing = app.vault.getAbstractFileByPath(path);
	if (existing instanceof TFile) return existing;
	return app.vault.create(path, '');
}

export interface OtherItemEntry {
	name: string;
	shopSection: string | null; // null if no #xxx tag was added yet
}

// Parses every checklist line into a name + optional shop-section tag.
// This is the single source of truth for how a line is split — both
// extractNames (autocomplete) and getOtherItemShopSection (display) rely on
// it, so they can never disagree on what the "name" part of a line is.
function extractEntries(content: string): OtherItemEntry[] {
	const entries: OtherItemEntry[] = [];
	const lineRegex = /^- \[[ x]\] (.+)$/gm;
	let match: RegExpExecArray | null;

	while ((match = lineRegex.exec(content)) !== null) {
		const fullText = match[1].trim();
		const tagMatch = fullText.match(/#(\S+)/);

		if (tagMatch) {
			// Strip the tag from the name itself, so "Éponges #entretien" → name "Éponges"
			const name = fullText.slice(0, tagMatch.index).trim();
			entries.push({ name, shopSection: tagMatch[1] });
		} else {
			entries.push({ name: fullText, shopSection: null });
		}
	}

	return entries;
}

// Extracts just the item names (tag stripped), for use in autocomplete.
function extractNames(content: string): string[] {
	return extractEntries(content).map((entry) => entry.name);
}

// Returns all known "other" item names, for use in autocomplete.
export async function getOtherItemNames(app: App, path: string): Promise<string[]> {
	const file = await ensureOtherItemsNoteExists(app, path);
	const content = await app.vault.read(file);
	const names = extractNames(content);
	return names;
}

// Appends a new item name to the note, but only if it's not already there
// (case-insensitive comparison, to avoid near-duplicates like "Éponges" / "éponges").
export async function addOtherItemNameIfMissing(app: App, path: string, name: string): Promise<void> {
	const file = await ensureOtherItemsNoteExists(app, path);
	const content = await app.vault.read(file);
	const existingNames = extractNames(content);

	const alreadyThere = existingNames.some((n) => n.toLowerCase() === name.toLowerCase());
	if (alreadyThere) return;

	const separator = content.endsWith('\n') || content === '' ? '' : '\n';
	await app.vault.modify(file, `${content}${separator}- [ ] ${name}\n`);
}

// Looks up the shop section tagged for a given item name in the "Autres" note.
// Returns null if the item isn't found, or found but not yet tagged with a section.
export async function getOtherItemShopSection(
	app: App,
	path: string,
	itemName: string
): Promise<string | null> {
	const file = await ensureOtherItemsNoteExists(app, path);
	const content = await app.vault.read(file);
	const entries = extractEntries(content);

	const match = entries.find((e) => e.name.toLowerCase() === itemName.toLowerCase());
	return match?.shopSection ?? null;
}

// Updates (or adds) the #xxx shop-section tag on a given item's line in the
// "Autres" note. If the item already had a tag, it's replaced; if it had none,
// one is appended. Leaves the checked state and everything else untouched.
export async function setOtherItemShopSection(
	app: App,
	path: string,
	itemName: string,
	shopSection: string
): Promise<void> {
	const file = await ensureOtherItemsNoteExists(app, path);
	const content = await app.vault.read(file);
	const lines = content.split('\n');

	const updatedLines = lines.map((line) => {
		const lineMatch = line.match(/^(- \[[ x]\] )(.+)$/);
		if (!lineMatch) return line;

		const [, prefix, fullText] = lineMatch;
		const tagMatch = fullText.match(/#(\S+)/);
		const currentName = tagMatch ? fullText.slice(0, tagMatch.index).trim() : fullText.trim();

		if (currentName.toLowerCase() !== itemName.toLowerCase()) return line;

		return `${prefix}${currentName} #${shopSection}`;
	});

	await app.vault.modify(file, updatedLines.join('\n'));
}
