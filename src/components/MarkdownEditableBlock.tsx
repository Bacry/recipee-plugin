import { useEffect, useRef, useState } from 'react';
import { App, Component, MarkdownRenderer } from 'obsidian';

interface MarkdownEditableBlockProps {
	app: App;
	title?: string; // optional heading shown next to the edit/save button
	content: string;
	onSave: (newContent: string) => void;
}

// A text block that toggles between raw markdown editing (a plain textarea)
// and a rendered preview (using Obsidian's native MarkdownRenderer). Used for
// recipe instruction sections and the notes field — anywhere free-form
// markdown needs both easy editing and a nicely formatted display.
export function MarkdownEditableBlock({ app, title, content, onSave }: MarkdownEditableBlockProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [draft, setDraft] = useState(content);
	const previewRef = useRef<HTMLDivElement>(null);

	const componentRef = useRef(new Component());

	useEffect(() => {
		if (isEditing || !previewRef.current) return;

		previewRef.current.empty();
		MarkdownRenderer.render(app, content, previewRef.current, '', componentRef.current);
	}, [isEditing, content, app]);

	function handleSave() {
		onSave(draft);
		setIsEditing(false);
	}

	function handleToggle() {
		if (isEditing) {
			handleSave();
		} else {
			setDraft(content); // start editing from the latest saved content
			setIsEditing(true);
		}
	}

	return (
		<div className="markdown-editable-block">
			<div className="markdown-editable-header">
				{title && (
					<h4 onClick={handleToggle} className="markdown-editable-title-clickable">
						{title}
					</h4>
				)}
				{isEditing && (
					<button className="markdown-editable-toggle" onClick={handleToggle} title="Enregistrer">💾</button>
				)}
			</div>

			{isEditing ? (
				<textarea
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					className="markdown-editable-textarea"
					rows={8}
				/>
			) : (
				<div ref={previewRef} className="markdown-editable-preview" />
			)}
		</div>
	);
}
