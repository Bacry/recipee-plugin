import { IngredientSummary, UndefinedIngredientUsage, NeedsReviewIngredientSummary } from '../models/listAllIngredients';
import { useT } from '../i18n/LanguageContext';

type SortKey = 'name' | 'type' | 'shopSection' | 'usedInRecipesCount';
type ListMode = 'defined' | 'undefined' | 'needsReview';

interface IngredientListDisplayProps {
	mode: ListMode;
	onModeChange: (mode: ListMode) => void;
	definedCount: number;
	undefinedCount: number;
	needsReviewCount: number;
	searchQuery: string;
	onSearchQueryChange: (value: string) => void;
	undefinedIngredients: UndefinedIngredientUsage[];
	selectedUndefinedNames: Set<string>;
	onToggleUndefinedSelected: (name: string) => void;
	onToggleSelectAllUndefined: () => void;
	onGenerateWithAI: () => void;
	isGenerating: boolean;
	onUndefinedClick: (name: string) => void;
	onUndefinedRecipeClick: (recipeName: string) => void;
	ingredients: IngredientSummary[];
	needsReviewIngredients: NeedsReviewIngredientSummary[];
	onNeedsReviewClick: (filePath: string) => void;
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
										  onModeChange,
										  definedCount,
										  undefinedCount,
										  needsReviewCount,
										  searchQuery,
										  onSearchQueryChange,
										  undefinedIngredients,
										  selectedUndefinedNames,
										  onToggleUndefinedSelected,
										  onToggleSelectAllUndefined,
										  onGenerateWithAI,
										  isGenerating,
										  onUndefinedClick,
										  onUndefinedRecipeClick,
										  ingredients,
										  needsReviewIngredients,
										  onNeedsReviewClick,
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
	const t = useT();
	function sortArrow(key: SortKey) {
		if (sortKey !== key) return '';
		return sortDirection === 'asc' ? ' ↑' : ' ↓';
	}

	const allUndefinedSelected = undefinedIngredients.length > 0 && undefinedIngredients.every((e) => selectedUndefinedNames.has(e.name));

