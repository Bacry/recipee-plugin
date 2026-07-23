import { Recipe } from './recipe';
import { RecipeFormValues } from '../components/RecipeForm';
import { recipeToFormValues } from './recipeFormConversion';

// Converts a template recipe into form values to prefill a brand new recipe.
// name/source/image are cleared (never meaningful coming from a template).
// defaultSubfolder comes from the template's own "default_subfolder" field
// (read separately in main.tsx — not part of the Recipe model itself, since
// it's a template-only concept, not something real recipes ever store).
export function templateToFormValues(template: Recipe, defaultSubfolder?: string): RecipeFormValues {
	// recipeToFormValues needs a filePath/recipesFolder to derive subfolder from
	// path — irrelevant here, so pass placeholders that yield an empty subfolder,
	// then override it explicitly right after.
	const values = recipeToFormValues(template, '', '');
	return {
		...values,
		name: '',
		source: '',
		image: '',
		subfolder: defaultSubfolder ?? '',
	};
}
