import { App, WorkspaceLeaf } from 'obsidian';

/**
 * NAVIGATION SYSTEM — OVERVIEW
 * =============================
 *
 * This plugin has several custom views (IngredientView, RecipeView,
 * ShoppingListView, NewIngredientView), and views can open other views —
 * e.g. clicking an ingredient link inside RecipeView opens IngredientView.
 * We want a "back" button that undoes this, like a browser's back button.
 *
 * THE CORE IDEA: each leaf (tab/pane) carries its own navigation history,
 * stored inside that leaf's view state (the same mechanism already used for
 * things like `filePath`). Since Obsidian persists view state per-leaf via
 * setState/getState, two separate tabs each have their OWN independent
 * history — opening a recipe in tab A and navigating around inside it does
 * not affect what's going on in tab B. No global/shared state is needed.
 *
 * WHAT'S STORED: every one of our views' state object now includes a
 * `history` array in addition to its own specific fields (e.g. `filePath`).
 * Each entry in that array is a NavigationEntry: "if the user hits back,
 * switch this leaf to THIS view type, with THIS state, and THIS shorter
 * history".
 *
 * HOW "NAVIGATE FORWARD" WORKS (navigateTo):
 * 1. Read the leaf's CURRENT view type + state (before we change anything).
 * 2. Build a new history array = [...currentHistory, entry for the current
 *    screen we're leaving].
 * 3. Call leaf.setViewState with the NEW view type/state, and attach this
 *    extended history array so the new screen knows how to go back.
 *
 * HOW "GO BACK" WORKS (navigateBack):
 * 1. Read the leaf's current state, specifically its `history` array.
 * 2. If it's empty, there's nowhere to go back to — no-op (the view should
 *    hide/disable its back button in this case, see canNavigateBack).
 * 3. Otherwise, pop the last entry off the history array.
 * 4. Call leaf.setViewState with that popped entry's view type/state, and
 *    the now-shorter history array.
 *
 * WHY THIS LIVES IN A SEPARATE FILE: every view (IngredientView, RecipeView,
 * etc.) needs to call navigateTo/navigateBack the same way, so this logic is
 * centralized here instead of being duplicated (and subtly re-implemented
 * slightly differently) in each view class.
 *
 * WHAT EACH VIEW MUST DO TO PARTICIPATE:
 * - Its state interface must extend NavigableViewState (i.e. include a
 *   `history: NavigationEntry[]` field, defaulting to an empty array).
 * - Its setState/getState must read/write that `history` field like any
 *   other piece of state.
 * - When it wants to open another view (e.g. RecipeView opening
 *   IngredientView on an ingredient click), it must call `navigateTo`
 *   instead of directly calling `leaf.setViewState`.
 * - It should render a "back" button when `canNavigateBack(state)` is true,
 *   wired to call `navigateBack`.
 */

// One step in a leaf's navigation history: enough information to fully
// restore a previously-shown screen.
export interface NavigationEntry {
	viewType: string;
	viewState: Record<string, unknown>;
}

// Every view state that wants to support back-navigation must include this.
export interface NavigableViewState {
	history: NavigationEntry[];
}

// Switches a leaf to a new view type + state, while pushing the leaf's
// CURRENT view type + state onto the history so it can be restored later
// via navigateBack. Call this instead of leaf.setViewState directly whenever
// a view is about to open another view type on the same leaf.
export async function navigateTo(
	leaf: WorkspaceLeaf,
	newViewType: string,
	newViewState: Record<string, unknown>
): Promise<void> {
	// leaf.view gives us access to the CURRENTLY displayed view, before we
	// switch away from it — this is how we capture "what we're leaving".
	const currentViewType = leaf.view.getViewType();
	const currentViewState = leaf.view.getState() as Record<string, unknown>;

	// Extract the current history so we can extend it (rather than replacing
	// it), and strip it out of the entry we're about to push — otherwise
	// history arrays would nest inside each other and grow unboundedly.
	const { history: currentHistory, ...currentStateWithoutHistory } =
		currentViewState as NavigableViewState & Record<string, unknown>;

	const newHistory: NavigationEntry[] = [
		...(currentHistory ?? []),
		{ viewType: currentViewType, viewState: currentStateWithoutHistory },
	];

	await leaf.setViewState({
		type: newViewType,
		active: true,
		state: { ...newViewState, history: newHistory },
	});
}

// Pops the last entry off the leaf's history and restores that screen.
// Does nothing if there's no history (nowhere to go back to) — callers
// should check canNavigateBack first to decide whether to show a back button.
export async function navigateBack(leaf: WorkspaceLeaf): Promise<void> {
	const currentViewState = leaf.view.getState() as NavigableViewState & Record<string, unknown>;
	const history = currentViewState.history ?? [];

	if (history.length === 0) return;

	const previous = history[history.length - 1];
	const remainingHistory = history.slice(0, -1);

	await leaf.setViewState({
		type: previous.viewType,
		active: true,
		state: { ...previous.viewState, history: remainingHistory },
	});
}

// Helper for views to decide whether to render a back button at all.
export function canNavigateBack(state: NavigableViewState): boolean {
	return (state.history?.length ?? 0) > 0;
}

// Convenience wrapper combining canNavigateBack + navigateBack/leaf.detach —
// most views just want "go back if possible, otherwise close", so this
// saves each view class from re-implementing that same two-line decision.
export async function closeOrGoBack(leaf: WorkspaceLeaf, history: NavigationEntry[]): Promise<void> {
	if (canNavigateBack({ history })) {
		await navigateBack(leaf);
	} else {
		leaf.detach();
	}
}
