import './style.scss';
import { bootstrapFrontendMaps } from '../map/bootstrap';

function initialize() {
	bootstrapFrontendMaps(window.MinimalMapFrontConfig || {});
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initialize, { once: true });
} else {
	initialize();
}
