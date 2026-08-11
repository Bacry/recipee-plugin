import { IngredientSummary, UndefinedIngredientUsage } from '../models/listAllIngredients';

type SortKey = 'name' | 'type' | 'shopSection' | 'usedInRecipesCount';

interface IngredientListDisplayProps {
	mode: 'defined' | 'undefined';
	showUndefined: boolean;
	onToggleShowUndefined: (value: boolean) => void;
	searchQuery: string;
	onSearchQueryChange: (value: string) => void;
	undefinedIngredients: UndefinedIngredientUsage[];
	onUndefinedClick: (name: string) => void;
	onUndefinedRecipeClick: (recipeName: string) => void;
	ingredients: IngredientSummary[];
	allTypes: string[];
	selectedTypes: Set<string>;
	onToggleType: (type: string) => void;
	typeMenuOpen: boolean;
	onToggleTypeMenu: () => void;
	allDietFlags: string[];
	excludedDietFlags: Set<string>;
	onToggleDietFlag: (flag: string) => void;
	dietMenuOpen: boolean;
	onToggleDietMenu: () => void;
	onIngredientClick: (filePath: string) => void;
	sortKey: SortKey;
	sortDirection: 'asc' | 'desc';
	onToggleSort: (key: SortKey) => void;
}

export function IngredientListDisplay({
										  mode,
										  showUndefined,
										  onToggleShowUndefined,
										  searchQuery,
										  onSearchQueryChange,
										  undefinedIngredients,
										  onUndefinedClick,
										  onUndefinedRecipeClick,
										  ingredients,
										  allTypes,
										  selectedTypes,
										  onToggleType,
										  typeMenuOpen,
										  onToggleTypeMenu,
										  allDietFlags,
										  excludedDietFlags,
										  onToggleDietFlag,
										  dietMenuOpen,
										  onToggleDietMenu,
										  onIngredientClick,
										  sortKey,
										  sortDirection,
										  onToggleSort,
									  }: IngredientListDisplayProps) {
	function sortArrow(key: SortKey) {
		if (sortKey !== key) return '';
		return sortDirection === 'asc' ? ' ↑' : ' ↓';
	}

	return (
		<div>
			<div className="recipe-list-sticky-header">
				<div className="recipe-list-filter-buttons-row">
					<button
						type="button"
						onClick={() => onToggleShowUndefined(false)}
						className={!showUndefined ? 'recipe-list-pinned-tag recipe-list-pinned-tag-active' : 'recipe-list-pinned-tag'}
					>
						Définis
					</button>
					<button
						type="button"
						onClick={() => onToggleShowUndefined(true)}
						className={showUndefined ? 'recipe-list-pinned-tag recipe-list-pinned-tag-active' : 'recipe-list-pinned-tag'}
					>
						Non définis
					</button>
				</div>

				<div className="recipe-list-search-row">
					<input
						type="text"
						placeholder="Rechercher un ingrédient..."
						value={searchQuery}
						onChange={(e) => onSearchQueryChange(e.target.value)}
						className="recipe-list-search"
					/>
				</div>

				{mode === 'defined' && (
					<div className="recipe-list-filter-buttons-row">
						<div className="recipe-list-tag-menu-wrapper">
							<button type="button" onClick={onToggleTypeMenu} className="recipe-list-tag-menu-button">
								Type {selectedTypes.size > 0 ? `(${selectedTypes.size})` : ''}
							</button>
							{typeMenuOpen && (
								<ul className="recipe-list-tag-menu">
									{allTypes.map((type) => (
										<li key={type} onClick={() => onToggleType(type)} className="recipe-list-tag-menu-item">
											<input type="checkbox" checked={selectedTypes.has(type)} readOnly />
											{type}
										</li>
									))}
								</ul>
							)}
						</div>

						<div className="recipe-list-tag-menu-wrapper recipe-list-tags-wrapper">
							<button type="button" onClick={onToggleDietMenu} className="recipe-list-tag-menu-button">
								Contraintes {excludedDietFlags.size > 0 ? `(${excludedDietFlags.size})` : ''}
							</button>
							{dietMenuOpen && (
								<ul className="recipe-list-tag-menu">
									{allDietFlags.map((flag) => (
										<li key={flag} onClick={() => onToggleDietFlag(flag)} className="recipe-list-tag-menu-item">
											<input type="checkbox" checked={excludedDietFlags.has(flag)} readOnly />
											sans {flag}
										</li>
									))}
								</ul>
							)}
						</div>
					</div>
				)}

				{mode === 'defined' && (
					<div className="recipe-list-row recipe-list-header-row">
						<div className="recipe-list-cell-name recipe-list-sortable" onClick={() => onToggleSort('name')}>
							Nom{sortArrow('name')}
						</div>
						<div className="recipe-list-cell-duration recipe-list-sortable" onClick={() => onToggleSort('type')}>
							Type{sortArrow('type')}
						</div>
						<div className="recipe-list-cell-duration recipe-list-sortable" onClick={() => onToggleSort('shopSection')}>
							Rayon{sortArrow('shopSection')}
						</div>
						<div className="recipe-list-cell-cooked recipe-list-sortable" onClick={() => onToggleSort('usedInRecipesCount')}>
							#Recettes{sortArrow('usedInRecipesCount')}
						</div>
					</div>
				)}

				{mode === 'undefined' && (
					<div className="recipe-list-row recipe-list-header-row">
						<div className="recipe-list-cell-name">Nom</div>
						<div className="recipe-list-cell-recipes">Utilisé dans</div>
					</div>
				)}
			</div>

			{mode === 'undefined' ? (
				<div>
					{undefinedIngredients.length === 0 && (
						<p className="recipe-empty-entries">Aucun ingrédient non défini 🎉</p>
					)}
					{undefinedIngredients.map((entry) => (
						<div key={entry.name} className="recipe-list-row recipe-list-row-undefined">
							<div className="recipe-list-cell-name" onClick={() => onUndefinedClick(entry.name)}>
								{entry.name}
							</div>
							<div className="recipe-list-cell-recipes">
								{entry.usedInRecipes.map((recipeName, index) => (
									<span key={recipeName}>
<a
											href="#"
											onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUndefinedRecipeClick(recipeName); }}
										>
										{recipeName}
										</a>
								{index < entry.usedInRecipes.length - 1 ? ', ' : ''}
									</span>
									))}
							</div>
						</div>
					))}
				</div>
			) : (
				<div>
					{ingredients.length === 0 && (
						<p className="recipe-empty-entries">Aucun ingrédient trouvé</p>
					)}
					{ingredients.map((ing) => (
						<div key={ing.filePath} className="recipe-list-row" onClick={() => onIngredientClick(ing.filePath)}>
							<div className="recipe-list-cell-name">{ing.name}</div>
							<div className="recipe-list-cell-duration">{ing.type}</div>
							<div className="recipe-list-cell-duration">{ing.shopSection}</div>
							<div className="recipe-list-cell-cooked">{ing.usedInRecipesCount}</div>
						</div>
					))}
				</div>
			)}
</div>
);
}
