// Removes accents/diacritics from a string, so searches like "epinard"
// match "Épinards" — normalizes to NFD form (decomposes accented characters
// into a base letter + combining accent), then strips the accent marks.
export function normalizeForSearch(text: string): string {
	return text
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase();
}

// Lowercases only the first character of a name, leaving the rest untouched
// (e.g. "Farine" → "farine", "Lait demi-écrémé" → "lait demi-écrémé").
// Used to enforce a consistent naming convention across ingredient files
// and shopping list items.
export function lowerFirstLetter(text: string): string {
	if (text.length === 0) return text;
	return text.charAt(0).toLowerCase() + text.slice(1);
}

// Returns a new array sorted alphabetically (locale-aware, so accented
// characters sort naturally). Never mutates the input array.
export function sortAlphabetically(items: string[]): string[] {
	return [...items].sort((a, b) => a.localeCompare(b));
}

// Capitalizes only the first character for display purposes — the reverse
// of lowerFirstLetter, used everywhere a name is shown to the user (titles,
// links), while file names/identity keys stay lowercase everywhere else.
export function upperFirstLetter(text: string): string {
	if (text.length === 0) return text;
	return text.charAt(0).toUpperCase() + text.slice(1);
}
