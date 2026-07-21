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
// "Cuisson et dressage"), rather than a single flat list — matches how
// real recipes are often written in stages.
export interface RecipeInstructionSection {
	title: string;
	steps: string[];
}

export interface Recipe {
	name: string;
	baseServings: number; // e.g. 4
	servingsLabel: string; // what's being counted, e.g. "crèmes", "parts"
	preparationDurationMin?: number;
	cookingDurationMin?: number;
	ingredients: RecipeIngredientEntry[];
	instructions: RecipeInstructionSection[];
}
