import { Menu } from 'obsidian';
import { sortAlphabetically } from '../models/textNormalize';

// Opens a native Obsidian context menu, anchored to the clicked element,
// offering each configured shop section as an item. Unlike a Modal, this
// doesn't dim the background and closes on an outside click, like a
// standard dropdown/context menu.
export function showShopSectionMenu(
	event: MouseEvent,
	shopSections: string[],
	onChoose: (section: string) => void
): void {
	const menu = new Menu();

	for (const section of sortAlphabetically(shopSections)) {
		menu.addItem((item) =>
			item.setTitle(section).onClick(() => onChoose(section))
		);
	}

	menu.showAtMouseEvent(event);
}
