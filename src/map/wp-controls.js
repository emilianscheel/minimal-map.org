export function createWordPressZoomControls(host, map, labels = {}) {
	const controls = document.createElement('div');
	controls.className = 'minimal-map-controls';

	const zoomInButton = document.createElement('button');
	zoomInButton.type = 'button';
	zoomInButton.className = 'components-button minimal-map-controls__button';
	zoomInButton.setAttribute('aria-label', labels.zoomIn || 'Zoom in');
	zoomInButton.textContent = '+';
	zoomInButton.addEventListener('click', () => map.zoomIn());

	const zoomOutButton = document.createElement('button');
	zoomOutButton.type = 'button';
	zoomOutButton.className = 'components-button minimal-map-controls__button';
	zoomOutButton.setAttribute('aria-label', labels.zoomOut || 'Zoom out');
	zoomOutButton.textContent = '-';
	zoomOutButton.addEventListener('click', () => map.zoomOut());

	controls.append(zoomInButton, zoomOutButton);
	host.appendChild(controls);

	return {
		destroy() {
			controls.remove();
		},
	};
}