	return (
		<div>
			<div className="recipe-list-sticky-header">
				<div className="recipe-list-filter-buttons-row">
					<button
						type="button"
						onClick={() => onModeChange('defined')}
						disabled={definedCount === 0}
						className={mode === 'defined' ? 'recipe-list-pinned-tag recipe-list-pinned-tag-active' : 'recipe-list-pinned-tag'}
					>
						{t('ingredientListDisplay.defined')} ({definedCount})
					</button>
					<button
						type="button"
						onClick={() => onModeChange('undefined')}
						disabled={undefinedCount === 0}
						className={mode === 'undefined' ? 'recipe-list-pinned-tag recipe-list-pinned-tag-active' : 'recipe-list-pinned-tag'}
					>
						{t('ingredientListDisplay.undefined')} ({undefinedCount})
					</button>
					<button
						type="button"
						onClick={() => onModeChange('needsReview')}
						disabled={needsReviewCount === 0}
						className={mode === 'needsReview' ? 'recipe-list-pinned-tag recipe-list-pinned-tag-active' : 'recipe-list-pinned-tag'}
					>
						{t('ingredientListDisplay.needsReview')} ({needsReviewCount})
					</button>
				</div>

				{mode !== 'needsReview' && (
					<div className="recipe-list-search-row">
						<input
							type="text"
							placeholder={t('ingredientListDisplay.search.placeholder')}
							value={searchQuery}
							onChange={(e) => onSearchQueryChange(e.target.value)}
							className="recipe-list-search"
						/>
					</div>
				)}

				{mode === 'undefined' && undefinedIngredients.length > 0 && (
					<div className="recipe-list-filter-buttons-row">
						<button type="button" onClick={onToggleSelectAllUndefined} className="standard-button">
							{allUndefinedSelected ? t('ingredientListDisplay.deselectAll') : t('ingredientListDisplay.selectAll')}
						</button>
						<button
							type="button"
							onClick={onGenerateWithAI}
							disabled={selectedUndefinedNames.size === 0 || isGenerating}
							className="ingredient-form-submit"
						>
							{isGenerating ? t('ingredientListDisplay.generating') : t('ingredientListDisplay.generateWithAI').replace('{count}', selectedUndefinedNames.size.toString())}
						</button>
					</div>
				)}

				{mode === 'defined' && (
					<div className="recipe-list-filter-buttons-row">
						<div className="recipe-list-tag-menu-wrapper">
							<button type="button" onClick={onToggleTypeMenu} className="recipe-list-tag-menu-button">
								{t('ingredientListDisplay.type')} {selectedTypes.size > 0 ? `(${selectedTypes.size})` : ''}
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
								{t('ingredientListDisplay.constraints')} {excludedDietFlags.size > 0 ? `(${excludedDietFlags.size})` : ''}
							</button>
							{dietMenuOpen && (
								<ul className="recipe-list-tag-menu">
									{allDietFlags.map((flag) => (
										<li key={flag} onClick={() => onToggleDietFlag(flag)} className="recipe-list-tag-menu-item">
											<input type="checkbox" checked={excludedDietFlags.has(flag)} readOnly />
											{t('ingredientListDisplay.constraints.without').replace('{flag}', flag)}
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
							{t('ingredientListDisplay.column.name')}{sortArrow('name')}
						</div>
						<div className="recipe-list-cell-type recipe-list-sortable" onClick={() => onToggleSort('type')}>
							{t('ingredientListDisplay.type')}{sortArrow('type')}
						</div>
						<div className="recipe-list-cell-shopsection recipe-list-sortable" onClick={() => onToggleSort('shopSection')}>
							{t('ingredientListDisplay.column.shopSection')}{sortArrow('shopSection')}
						</div>
						<div className="recipe-list-cell-cooked recipe-list-sortable" onClick={() => onToggleSort('usedInRecipesCount')}>
							# {sortArrow('usedInRecipesCount')}
						</div>
					</div>
				)}

				{mode === 'undefined' && (
					<div className="recipe-list-row recipe-list-header-row">
						<div className="recipe-list-cell-name">{t('ingredientListDisplay.column.name')}</div>
						<div className="recipe-list-cell-recipes">{t('ingredientListDisplay.column.usedIn')}</div>
					</div>
				)}
			</div>

			{mode === 'undefined' && (
				<div>
					{undefinedIngredients.length === 0 && (
						<p className="recipe-empty-entries">{t('ingredientListDisplay.noUndefined')}</p>
					)}
					{undefinedIngredients.map((entry) => (
						<div key={entry.name} className="recipe-list-row recipe-list-row-undefined">
							<input
								type="checkbox"
								checked={selectedUndefinedNames.has(entry.name)}
								onClick={(e) => e.stopPropagation()}
								onChange={() => onToggleUndefinedSelected(entry.name)}
							/>
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
			)}

{mode === 'needsReview' && (
	<div>
		{needsReviewIngredients.length === 0 && (
			<p className="recipe-empty-entries">{t('ingredientListDisplay.noNeedsReview')}</p>
		)}
		{needsReviewIngredients.map((entry) => (
			<div key={entry.filePath} className="recipe-list-row" onClick={() => onNeedsReviewClick(entry.filePath)}>
				<div className="recipe-list-cell-name">{entry.name}</div>
			</div>
		))}
	</div>
)}

{mode === 'defined' && (
	<div>
		{ingredients.length === 0 && (
			<p className="recipe-empty-entries">{t('ingredientListDisplay.noResults')}</p>
		)}
		{ingredients.map((ing) => (
			<div key={ing.filePath} className="recipe-list-row" onClick={() => onIngredientClick(ing.filePath)}>
				<div className="recipe-list-cell-name">{ing.name}</div>
				<div className="recipe-list-cell-type">{ing.type}</div>
				<div className="recipe-list-cell-shopsection">{ing.shopSection}</div>
				<div className="recipe-list-cell-cooked">{ing.usedInRecipesCount}</div>
			</div>
		))}
	</div>
)}
</div>
);
}
