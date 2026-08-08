import { useState } from 'react';
import { ListField } from '../models/renameListValue';
import { DietPreset } from '../settings';

interface ManageListsDisplayProps {
	types: string[];
	shopSections: string[];
	dietFlags: string[];
	onAdd: (field: ListField, value: string) => void;
	onRename: (field: ListField, oldValue: string, newValue: string) => void;
	onRemove: (field: ListField, value: string) => void;
	onAddPreset: (name: string, flags: string[]) => void;
	onRemovePreset: (name: string) => void;
}

const LIST_INFO: Record<ListField, { label: string; description: string }> = {
	type: {
		label: "Types d'ingrédients",
		description: "Catégorise chaque ingrédient (légume, viande, épice...). Détermine aussi le sous-dossier où sa fiche est rangée.",
	},
	shop_section: {
		label: 'Rayons',
		description: "Le rayon du magasin où trouver chaque ingrédient — utilisé pour organiser la liste de courses.",
	},
	diet_flag: {
		label: 'Contraintes alimentaires',
		description: "Signale qu'un ingrédient contient tel allergène ou correspond à telle contrainte (gluten, lactose...). Sert à filtrer les recettes qui en contiennent.",
	},
	diet_preset: {
		label: 'Préréglages alimentaires',
		description: "Une combinaison nommée de plusieurs contraintes (ex: \"Végan\" = viande + poisson + œuf + lactose), pour filtrer en un clic sans tout recocher à chaque fois.",
	},
};

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
						<button type="button" onClick={() => onRemovePreset(preset.name)} title="Supprimer" className="recipe-ingredient-remove">✕</button>
					</li>
				))}
			</ul>

			<div className="ingredient-form-field">
				<label>Nom du préréglage</label>
				<input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="ex : Végan" />
			</div>

			<div className="ingredient-form-field">
				<label>Contraintes incluses</label>
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

			<button type="button" onClick={handleAdd} className="ingredient-form-submit">Créer le préréglage</button>
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
						<button type="button" onClick={() => onRemove(field, value)} title="Supprimer" className="recipe-ingredient-remove">✕</button>
					</li>
				))}
			</ul>

			<div className="ingredient-form-field usda-search-row">
				<input
					value={newValue}
					onChange={(e) => setNewValue(e.target.value)}
					onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
					placeholder="Ajouter une valeur..."
				/>
			</div>
		</div>
	);
}

export function ManageListsDisplay({ types, shopSections, dietFlags, dietPresets, onAdd, onRename, onRemove,
									   onAddPreset,
									   onRemovePreset, }: ManageListsDisplayProps) {
	const [selectedField, setSelectedField] = useState<ListField | 'diet_preset' | null>(null);
	const [menuOpen, setMenuOpen] = useState(false);

	const valuesByField: Record<ListField, string[]> = {
		type: types,
		shop_section: shopSections,
		diet_flag: dietFlags,
	};

	return (
		<div className="ingredient-form">
			<h3>Gérer les listes</h3>
			<p>
				Ces listes sont utilisées dans les formulaires (menus déroulants, autocomplétion) et pour organiser
				vos fiches. Renommer une valeur met automatiquement à jour tous les ingrédients concernés.
			</p>

			<div className="manage-lists-select-wrapper">
				<button
					type="button"
					onClick={() => setMenuOpen((open) => !open)}
					className="manage-lists-select-button"
				>
					{selectedField ? LIST_INFO[selectedField].label : 'Choisir une liste...'}
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
