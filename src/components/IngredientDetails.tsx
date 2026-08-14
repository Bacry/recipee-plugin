import { NutritionPer100g } from '../models/Ingredient';
import {upperFirstLetter} from '../models/textNormalize'
import { isOilIngredient } from '../models/listOilIngredients';
import { useT } from '../i18n/LanguageContext';

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
	const t = useT();

	return (
		<div>
			<div className="section">


				<div className="section-title"> {t('ingredientDetails.characteristics')} </div>
				<div className="section-content">
					<div className="section-content-item"> {t('ingredientDetails.type').replace('{value}', type)} </div>
					<div className="section-content-item"> {t('ingredientDetails.shopSection').replace('{value}', shopSection)} </div>
					{brand &&
						<div className="section-content-item"> {t('ingredientDetails.brand').replace('{value}', brand)} </div>
					}
					{densityGMl != null &&
						<div className="section-content-item"> {t('ingredientDetails.density').replace('{value}', densityGMl.toString())} </div>
					}
					{entityWeightG != null &&
						<div className="section-content-item"> {t('ingredientDetails.entityWeight').replace('{value}', entityWeightG.toString())} </div>
					}
					{juiceYieldMl != null &&
						<div className="section-content-item"> {t('ingredientDetails.juiceYield').replace('{value}', juiceYieldMl.toString())} </div>
					}
					{possibleForms != null && possibleForms.length > 0 &&
						<div className="section-content-item"> {t('ingredientDetails.possibleForms').replace('{value}', possibleForms.join(', '))} </div>
					}
					{dietFlags != null && dietFlags.length > 0 &&
						<div className="section-content-item"> {t('ingredientDetails.dietFlags').replace('{value}', dietFlags.join(', '))} </div>
					}
					{isOilIngredient(type, oilIngredientTypes) &&
						<div className="section-content-item"> {t('ingredientDetails.canBeUsedForFrying')} </div>
					}
				</div>
				<div className="section-title"> {t('ingredientDetails.nutrition')}</div>
				<div className="section-content">
					<table>
						<tbody>
						<tr><td>{t('ingredientDetails.nutrition.kcal')}</td><td>{fmt(nutrition.kcal)} kcal</td></tr>
						<tr><td>{t('ingredientDetails.nutrition.lipids')}</td><td>{fmt(nutrition.lipids)} g</td></tr>
						<tr><td style={{ paddingLeft: '1.5em' }}>{t('ingredientDetails.nutrition.nonSaturatedLipids')}</td><td>{fmt(nutrition.non_saturated_lipids)} g</td></tr>
						<tr><td>{t('ingredientDetails.nutrition.glucids')}</td><td>{fmt(nutrition.glucids)} g</td></tr>
						<tr><td style={{ paddingLeft: '1.5em' }}>{t('ingredientDetails.nutrition.sugar')}</td><td>{fmt(nutrition.sugar)} g</td></tr>
						<tr><td>{t('ingredientDetails.nutrition.proteins')}</td><td>{fmt(nutrition.proteins)} g</td></tr>
						<tr><td>{t('ingredientDetails.nutrition.salt')}</td><td>{fmt(nutrition.salt)} g</td></tr>
						<tr><td>{t('ingredientDetails.nutrition.fibers')}</td><td>{fmt(nutrition.fibers)} g</td></tr>
						<tr><td>{t('ingredientDetails.nutrition.cholesterol')}</td><td>{fmt(nutrition.cholesterol)} mg</td></tr>
						</tbody>
					</table>
				</div>
			</div>

			<div className="section">
				<div className="section-title"> {t('ingredientDetails.usedIn')} </div>
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
