import { NutritionPer100g } from '../models/Ingredient';
import {upperFirstLetter} from '../models/textNormalize'
import { isOilIngredient } from '../models/listOilIngredients';

interface IngredientDetailsProps {
	name: string;
	type: string;
	shopSection: string;
	densityGMl?: number;
	entityWeightG?: number;
	possibleForms?: string[];
	dietFlags?: string[];
	oilIngredientTypes: string[];
	juiceYieldMl?: number;
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
									  dietFlags,
									  oilIngredientTypes,
									  juiceYieldMl,
									  nutrition,
									  usedInRecipes,
									  onRecipeClick,
								  }: IngredientDetailsProps) {
	return (
		<div>
			<div className="section">


			<div className="section-title"> Caractéristiques </div>
			<div className="section-content">
				<div className="section-content-item"> Type : {type} </div>
				<div className="section-content-item"> Rayon : {shopSection} </div>
				{brand &&
					<div className="section-content-item"> Marque : {brand} </div>
				}
				{densityGMl != null &&
					<div className="section-content-item"> Densité : {densityGMl} g/mL </div>
				}
				{entityWeightG != null &&
					<div className="section-content-item"> Poids unitaire : {entityWeightG} g </div>
				}
				{juiceYieldMl != null &&
					<div className="section-content-item"> Rendement en jus : {juiceYieldMl} mL / fruit</div>
				}
				{possibleForms != null && possibleForms.length > 0 &&
					<div className="section-content-item"> Formes possibles : {possibleForms.join(', ')} </div>
				}
				{dietFlags != null && dietFlags.length > 0 &&
					<div className="section-content-item"> Contraintes alimentaires : {dietFlags.join(', ')} </div>
				}
				{isOilIngredient(type, oilIngredientTypes) &&
					<div className="section-content-item"> Peut être utilisé pour la friture </div>
				}
			</div>
			<div className="section-title"> Valeurs nutritionnelles (pour 100g)</div>
			<div className="section-content">
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
			</div>
			</div>

			<div className="section">
			<div className="section-title"> Ingrédient utilisé dans </div>
			<div className="section-content">
				{usedInRecipes.length > 0 && (
					<span>
					{usedInRecipes.map((recipeName, index) => (
							<span key={recipeName}>
							<a href="#" onClick={(e) => { e.preventDefault(); onRecipeClick(recipeName); }}>
								{recipeName}
							</a>
								{index < usedInRecipes.length - 1 ? ', ' : ''}
						</span>
						))}
					</span>
				)}
			</div>
		</div>
		</div>
	);
}
