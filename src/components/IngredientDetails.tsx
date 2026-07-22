import { NutritionPer100g } from '../models/Ingredient';

interface IngredientDetailsProps {
	name: string;
	type: string;
	shopSection: string;
	densityGMl?: number;
	entityWeightG?: number;
	possibleForms?: string[];
	nutrition: NutritionPer100g;
	brand?: string;
	onEdit?: () => void; // undefined = read-only, no "Modifier" button rendered
	onClose: () => void;
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
									  onEdit,
									  onClose,
								  }: IngredientDetailsProps) {
	return (
		<div>
			<div className="ingredient-details-header">
				<h2>{name}</h2>
				<div className="ingredient-details-header-actions">
					{onEdit && <button onClick={onEdit}>Modifier</button>}
					<button onClick={onClose} title="Fermer">✕</button>
				</div>
			</div>
			<p>Type : {type}</p>
			<p>Rayon : {shopSection}</p>
			{brand && <p>Marque : {brand}</p>}
			{densityGMl != null && <p>Densité : {densityGMl} g/mL</p>}
			{entityWeightG != null && <p>Poids unitaire : {entityWeightG} g</p>}
			{possibleForms != null && possibleForms.length > 0 && (
				<p>Formes possibles : {possibleForms.join(', ')}</p>
			)}

			<h3>Valeurs nutritionnelles (pour 100g)</h3>
			<table>
				<tbody>
				<tr><td>Calories</td><td>{nutrition.kcal} kcal</td></tr>
				<tr><td>Lipides</td><td>{nutrition.lipids} g</td></tr>
				<tr><td style={{ paddingLeft: '1.5em' }}>dont acides gras insaturés</td><td>{nutrition.non_saturated_lipids} g</td></tr>
				<tr><td>Glucides</td><td>{nutrition.glucids} g</td></tr>
				<tr><td style={{ paddingLeft: '1.5em' }}>dont sucres</td><td>{nutrition.sugar} g</td></tr>
				<tr><td>Protéines</td><td>{nutrition.proteins} g</td></tr>
				<tr><td>Sel</td><td>{nutrition.salt} g</td></tr>
				<tr><td>Fibres</td><td>{nutrition.fibers} g</td></tr>
				<tr><td>Cholestérol</td><td>{nutrition.cholesterol} mg</td></tr>
				</tbody>
			</table>
		</div>
	);
}
