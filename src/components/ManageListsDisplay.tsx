import { useState } from 'react';
import { ListField } from '../models/renameListValue';
import { DietPreset } from '../settings';
import { useT } from '../i18n/LanguageContext';

interface ManageListsDisplayProps {
	types: string[];
	shopSections: string[];
	dietFlags: string[];
	dietPresets: DietPreset[];
	onAdd: (field: ListField, value: string) => void;
	onRename: (field: ListField, oldValue: string, newValue: string) => void;
	onRemove: (field: ListField, value: string) => void;
	onAddPreset: (name: string, flags: string[]) => void;
	onRemovePreset: (name: string) => void;
}

function DietPresetsEditor({
							   dietFlags,
							   presets,
							   onAddPreset,
							   onRemovePreset,
						   }: {
	dietFlags: string[];
	presets: DietPreset[];
	onAddPreset: (name: string, flags: string[]) => void;
	onRemovePreset: (name: string) => void;
}) {
	const t = useT();
	const [newName, setNewName] = useState('');
	const [selectedFlags, setSelectedFlags] = useState<Set<string>>(new Set());

	function toggleFlag(flag: string) {
		setSelectedFlags((prev) => {
			const next = new Set(prev);
			if (next.has(flag)) next.delete(flag);
			else next.add(flag);
			return next;
		});
	}

	function handleAdd() {
		if (newName.trim() === '' || selectedFlags.size === 0) return;
		onAddPreset(newName.trim(), Array.from(selectedFlags));
		setNewName('');
		setSelectedFlags(new Set());
	}

	return (
		<div>
			<ul className="manage-lists-values">
				{presets.map((preset) => (
					<li key={preset.name}>
						<span>{preset.name} — {preset.flags.join(', ')}</span>
						<button type="button" onClick={() => onRemovePreset(preset.name)} title={t('manageListsDisplay.remove.title')} className="recipe-ingredient-remove">✕</button>
					</li>
				))}
			</ul>

			<div className="form-field">
				<label>{t('manageListsDisplay.preset.nameLabel')}</label>
				<input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('manageListsDisplay.preset.namePlaceholderExample')} />
			</div>

			<div className="form-field">
				<label>{t('manageListsDisplay.preset.constraintsLabel')}</label>
				<div className="manage-lists-preset-checkboxes">
					{dietFlags.map((flag) => (
						<label key={flag} className="manage-lists-preset-checkbox">
							<input
								type="checkbox"
								checked={selectedFlags.has(flag)}
								onChange={() => toggleFlag(flag)}
							/>
							{flag}
						</label>
					))}
				</div>
			</div>

			<button type="button" onClick={handleAdd} className="ingredient-form-submit">{t('manageListsDisplay.preset.create')}</button>
		</div>
	);
}

function ListSectionEditor({
							   field,
							   values,
							   onAdd,
							   onRename,
							   onRemove,
						   }: {
	field: ListField;
	values: string[];
	onAdd: (field: ListField, value: string) => void;
	onRename: (field: ListField, oldValue: string, newValue: string) => void;
	onRemove: (field: ListField, value: string) => void;
}) {
	const t = useT();
	const [newValue, setNewValue] = useState('');
	const [editingValue, setEditingValue] = useState<string | null>(null);
	const [editingDraft, setEditingDraft] = useState('');

	function startEditing(value: string) {
		setEditingValue(value);
		setEditingDraft(value);
	}

	function commitEditing() {
		if (editingValue !== null) {
			onRename(field, editingValue, editingDraft);
		}
		setEditingValue(null);
		setEditingDraft('');
	}

	function handleAdd() {
		onAdd(field, newValue);
		setNewValue('');
	}

	return (
		<div>
			<ul className="manage-lists-values">
				{[...values].sort((a, b) => a.localeCompare(b)).map((value) => (
					<li key={value}>
						{editingValue === value ? (
							<input
								autoFocus
								value={editingDraft}
								onChange={(e) => setEditingDraft(e.target.value)}
								onBlur={commitEditing}
								onKeyDown={(e) => {
									if (e.key === 'Enter') commitEditing();
									if (e.key === 'Escape') { setEditingValue(null); setEditingDraft(''); }
								}}
							/>
						) : (
							<span onClick={() => startEditing(value)} className="manage-lists-value-name">
								{value}
							</span>
						)}
						<button type="button" onClick={() => onRemove(field, value)} title={t('manageListsDisplay.remove.title')} className="recipe-ingredient-remove">✕</button>
					</li>
				))}
			</ul>

			<div className="form-field usda-search-row">
				<input
					value={newValue}
					onChange={(e) => setNewValue(e.target.value)}
					onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
					placeholder={t('manageListsDisplay.value.addPlaceholder')}
				/>
			</div>
		</div>
	);
}

export function ManageListsDisplay({ types, shopSections, dietFlags, dietPresets, onAdd, onRename, onRemove,
									   onAddPreset,
									   onRemovePreset, }: ManageListsDisplayProps) {
	const t = useT();
	const [selectedField, setSelectedField] = useState<ListField | 'diet_preset' | null>(null);
	const [menuOpen, setMenuOpen] = useState(false);

	const LIST_INFO: Record<ListField | 'diet_preset', { label: string; description: string }> = {
		type: {
			label: t('manageListsDisplay.field.type.label'),
			description: t('manageListsDisplay.field.type.description'),
		},
		shop_section: {
			label: t('manageListsDisplay.field.shopSection.label'),
			description: t('manageListsDisplay.field.shopSection.description'),
		},
		diet_flag: {
			label: t('manageListsDisplay.field.dietFlag.label'),
			description: t('manageListsDisplay.field.dietFlag.description'),
		},
		diet_preset: {
			label: t('manageListsDisplay.field.dietPreset.label'),
			description: t('manageListsDisplay.field.dietPreset.description'),
		},
	};

	const valuesByField: Record<ListField, string[]> = {
		type: types,
		shop_section: shopSections,
		diet_flag: dietFlags,
	};

	return (
		<div className="ingredient-form">
			<p>
				{t('manageListsDisplay.intro')}
			</p>

			<div className="manage-lists-select-wrapper">
				<button
					type="button"
					onClick={() => setMenuOpen((open) => !open)}
					className="manage-lists-select-button"
				>
					{selectedField ? LIST_INFO[selectedField].label : t('manageListsDisplay.selectList')}
				</button>

				{menuOpen && (
					<ul className="smart-shopping-suggestions">
						{(Object.keys(LIST_INFO) as (ListField | 'diet_preset')[]).map((field) => (
							<li
								key={field}
								onClick={() => {
									setSelectedField(field);
									setMenuOpen(false);
								}}
							>
								{LIST_INFO[field].label}
							</li>
						))}
					</ul>
				)}
			</div>

			{selectedField && (
				<div className="manage-lists-detail">
					<p className="usda-popup-empty">{LIST_INFO[selectedField].description}</p>
					{selectedField === 'diet_preset' ? (
						<DietPresetsEditor
							dietFlags={dietFlags}
							presets={dietPresets}
							onAddPreset={onAddPreset}
							onRemovePreset={onRemovePreset}
						/>
					) : (
						<ListSectionEditor
							field={selectedField}
							values={valuesByField[selectedField]}
							onAdd={onAdd}
							onRename={onRename}
							onRemove={onRemove}
						/>
					)}
				</div>
			)}
		</div>
	);
}
