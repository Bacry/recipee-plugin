import { App, Modal } from 'obsidian';

// A simple native Obsidian confirmation dialog with two buttons —
// used for "this recipe is already in your shopping list, add anyway?".
export class ConfirmModal extends Modal {
	private message: string;
	private onConfirm: () => void;

	constructor(app: App, message: string, onConfirm: () => void) {
		super(app);
		this.message = message;
		this.onConfirm = onConfirm;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('p', { text: this.message });

		const buttonRow = contentEl.createDiv({ cls: 'ingredient-form-actions' });

		const confirmButton = buttonRow.createEl('button', { text: 'Ajouter quand même', cls: 'ingredient-form-submit' });
		confirmButton.onclick = () => {
			this.onConfirm();
			this.close();
		};

		const cancelButton = buttonRow.createEl('button', { text: 'Annuler' });
		cancelButton.onclick = () => this.close();
	}

	onClose() {
		this.contentEl.empty();
	}
}
