import { NutritionPer100g } from '../models/Ingredient';
import {upperFirstLetter} from '../models/textNormalize'

interface IngredientDetailsProps {
	name: string;
	type: string;
	shopSection: string;
	densityGMl?: number;
	entityWeightG?: number;
	possibleForms?: string[];
	nutrition: NutritionPer100g;
	brand?: string;
	usedInRecipes: string[];
	onRecipeClick: (recipeName: string) => void;
}

function fmt(value: number): string {
	return value.toFixed(1);
}

export function IngredientDetails({
									  name,
									  type,
									  shopSection,
									  densityGMl,
									  entityWeightG,
									  brand,
									  possibleForms,
									  nutrition,
									  usedInRecipes,
									  onRecipeClick,
								  }: IngredientDetailsProps) {
	return (
		<div>

			<h4> Caractéristiques </h4>
			<ul>
				<li>Type : {type}</li>
				<li>Rayon : {shopSection}</li>
				{brand &&
					<li>Marque : {brand}</li>
				}
				{densityGMl != null &&
					<li> Densité : {densityGMl} g/mL</li>
				}
				{entityWeightG != null &&
					<li>Poids unitaire : {entityWeightG} g</li>
				}
				{possibleForms != null && possibleForms.length > 0 &&
					<li>Formes possibles : {possibleForms.join(', ')} </li>
				}
			</ul>

			<h4>Valeurs nutritionnelles (pour 100g)</h4>
			<table>
				<tbody>
				<tr><td>Calories</td><td>{fmt(nutrition.kcal)} kcal</td></tr>
				<tr><td>Lipides</td><td>{fmt(nutrition.lipids)} g</td></tr>
				<tr><td style={{ paddingLeft: '1.5em' }}>dont acides gras insaturés</td><td>{fmt(nutrition.non_saturated_lipids)} g</td></tr>
				<tr><td>Glucides</td><td>{fmt(nutrition.glucids)} g</td></tr>
				<tr><td style={{ paddingLeft: '1.5em' }}>dont sucres</td><td>{fmt(nutrition.sugar)} g</td></tr>
				<tr><td>Protéines</td><td>{fmt(nutrition.proteins)} g</td></tr>
				<tr><td>Sel</td><td>{fmt(nutrition.salt)} g</td></tr>
				<tr><td>Fibres</td><td>{fmt(nutrition.fibers)} g</td></tr>
				<tr><td>Cholestérol</td><td>{fmt(nutrition.cholesterol)} mg</td></tr>
				</tbody>
			</table>

			{usedInRecipes.length > 0 && (
				<p>
					Utilisé dans :{' '}
					{usedInRecipes.map((recipeName, index) => (
						<span key={recipeName}>
							<a href="#" onClick={(e) => { e.preventDefault(); onRecipeClick(recipeName); }}>
								{recipeName}
							</a>
							{index < usedInRecipes.length - 1 ? ', ' : ''}
						</span>
					))}
				</p>
			)}
		</div>
	);
}
