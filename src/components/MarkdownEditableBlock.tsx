import { useEffect, useRef, useState } from 'react';
import { App, Component, MarkdownRenderer } from 'obsidian';

interface MarkdownEditableBlockProps {
	app: App;
	title?: string;
	content: string;
	placeholder?: string; // shown, dimmed, in the preview when content is empty — never actually saved as content
	onSave: (newContent: string) => void;
}

export function MarkdownEditableBlock({ app, title, titleClass, content, contentClass, placeholder, onSave }: MarkdownEditableBlockProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [draft, setDraft] = useState(content);
	const previewRef = useRef<HTMLDivElement>(null);

	const componentRef = useRef(new Component());

	useEffect(() => {
		if (isEditing || !previewRef.current) return;

		previewRef.current.empty();

		if (content.trim() === '' && placeholder) {
			previewRef.current.createSpan({ text: placeholder, cls: 'markdown-editable-placeholder' });
			return;
		}

		MarkdownRenderer.render(app, content, previewRef.current, '', componentRef.current);
	}, [isEditing, content, app, placeholder]);

	function handleSave() {
		onSave(draft);
		setIsEditing(false);
	}

	function handleToggle() {
		if (isEditing) {
			handleSave();
		} else {
			setDraft(content);
			setIsEditing(true);
		}
	}

	return (
		<div className="markdown-editable-block">
			<div className="markdown-editable-header">
				{title && (
					<div onClick={handleToggle} className={`markdown-editable-title-clickable ${titleClass}`}>
						{title}
					</div>
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
				<div ref={previewRef} className={`markdown-editable-preview ${contentClass}`} />
			)}
		</div>
	);
}
