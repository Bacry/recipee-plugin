// A recipe references ingredients by name (matching a file in the ingredients
// folder) — no support yet for using another recipe as an ingredient
// (deferred: recursive nutrition calc + circular-reference risk).
export interface RecipeIngredientEntry {
	ingredientName: string;
	quantity: number | null; // null = no specific amount (e.g. "vanille, à volonté")
	unit: string; // "" = entity (e.g. "6 eggs"), else "g", "cl", etc.
	form?: string; // optional free text, e.g. "haché" — not validated against possible_forms
}

// A recipe's instructions are split into named sections (e.g. "Instructions",
// "Cuisson et dressage"). Each section holds a single free-form markdown block
// (not a list of steps) — the user writes their own bullet points, bold text,
// etc. directly, and it can be toggled between raw editing and rendered preview.
export interface RecipeInstructionSection {
	title: string;
	content: string; // raw markdown, e.g. "- Faire bouillir le lait\n- Rajouter la vanille"
}

export interface Recipe {
	name: string;
	baseServings: number;
	servingsLabel: string;
	preparationDurationMin?: number;
	cookingDurationMin?: number;
	ingredients: RecipeIngredientEntry[];
	instructions: RecipeInstructionSection[];
	notes?: string; // optional free-form markdown block for miscellaneous notes, separate from instructions
	source?: string; // free text, or a URL — rendered as a clickable link if it looks like one
	image?: string; // filename of an attachment already present in the vault, e.g. "crème brulée.png"
	tags: string[]; // e.g. ["dessert", "sans gluten"] — always an array, empty if none
}
