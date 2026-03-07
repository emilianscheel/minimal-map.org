import { Card, CardBody } from '@wordpress/components';
import domReady from '@wordpress/dom-ready';
import { createRoot } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import './style.scss';

const adminConfig = window.MinimalMapAdminConfig || { pages: {}, stats: {} };

function PageTitle({ children }) {
	return (
		<Card className="minimal-map-admin__title-card">
			<CardBody>
				<h1 className="minimal-map-admin__page-title">{children}</h1>
			</CardBody>
		</Card>
	);
}

function StatCard({ label, value }) {
	return (
		<Card>
			<CardBody>
				<p className="minimal-map-admin__stat-label">{label}</p>
				<p className="minimal-map-admin__stat-value">{value}</p>
			</CardBody>
		</Card>
	);
}

function Dashboard() {
	const stats = adminConfig.stats || {};
	const cards = [
		{ key: 'locations', label: __('Locations', 'minimal-map') },
		{ key: 'categories', label: __('Categories', 'minimal-map') },
		{ key: 'markers', label: __('Markers', 'minimal-map') },
		{ key: 'tags', label: __('Tags', 'minimal-map') },
	];

	return (
		<div className="minimal-map-admin__content">
			<PageTitle>{__('Dashboard', 'minimal-map')}</PageTitle>
			<div className="minimal-map-admin__grid">
				{cards.map((card) => (
					<StatCard key={card.key} label={card.label} value={stats[card.key] ?? 0} />
				))}
			</div>
		</div>
	);
}

function DefaultPage({ title }) {
	return (
		<div className="minimal-map-admin__content">
			<PageTitle>{title}</PageTitle>
		</div>
	);
}

function App({ pageSlug, pageTitle }) {
	if (pageSlug === 'minimal-map') {
		return <Dashboard />;
	}

	return <DefaultPage title={pageTitle} />;
}

function mount() {
	document.querySelectorAll('[data-minimal-map-admin-root]').forEach((node) => {
		const pageSlug = node.getAttribute('data-page-slug') || 'minimal-map';
		const pageTitle = node.getAttribute('data-page-title') || adminConfig.pages?.[pageSlug] || __('Minimal Map', 'minimal-map');
		const root = createRoot(node);

		root.render(<App pageSlug={pageSlug} pageTitle={pageTitle} />);
	});
}

domReady(mount);
