# Recipe & Shopping List Plugin for Obsidian

This plugin turns Obsidian into a self-contained recipe manager. You work almost entirely inside a handful of **dedicated views** — mainly Recipes, Ingredients, and Shopping List — reachable from the icons in the left ribbon (or the mobile menu ☰ on phone/tablet). You don't need to open, read, or edit any markdown note directly to use the plugin day to day.

Under the hood, every recipe, ingredient or shopping list  *is* still a plain markdown note (see [Data Format](#data-format) in Advanced Features) — but that's an implementation detail, not something you need to think about.

The plugin can also connect to two optional external services to help fill in your data faster — both are off by default, quick to turn on, and fully explained step by step in [USDA Nutrition Lookup](#usda-nutrition-lookup) and [AI Assistance (Claude)](#ai-assistance-claude) below.

> This guide reflects the plugin's default settings: **English**, and the **US measurement system** (cups, oz, lb...). Several other languages are available too, with more added over time, and you can switch to the **Metric** system at any time — both from Settings. See [Language & Units](#language--units) in Advanced Features. 

<p align="center">
<img src="screenshots/recipe-view.png" width="500" alt="Recipe view screenshot">
</p>

## Table of Contents

- [Quick Start](#quick-start)

**Basic Features**
- [The Ribbon Icons](#the-ribbon-icons)
- [Creating an Ingredient](#creating-an-ingredient)
- [Creating a Recipe](#creating-a-recipe)
	- [Servings, explained](#servings-explained)
	- [Adding ingredients: the full input flow](#adding-ingredients-the-full-input-flow)
- [Viewing a Recipe & Its Nutrition](#viewing-a-recipe--its-nutrition)
- [Shopping List](#shopping-list)
- [Browsing & Filtering Recipes and Ingredients](#browsing--filtering-recipes-and-ingredients)

**Advanced Features**
- [Commands](#commands)
- [Recipe Sections & Base Recipes](#recipe-sections--base-recipes)
- [Frying & Oil Absorption](#frying--oil-absorption)
- [Diet Flags & Filtering by Constraint](#diet-flags--filtering-by-constraint)
- [Manage Lists](#manage-lists)
- [AI Assistance (Claude)](#ai-assistance-claude)
- [USDA Nutrition Lookup](#usda-nutrition-lookup)
- [Language & Units](#language--units)
- [Data Format](#data-format)

**Reference**
- [Settings Reference](#settings-reference)
- [FAQ & Tips](#faq--tips)
- [Installation](#installation)
- [Contributing](#contributing) · [License](#license)

---

## Quick Start

The fastest way to get a feel for the plugin is to explore it with real data already in it, rather than starting from a blank vault. This walkthrough takes about ten minutes and doesn't assume you've read anything else in this guide.

### Step 1 — Load the example data

Open the command palette (`Cmd/Ctrl+P`) and run **"Load example data"**. This adds a small set of ready-made ingredients and recipes to your vault — in an `Examples` subfolder inside each of your configured folders, so it's easy to find, delete later, or even hide from Obsidian's file explorer entirely (you'll never need to browse these notes directly). Nothing existing in your vault is touched, and running it again is safe (it never overwrites anything).

### Step 2 — Explore, without editing anything

- Open the <img src="screenshots/icons/icon-recipe-list.png" width="24" alt="Recipe list icon"> **Recipe List** — you'll see four example recipes. Try the search box, the tag filter, and sorting by column.
- Click into **"Fried Chicken Tenders"** — it's the richest example.
	- Try changing the servings number at the top of the ingredient list too, and watch every quantity and the Nutrition table (at the bottom) recalculate. Click <img src="screenshots/icons/icon-reset.png" width="24" alt="Reset icon"> to reset the servings back to the recipe's original number.
	- Notice the frying oil ingredient in the list of ingredients. And, close to the Nutrition table, notice the editable **absorption percentage**: fried food soaks up some of the oil it's cooked in, which isn't captured by the raw ingredient weights alone — this percentage estimates how much, and adds that oil's calories/fat to the totals. Try changing the number and watch the nutrition table update live.
	- Ingredient names in the list are clickable links — click **"Chicken breast"** to open its own sheet (nutrition facts, which other recipes use it, etc.). Click <img src="screenshots/icons/icon-back.png" width="22" alt="Back icon"> (top right — always takes you back to whatever you were looking at before) to return to the recipe.
	- Click <img src="screenshots/icons/icon-back.png" width="22" alt="Back icon"> again to return to the Recipe List. 

<p align="center">
<img src="screenshots/quickstart-fried-chicken.png" width="500" alt="Fried Chicken Tenders recipe view, showing sections and the frying/absorption block">
</p>

- Open the <img src="screenshots/icons/icon-ingredient-list.png" width="24" alt="Ingredient list icon"> **Ingredient List** — the ten example ingredients, organized by type and shop section. Try sorting by any column, and filtering by type or dietary constraint. Click on any ingredient to open its own sheet, then <img src="screenshots/icons/icon-back.png" width="22" alt="Back icon"> to return to the list.

### Step 3 — Create a recipe using ingredients that already exist

1. Click <img src="screenshots/icons/icon-new-recipe.png" width="24" alt="New recipe icon"> — since the example data includes a recipe template, a small picker appears asking which one to start from. Choose **"Empty recipe"** (always listed first) — templates are just a way to pre-fill common fields for a recipe type you make often, not needed here. A blank recipe form opens.

<p align="center">
<img src="screenshots/quickstart-template-picker.png" width="500" alt="Template picker, with "Empty recipe" as the first option">
</p>

2. In the **Name** field, type `Sweetened Milk`.
3. In **Base servings**, type `1`. In **Serving unit**, type `glass` — together these just mean "this recipe makes 1 glass".
4. In the **Tags** field, start typing `dri` — a suggestion for `drink` appears (an existing tag, already used on other example recipes). Click it to add it, or press Enter.
5. Scroll to the ingredient input at the bottom of the ingredients section. Type `who` — a suggestion for "whole milk" appears (one of the example ingredients). Click it, or press **Enter** to accept it. Now type `1cup` (a number directly followed by a unit, no space needed) and press **Enter** again — this is the quantity. The line `1cup of Whole milk` appears in the list.
6. Add a second ingredient the same way: type `sug`, pick **"sugar"** from the suggestions, then type `1tbsp` and press **Enter**. The line `1tbsp of Sugar` appears.
7. In the **Instructions** box, type your steps as a numbered markdown list, starting with a heading: `#### Preparation` on its own line, then `1. Warm the milk gently.` and `2. Stir in the sugar until dissolved.` below it. The `####` is what makes that line display as a heading in the recipe view — you'll see the same style used for a `#### Cooking` section later, on recipes that need one. 
 
<p align="center">
<img src="screenshots/quickstart-recipe-form.png" width="500" alt="Recipe form with ingredients added">
</p>

8. Click <img src="screenshots/icons/icon-save.png" width="24" alt="Save icon"> (saves whatever form you're filling in) at the top right of the view to save the recipe. You're now looking at the finished recipe, with a nutrition table already computed from whole milk and sugar's own nutrition facts.


### Step 4 — Add an ingredient that doesn't exist yet

Real recipes often call for something you haven't created a sheet for. Let's see what that looks like.

1. Click <img src="screenshots/icons/icon-edit.png" width="24" alt="Edit icon"> (switches the recipe from read-only into an editable form) on the "Sweetened Milk" recipe you just created.
2. In the ingredient input, type `vanilla extract` — since no ingredient by that name exists, no suggestion appears. Press **Enter** anyway to accept it as free text, then type `1tsp` and press **Enter** to set its quantity.
3. Click <img src="screenshots/icons/icon-save.png" width="24" alt="Save icon"> to save the recipe again. Notice the recipe still works fine — "Vanilla extract" shows up in the ingredient list as a red link, since it has no sheet yet. Clicking it would take you straight to a pre-filled "new ingredient" form — but let's do it from the Ingredient List instead, to see that view too.
4. Open the <img src="screenshots/icons/icon-ingredient-list.png" width="24" alt="Ingredient list icon"> **Ingredient List** and switch to the **"Undefined"** tab — "Vanilla extract" is listed there now.

<p align="center">
<img src="screenshots/quickstart-undefined-ingredient.png" width="500" alt="Undefined ingredient tab, with the new ingredient listed">
</p> 

5. Click on the name of the ingredient "Vanilla extract" — a new ingredient form opens, with the **Name** field already filled in.
6. Fill in a **Type** (e.g. `other`) and a **Shop section** (e.g. `pantry`), then a rough set of **nutrition facts per 100g** (exact values don't matter for this walkthrough — even all zeros is fine).

<p align="center">
<img src="screenshots/quickstart-new-ingredient.png" width="500" alt="The new ingredient form">
</p>

7. Click <img src="screenshots/icons/icon-save.png" width="24" alt="Save icon"> to save the ingredient.
8. Go back to the <img src="screenshots/icons/icon-recipe-list.png" width="24" alt="Recipe list icon"> **Recipe List** and open "Sweetened Milk" again — "Vanilla extract" is now a clickable link, and it's included in the nutrition table too.


### Step 5 — The Shopping List

1. Open the <img src="screenshots/icons/icon-shopping-list.png" width="24" alt="Shopping list icon"> **Shopping List** — it's empty so far.
2. Go to <img src="screenshots/icons/icon-recipe-list.png" width="24" alt="Recipe list icon"> **Recipe List** and open your **"Sweetened Milk"** recipe.
3. Click the shopping cart icon (🛒) at the top of the ingredient list — this adds all of that recipe's ingredients to your shopping list, scaled to its servings. The **Shopping List** opens — Whole milk, Sugar, and Vanilla extract are now listed, grouped by shop section.
4.Click the checkmark (✓) next to one of them to mark it bought — the line gets struck through. Click ✓ again to undo it.
5. Click the ✕ next to another one to remove it from the list entirely.
7. Now type directly into the input at the top of the list — e.g. `Sponges` — and press **Enter** twice (once to accept the name, once more since it has no fixed quantity). It's added as a plain item, with no ingredient sheet required — this is how you add anything to your shopping list beyond just recipe ingredients (Note that you could have added a quantity also) 

<p align="center">
<img src="screenshots/quickstart-shopping-list.png" width="500" alt="The shopping list">
</p>

---

That's the whole loop: browse example data, then build your own recipes and ingredients on top of it. Everything below is a more detailed reference for every field and feature you just touched — come back to it whenever you want the full picture of something.

---

# Basic Features

Everything in this section gets you fully productive — writing recipes, checking nutrition, and shopping — without touching any markdown obsidian notes.

## The Ribbon Icons

Five icons open the plugin's main views, plus one for tags list managent:

| Icon | Opens                                                                                   |
|---|-----------------------------------------------------------------------------------------|
| <img src="screenshots/icons/icon-recipe-list.png" width="24" alt="Recipe list icon"> | The **Recipe List** — browse, search, and filter every recipe in your vault             |
| <img src="screenshots/icons/icon-new-recipe.png" width="24" alt="New recipe icon"> | A blank **new recipe** form — see [Creating a Recipe](#creating-a-recipe)               |
| <img src="screenshots/icons/icon-ingredient-list.png" width="24" alt="Ingredient list icon"> | The **Ingredient List** — browse, search, and filter every ingredient in your vault     |
| <img src="screenshots/icons/icon-new-ingredient.png" width="24" alt="New ingredient icon"> | A blank **new ingredient** form — see [Creating an Ingredient](#creating-an-ingredient) |
| <img src="screenshots/icons/icon-shopping-list.png" width="24" alt="Shopping list icon"> | Managing your **Shopping List**                                                         |
| <img src="screenshots/icons/icon-manage-lists.png" width="24" alt="Manage lists icon"> | **Manage Lists** — a separate, more advanced view, see [Manage Lists](#manage-lists)    |

On mobile, tap the menu icon (☰) in the top bar to reveal the same six icons.

Everything described in this guide happens through these ribbon icons and the on-screen buttons inside each view — the command palette is never required for everyday use, though every action is also available there if you prefer it (see [Commands](#commands)).

## Creating an Ingredient

Click the <img src="screenshots/icons/icon-new-ingredient.png" width="18" alt="New ingredient icon"> ribbon icon to open a blank ingredient form.

<p align="center">
<img src="screenshots/empty-ingredient-form.png" width="500" alt="Empty ingredient form">
</p>

Fill in:

- **Name** *(required)* — this becomes the ingredient's file name, and the name you'll search for when adding it to a recipe.
- **Type** *(required)* — a category like "vegetable", "dairy", "oil"... Pick from existing types (managed in [Manage Lists](#manage-lists)).
- **Shop section** *(required)* — where you'd find it in a store (e.g. "produce", "dairy"). Used to group your [shopping list](#shopping-list) by aisle. Pick from existing shop sections (managed in [Manage Lists](#manage-lists)).
- **Density (g/mL)** *(optional)* — indicates the weight (in g) per volume (in mL). It allows the plugin to convert between weight quantity and volume quantity for this ingredient (e.g. the density of milk is 1, the same as water : so "200g of milk" corresponds to "200ml of milk").
- **Unit weight (g)** *(optional)* — where applicable: specifies the weight of a whole unit (e.g., an egg, a cucumber). This allows you to: i) enter "3 eggs" in a recipe and let the plugin determine the weight for nutritional calculations, or ii) conversely, determine how many cucumbers to buy for a recipe requiring 200 g of cucumber.
- **Forms** *(optional)* — a comma-separated list of preparation forms this ingredient can take (e.g. `whole, chopped, diced`). These become autocomplete suggestions when you add this ingredient to a recipe — see [Adding ingredients](#adding-ingredients-the-full-input-flow).
- **Constraints** *(optional)* — check any dietary flags this ingredient triggers (gluten, lactose, a specific allergen...). Used to filter recipes — see [Diet Flags & Filtering](#diet-flags--filtering-by-constraint). Pick from existing types (managed in [Manage Lists](#manage-lists)).
- **Brand** *(optional)* — free text, useful to indicate the brand the indicated nutrition values are based on.
- **Nutritional values (per 100g)** — calories, Fat (with a "of which unsaturated" sub-field), Carbohydrates (with a "of which sugars" sub-field), Proteins, Salt, Fiber, Cholesterol. These are the numbers every recipe's nutrition table is built from — see [Viewing a Recipe & Its Nutrition](#viewing-a-recipe--its-nutrition).

  *<u>Filling these in by hand is the default flow. If you'd rather look them up or have them suggested automatically, see [USDA Nutrition Lookup](#usda-nutrition-lookup) and [AI Assistance](#ai-assistance-claude) in Advanced Features — both are optional and can be turned off entirely.* </u>

Click the save icon (<img src="screenshots/icons/icon-save.png" width="24" alt="Save icon"> , top right) when done.

## Creating a Recipe

Click the <img src="screenshots/icons/icon-new-recipe.png" width="18" alt="New recipe icon"> ribbon icon. You'll be asked to pick an existing template (a partly pre-filled form) or start from a blank one — choose **"Empty recipe"** (always listed first) for a fully blank form like this one:

<p align="center">
<img src="screenshots/empty-recipe-form.png" width="500" alt="Empty recipe form">
</p>

*If Claude is enabled (see [AI Assistance](#ai-assistance-claude)), an "Extract from text" button appears at the very top — lets you paste a recipe from elsewhere and have its fields filled in automatically. Entirely optional; the rest of this section covers filling the form in by hand.*

### General information

- **Name** *(required)* — becomes the recipe's file name.
- **Recipe already made before** — check this if you've cooked it many times in the past but never tracked the dates; leave unchecked otherwise. See [Viewing a Recipe & Its Nutrition](#viewing-a-recipe--its-nutrition) for how history tracking works.
- **This is a base recipe** — check this if you want this recipe usable as a component of other recipes (e.g. a sauce or dough reused elsewhere). See [Recipe Sections & Base Recipes](#recipe-sections--base-recipes) in Advanced Features.
- **Base servings** and **Serving unit** *(both required)* — see [Servings, explained](#servings-explained) below.
- **Preparation (min)** *(optional)* — a plain number.
- **Requires cooking** *(required)* — a checkbox that unlocks two more fields once checked: a cooking **Time** (min), and a **Weight** field for the dish's measured final weight once cooked. Leave the weight field empty if you haven't weighed it. It is needed for the plugin to estimate the Nutrition table values for 100g (see [Viewing a Recipe](#viewing-a-recipe--its-nutrition)).
- **Subfolder** *(optional)* — a dropdown of existing subfolders inside your recipes folder, to file this recipe under one of them (e.g. "Cocktails"). Leave on "-- Root --" to save it directly in your main recipes folder.
- **Image** *(optional)* — either type a filename directly, or click **"Choose"** to upload an image file from your computer; it's saved to your [configured recipe images folder](#settings-reference) and linked automatically.

Below that, two more fields on their own row:

- **Tags** *(optional)* — comma-separated, with autocomplete suggesting tags you've already used elsewhere. Used for filtering in the [Recipe List](#browsing--filtering-recipes-and-ingredients).
- **Source** *(optional)* — free text or a URL (rendered as a clickable "web" link if it's a URL), with autocomplete suggesting sources you've already used.

### Servings, explained

Every recipe has two related fields:

- **Base servings** *(required)* — a number, e.g. `4`.
- **Serving unit** *(required)* — a word describing what that number counts, e.g. `servings`, `cookies`, `cocktails`, `loaf`. This is entirely free text — use whatever makes sense for the recipe.

Together, these mean "this recipe as written makes 4 servings" (or 4 cookies, or 1 loaf, etc.). Later, in the [recipe view](#viewing-a-recipe--its-nutrition), you can change this number — say, to `8` — and every ingredient quantity *and* the nutrition table scale automatically. Nothing about how you write the recipe needs to change; scaling only happens at viewing time.

### Adding ingredients: the full input flow

This is the part worth understanding well, since you'll use it constantly. The ingredient field walks you through up to three steps for each line — **name → complement/form → quantity** — confirming each with **Enter** (or the on-screen keyboard's "Done"/✓ key on mobile).

**Step 1 — Name.** Start typing (2+ letters triggers suggestions). You'll see:
- Ingredients you've already created
- If an ingredient has [forms](#creating-an-ingredient) declared on its sheet, each form appears as its own suggestion, e.g. `Chicken` **and** `Chicken (chopped)` **and** `Chicken (diced)` as separate options.
- Other recipes marked as a **base recipe**, labeled `(recipe)` — see [Recipe Sections & Base Recipes](#recipe-sections--base-recipes).

Press **Enter** to accept the highlighted suggestion, or just type a name and press Enter to use free text (useful for an ingredient you haven't created a sheet for yet — you can create it later from the [Ingredient List](#browsing--filtering-recipes-and-ingredients)'s "undefined ingredients" tab).

If you picked a suggestion that already included a form (like `Chicken (chopped)`), that form is locked in — there's no separate step for it.

**Step 2 — Complement or quantity.** Type here, then press Enter. The plugin checks: does what you typed look like a quantity (a number, optionally followed by a unit)? If yes, it's used as the quantity and the line is done. If not, it's treated as a free-text **complement** (e.g. a brand, "organic", "low-sodium") — press Enter again to move on to Step 3.

**Step 3 — Quantity** *(only reached if you typed a complement in Step 2)*. Type a quantity, or leave it blank for an "as needed" ingredient with no fixed amount. Press Enter to finish the line.

At any step, pressing **Backspace** on an empty input steps back to re-edit the previous piece.

**Quantities** accept a plain number, a number with a unit attached (no space needed), or a fraction:
By default, the plugin uses the **US measurement system** — quantities you type are kept as-is if they're already in a US unit (`oz`, `lb`, `cup`, `tbsp`, `tsp`), and automatically converted if you type a Metric one instead. (Switch to Metric as your default anytime in Settings — see [Language & Units](#language--units).)

| You type | Understood as |
|---|---|
| `8oz` | 8 ounces |
| `1/2` | 0.5 (unitless — a whole-item count) |
| `1 1/2cup` | 1.5 cups |
| `2tbsp` | 2 tablespoons |
| `3` | 3 whole units (e.g. "3 eggs") |

Supported units: `oz`, `lb`, `cup`, `tbsp`, `tsp` (US), and `g`, `kg`, `l`, `dl`, `cl`, `ml`, `cs`, `cc`, `dash` (Metric).

Typing a unit from the system you're *not* using by default is fine — it's automatically converted to your preferred one on save. For example, if you type `250g`, since the default here is US, it's instantly converted and stored as `8.8oz` — the recipe always ends up in your preferred system, no matter which one you typed in.

**Worked examples:**

| What you type, step by step | Result |
|---|---|
| `Flour` → Enter → `8oz` → Enter | 8oz of Flour |
| `Chicken (chopped)` *(picked from suggestions)* → Enter → `1lb` → Enter | 1lb of Chicken (chopped) |
| `Soy sauce` → Enter → `low-sodium` → Enter → `2tbsp` → Enter | 2tbsp of Soy sauce (low-sodium) |
| `Salt` → Enter → *(leave blank)* → Enter | Salt, no fixed quantity — still appears on the [shopping list](#shopping-list) |
| `Pizza dough (recipe)` *(a base recipe)* → Enter → `10oz` → Enter | 10oz of Pizza dough, scaled from that recipe's own ingredients — see [Base Recipes](#recipe-sections--base-recipes) |
Once you have at least one ingredient line, drag it by its handle (⠿) to reorder — see [Recipe Sections](#recipe-sections--base-recipes) for grouping ingredients under headers.

Below the ingredient input, two more things live in this section:

- **"+ section" button** — groups ingredients under a header (e.g. "For the dough"). See [Recipe Sections & Base Recipes](#recipe-sections--base-recipes) in Advanced Features.
- **Frying oil** dropdown — only relevant if this recipe involves frying something. See [Frying & Oil Absorption](#frying--oil-absorption) in Advanced Features.

### Instructions & Notes

- **Instructions** — plain markdown (headings, numbered lists, anything Obsidian renders normally). Use at least one `####` heading (e.g. `#### Preparation`) to structure your steps — every `####` heading you write is displayed as a section title in the recipe view, so you can split instructions into as many stages as make sense (e.g. `#### Preparation` and `#### Cooking`).
- **Notes** *(optional)* — usually left empty here. This field is really meant to be filled in later, from the recipe's [read-only view](#viewing-a-recipe--its-nutrition) rather than this form — a place to jot things down while actually making the recipe (substitutions you made, adjustments for next time, how it turned out).

Once everything's filled in, click <img src="screenshots/icons/icon-save.png" width="18" alt="Save icon"> to save the recipe.


## Viewing a Recipe & Its Nutrition

Opening a saved recipe shows the read-only view: tags, prep/cook time, source, image, the ingredient list, instructions, history, and a nutrition table.


<p align="center">
<img src="screenshots/quickstart-fried-chicken.png" width="500" alt="The read-only recipe view">
</p>

- **Servings field**, top of the ingredients section — change this number and every quantity *and* the nutrition table recompute instantly. Click ↺ to reset to the recipe's base servings (see [Servings, explained](#servings-explained)).
- **Click any ingredient quantity** to see it converted (when possible) to another compatible unit (weight ↔ volume ↔ whole units) — useful if a recipe lists grams but you think in cups, or vice versa.
- **"Made today"** button — logs today's date to the recipe's history. Cooked something many times before you started using the plugin? Mark "already made before" instead of guessing dates, from the [edit form](#creating-a-recipe).
- **Nutrition table** — three columns: **Total** for the whole batch, **Per serving** (using your [serving unit](#servings-explained), when it isn't already a real measurement like grams), and **Per 100g**. All computed from the per-100g values on each ingredient's own sheet.
- **Notes** — click the "Notes" heading to open an editable text area (markdown supported), type your note, then click the heading again to save it. This is the place to jot things down while actually making the recipe — substitutions you made, adjustments for next time, how it turned out — without needing to switch to editing the whole recipe.

*Cooking a recipe changes its total weight in ways raw ingredient weights can't predict (water evaporates, fat renders, etc.). If a recipe [requires cooking](#creating-a-recipe) and you haven't entered a measured final weight, the "Per 100g" column is flagged unreliable — "Total" and "Per serving" stay accurate either way. Enter a real measured weight (weigh the finished dish once) for an accurate "Per 100g".*

## Shopping List

Open it from the ribbon/menu, or click the <img src="screenshots/icons/icon-shopping-list.png" width="18" alt="Shopping cart icon"> icon at the top of any recipe's ingredient list to add that recipe's ingredients (scaled to whatever [servings](#servings-explained) you set).



<p align="center">
<img src="screenshots/quickstart-shopping-list.png" width="500" alt="The shopping list view">
</p>

- Items are grouped by **shop section** (set on each ingredient's sheet — see [Creating an Ingredient](#creating-an-ingredient)).
- Adding the same ingredient from multiple recipes **combines the quantities** automatically.
- Click an item's **name** to record the quantity you already have in stock — it's subtracted from what's needed, and the line is struck through once fully covered.
- ✓ marks an item bought; ✕ removes it entirely.
- At the top, each recipe you've added is listed with its own ✕ — this removes *only* what that recipe contributed, leaving quantities from other recipes untouched.
- Type in the input at the top to add anything manually — including non-ingredient items (cleaning supplies, etc.).
- For ingredients with a known [unit weight](#creating-an-ingredient) or [juice yield](#creating-an-ingredient), quantities show an approximate item count too — e.g. `300g (≈ 2 cucumbers)` for a unit weight, or `25cl (≈ 3 lemons)` for a juice yield.

## Browsing & Filtering Recipes

Click the <img src="screenshots/icons/icon-recipe-list.png" width="18" alt="Recipe list icon"> ribbon icon to open the Recipe List — a scrollable table of every recipe in your vault, one row per recipe, showing its name, total duration, creation date, and how many times you've cooked it. Click any row to open that recipe.

Search by name, filter by ingredient (shows only recipes actually using it) or by tag (pin your most-used tags for one-click access). Click any column header to sort by it — an arrow (↑/↓) shows the current direction; click the same header again to reverse it. See [Diet Flags & Filtering](#diet-flags--filtering-by-constraint) for filtering by dietary constraint.

<p align="center">
<img src="screenshots/recipe-list.png" width="500" alt="The recipe list view">
</p>

## Browsing & Filtering Ingredients

Click the <img src="screenshots/icons/icon-ingredient-list.png" width="18" alt="Ingredient list icon"> ribbon icon to open the Ingredient List — a scrollable table of every ingredient you've defined, showing its name, type, shop section, and how many recipes use it. Click any row to open that ingredient's sheet.

<p align="center">
<img src="screenshots/ingredient-list.png" width="500" alt="The recipe list view">
</p>

Toggle to the **"Undefined"** tab to see ingredient names a recipe references but that have no sheet yet — click one to create it, pre-filled with the right name. Filter by type or shop section, and click any column header to sort by it (click again to reverse the order, shown with an ↑/↓ arrow).

---

# Advanced Features

## Commands

Every action available from the ribbon (see [The Ribbon Icons](#the-ribbon-icons)) — opening the recipe list, ingredient list, shopping list, Manage Lists, and creating a new recipe or ingredient — is also available from the command palette (`Cmd/Ctrl+P`), under the plugin's name. This is purely a matter of preference: use whichever is faster for you. Everything in this guide assumes you're using the ribbon icons.

## Ingredient Sections for recipes

**Sections** group ingredients under a header, e.g. "For the dough" / "For the filling". In the recipe form, click **"+ section"**, type a title, and drag it (⠿) to where it belongs — ingredients after it are visually indented until the next section. Leave a section's title **empty** to create a silent "reset" marker that de-indents everything after it back to the top level, without showing any visible header.

<p align="center">
<img src="screenshots/ingredient-section.png" width="500" alt="Ingredients sections">
</p>

<p align="center">
<img src="screenshots/ingredient-section-view.png" width="500" alt="Ingredients sections view">
</p>

## Base Recipes

**Base recipes** let you use one recipe as a component of another — a sauce, a dough, a base syrup. "Check "This is a base recipe" on the component recipe's form, then reference it from another recipe exactly like an ingredient — see below. Its quantity is required and must be in a unit compatible with that recipe's own [serving unit](#servings-explained). Its ingredients — and nutrition — are pulled in recursively and scaled to the amount used.

<p align="center">
<img src="screenshots/base-recipe.png" width="500" alt="base recipe">
</p>


## Frying & Oil Absorption

Fried food absorbs some of the frying oil — weight and calories the raw ingredient list alone can't capture. To model it:

1. In the recipe form, only ingredients whose [type](#creating-an-ingredient) is registered as an "oil type" (see [Settings Reference](#settings-reference)) appear in the **frying oil** picker, below the ingredient list.
2. Once an oil is picked, each ingredient line gets a **Fried / Not fried** toggle.
3. The nutrition table then shows an editable absorption percentage (default set in Settings, literature typically places it between 8–25% depending on the food's porosity) and the resulting oil weight, recalculating live as you adjust it.

![Frying section and absorption percentage in the nutrition table](screenshots/frying-section.png)

## Diet Flags & Filtering by Constraint

Mark ingredients with [diet flags](#creating-an-ingredient) (gluten, lactose, a specific allergen...). In the [Recipe List](#browsing--filtering-recipes-and-ingredients), the "Constraints" filter excludes any recipe containing at least one checked flag — anywhere in its composition, including through [base recipes](#recipe-sections--base-recipes).

Bundle several flags into a named **preset** (e.g. "Vegetarian" = no meat + no fish + no shellfish) in [Manage Lists](#manage-lists), for one-click filtering instead of re-checking flags every time.

## Manage Lists

Open via the <img src="screenshots/icons/icon-manage-lists.png" width="18" alt="Manage lists icon"> ribbon icon. Manages the shared vocabularies used across your ingredients: **types**, **shop sections**, **diet flags**, and **diet presets**.

![Manage Lists view](screenshots/manage-lists.png)

- **Rename with cascade** — click any value to rename it; every ingredient file using it is updated automatically.
- **Safe deletion** — you're warned (and asked to confirm) if a value you're deleting is still in use somewhere.
- This is also where you create new **diet presets** (see [above](#diet-flags--filtering-by-constraint)).

## AI Assistance (Claude)

*Off by default. Requires a paid Anthropic API account — a bit more involved to set up than USDA below, since it requires billing to be configured on Anthropic's side.*

**Setup:**

1. Go to [console.anthropic.com](https://console.anthropic.com/) and create an account (or sign in) — this is separate from a regular claude.ai subscription.
2. Add billing information under `Settings → Billing` — API usage is pay-as-you-go and billed separately from any Claude subscription you might have; the amounts used by this plugin's features are typically small, but you do need a card on file.
3. Go to `Settings → API Keys`, create a new key, and copy it.
4. In Obsidian, go to `Settings → [this plugin] → Enable Claude features` and turn it on.
5. Paste the key into the **Anthropic API key** field that appears, and pick a model (Haiku is the fastest and cheapest; Opus is the most capable).

**Once set up:**

- On the [ingredient form](#creating-an-ingredient), click **"Suggest with Claude"** to auto-fill type, shop section, density, forms, diet flags, and full nutrition facts from just the name.
- On the [recipe form](#creating-a-recipe), click **"Extract from text"**, paste a recipe copied from a website or book, and Claude fills in structured fields (ingredients, quantities, instructions) for you to review and adjust.

Turning the toggle back off hides both buttons entirely, and hides the API key field too.

## USDA Nutrition Lookup

*Off by default. Free — takes about three minutes to set up, no billing information required.*

**Setup:**

1. Go to [fdc.nal.usda.gov/api-key-signup](https://fdc.nal.usda.gov/api-key-signup.html) and fill in the short signup form (name and email).
2. Your API key is emailed to you immediately.
3. In Obsidian, go to `Settings → [this plugin] → Enable USDA search` and turn it on.
4. Paste the key into the **USDA API key** field that appears.

**Once set up:** on the [ingredient form](#creating-an-ingredient), a search field looks up the USDA FoodData Central database directly and lets you pull sourced nutrition data into your ingredient sheet with one click, instead of typing values by hand.

Turning the toggle back off hides the search field entirely, and hides the API key field too.

## Language & Units

`Settings → Language`: switch the entire interface — forms, buttons, view titles, messages — between **English** (the default) and several other languages, with more added over time, instantly, no reopening required.

`Settings → Unit system`: pick **US** (the default) or **Metric**. Whenever you [type a quantity](#adding-ingredients-the-full-input-flow) in the *other* system, it's automatically converted to your preferred one on save — so your recipes stay consistent no matter which system a given source used. This never affects nutrition accuracy: internally, every calculation always happens in grams, regardless of the display unit.

Your own data — ingredient type names, shop sections, diet flag names, tags — is **not** translated. It's your personal vocabulary, typed by you, and stays exactly as written regardless of interface language.

## Data Format

Every recipe and ingredient is a plain markdown note with YAML frontmatter — readable, diffable, and usable outside the plugin if you ever need to. Nothing lives in a hidden database; your vault is the only source of truth.

---

# Reference

## Settings Reference

| Setting | Description |
|---|---|
| Language | See [Language & Units](#language--units) |
| Unit system | See [Language & Units](#language--units) |
| Ingredients folder | Folder where ingredient notes are stored |
| Recipes folder | Folder where recipe notes are stored |
| Recipe templates folder | Folder containing recipe templates for "Create new recipe from template" |
| Recipe images folder | Folder where recipe images are stored |
| Special categories — oil types | Which [ingredient types](#creating-an-ingredient) count as "oil" — see [Frying](#frying--oil-absorption) |
| Special categories — fruit types | Which ingredient types count as "fruit" — enables juice yield, see [Creating an Ingredient](#creating-an-ingredient) |
| Default oil absorption % | Starting percentage for [frying](#frying--oil-absorption), adjustable per recipe |
| Enable USDA search | See [USDA Nutrition Lookup](#usda-nutrition-lookup) |
| USDA API key | See [USDA Nutrition Lookup](#usda-nutrition-lookup) |
| Enable Claude features | See [AI Assistance](#ai-assistance-claude) |
| Anthropic API key | See [AI Assistance](#ai-assistance-claude) |
| Anthropic model | Model used for Claude features (Haiku / Sonnet / Opus) |
| Shopping list note path | Path to the single note used as your [shopping list](#shopping-list) |
| Other items note path | Note listing non-ingredient shopping items, for autocomplete |

*Ingredient types, shop sections, and diet flags themselves are managed in [Manage Lists](#manage-lists), not in Settings.*

## FAQ & Tips

<details>
<summary>Why don't my "Per 100g" nutrition values look right for a cooked recipe?</summary>

See [Viewing a Recipe & Its Nutrition](#viewing-a-recipe--its-nutrition) — enter a manually measured final weight for an accurate "Per 100g" column.

</details>

<details>
<summary>Why don't I see a frying option on my recipe?</summary>

The oil picker only lists ingredients whose type is marked as an "oil type" in Settings — see [Frying & Oil Absorption](#frying--oil-absorption).

</details>

<details>
<summary>Can I use the plugin without an Anthropic or USDA API key?</summary>

Yes. Both are optional — turn them off in Settings to hide the related UI entirely and enter everything manually. See [AI Assistance](#ai-assistance-claude) and [USDA Nutrition Lookup](#usda-nutrition-lookup).

</details>

<details>
<summary>How do I mark an ingredient with no fixed amount, like "salt to taste"?</summary>

Type the name, press Enter, then press Enter again on an empty field — see the [worked examples](#adding-ingredients-the-full-input-flow).

</details>

## Installation

<details>
<summary>From Community Plugins (once available)</summary>

1. `Settings → Community plugins → Browse`
2. Search for "Recipe & Shopping List"
3. Install and enable

</details>

<details>
<summary>Manual installation</summary>

1. Download the latest release (`main.js`, `manifest.json`, `styles.css`)
2. Create a folder `VaultFolder/.obsidian/plugins/recipe-plugin/`
3. Copy the three files into it
4. Reload Obsidian and enable the plugin in `Settings → Community plugins`

</details>

## Contributing

Issues and pull requests are welcome. Please describe the behavior you're seeing (or proposing) clearly, and include a sample recipe/ingredient note if relevant.

## License

MIT
