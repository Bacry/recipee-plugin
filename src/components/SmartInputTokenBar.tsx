
interface SuggestionItem {
	key: string;
	label: string;
	onClick: () => void;
}

interface SmartInputTokenBarProps {
	tokens: string[]; // already-committed pieces, shown as plain text before the live input
	currentInput: string;
	onCurrentInputChange: (value: string) => void;
	onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	placeholder: string;
	error?: string | null;
	suggestions: SuggestionItem[];
	highlightedIndex: number;
	onSuggestionHover: (index: number) => void;
	showSuggestions: boolean;
}

// Shared rendering for the "one input, linear tokens" pattern used by both
// SmartRecipeIngredientInput and SmartShoppingInput — each step's own logic
// (what counts as a valid token, what happens on Enter/Backspace) stays in
// the parent, this component only ever renders what's already decided.
export function SmartInputTokenBar({
									   tokens,
									   currentInput,
									   onCurrentInputChange,
									   onKeyDown,
									   placeholder,
									   error,
									   suggestions,
									   highlightedIndex,
									   onSuggestionHover,
									   showSuggestions,
								   }: SmartInputTokenBarProps) {
	const prefix = tokens.filter(Boolean).join(', ') + (tokens.some(Boolean) ? ', ' : '');

	return (
		<div className="smart-shopping-input-wrapper">
			<div className="smart-shopping-input">
				<input
					value={prefix + currentInput}
					readOnly={false}
					onChange={(e) => {
						// The prefix is fixed/non-editable — only accept edits to the
						// part after it. If the user somehow deletes into the prefix
						// (e.g. select-all + type), just ignore that keystroke.
						const newValue = e.target.value;
						if (!newValue.startsWith(prefix)) return;
						onCurrentInputChange(newValue.slice(prefix.length));
					}}
					onKeyDown={onKeyDown}
					enterKeyHint="done"
					placeholder={prefix === '' ? placeholder : undefined}
				/>
			</div>

			{error && <p className="ingredient-validation-error">{error}</p>}

			{showSuggestions && suggestions.length > 0 && (
				<ul className="smart-shopping-suggestions">
					{suggestions.map((suggestion, index) => (
						<li
							key={suggestion.key}
							className={index === highlightedIndex ? 'smart-shopping-suggestion-highlighted' : ''}
							onMouseEnter={() => onSuggestionHover(index)}
							onMouseDown={(e) => e.preventDefault()}
							onClick={suggestion.onClick}
						>
							{suggestion.label}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
