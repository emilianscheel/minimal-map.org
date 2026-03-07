import type { WordPressAttributionControl } from '../types';

function createAttributionLink(href: string, label: string): HTMLAnchorElement {
	const link = document.createElement('a');

	link.href = href;
	link.target = '_blank';
	link.rel = 'noreferrer noopener';
	link.textContent = label;

	return link;
}

export function createAttributionPill(host: HTMLElement): WordPressAttributionControl {
	const root = document.createElement('div');
	const content = document.createElement('span');
	const tilesLink = createAttributionLink('https://openfreemap.org/', 'OpenFreeMap');
	const separator = document.createElement('span');
	const dataPrefix = document.createElement('span');
	const dataLink = createAttributionLink('https://www.openstreetmap.org/copyright', 'OpenStreetMap contributors');

	root.className = 'minimal-map-attribution';
	root.setAttribute('role', 'note');
	root.setAttribute('aria-label', 'Map credits');

	content.className = 'minimal-map-attribution__content';
	separator.className = 'minimal-map-attribution__separator';
	separator.textContent = ' | ';
	dataPrefix.textContent = 'Data ';

	content.append(tilesLink, separator, dataPrefix, dataLink);
	root.appendChild(content);
	host.appendChild(root);

	return {
		destroy() {
			root.remove();
		},
	};
}
