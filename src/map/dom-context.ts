export interface MapDomContext {
	doc: Document;
	win: Window & typeof globalThis;
}

export function getNodeDocument(node?: Node | null): Document | null {
	if (node?.ownerDocument) {
		return node.ownerDocument;
	}

	if (typeof document !== 'undefined') {
		return document;
	}

	return null;
}

export function getNodeWindow(node?: Node | null): (Window & typeof globalThis) | null {
	const doc = getNodeDocument(node);

	if (doc?.defaultView) {
		return doc.defaultView as Window & typeof globalThis;
	}

	if (typeof window !== 'undefined') {
		return window;
	}

	return null;
}

export function getMapDomContext(host: HTMLElement): MapDomContext {
	const doc = getNodeDocument(host);
	const win = getNodeWindow(host);

	if (!doc || !win) {
		throw new Error('Minimal Map requires a browser document context.');
	}

	return {
		doc,
		win,
	};
}
