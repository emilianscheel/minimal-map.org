import { Button, Card, CardBody } from '@wordpress/components';
import domReady from '@wordpress/dom-ready';
import { createRoot, useEffect, useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { ReactNode } from 'react';
import {
	Download,
	FileUp,
	FolderTree,
	LayoutDashboard,
	Layers3,
	MapPin,
	MapPinned,
	Palette,
	Settings,
	Tags,
	type LucideIcon,
} from 'lucide-react';
import CollectionsView, { useCollectionsController } from './collections';
import LocationsView, { useLocationsController } from './locations';
import { createMinimalMap } from '../map/bootstrap';
import type {
	AdminAppConfig,
	AdminSection,
	AdminSectionView,
	DashboardCardView,
	MapRuntimeConfig,
	MinimalMapInstance,
	RawMapConfig,
} from '../types';
import './style.scss';

const DEFAULT_ADMIN_CONFIG: AdminAppConfig = {
	currentView: 'dashboard',
	sections: [],
	stats: {
		locations: 0,
		collections: 0,
		categories: 0,
		markers: 0,
		tags: 0,
	},
	collectionsConfig: {
		nonce: '',
		restBase: '',
		restPath: '',
	},
	locationsConfig: {
		nonce: '',
		restBase: '',
		restPath: '',
		geocodePath: '',
	},
	mapConfig: {},
};

const adminConfig: AdminAppConfig = window.MinimalMapAdminConfig ?? DEFAULT_ADMIN_CONFIG;

const ICONS: Record<AdminSectionView, LucideIcon> = {
	dashboard: LayoutDashboard,
	locations: MapPinned,
	collections: Layers3,
	categories: FolderTree,
	tags: Tags,
	markers: MapPin,
	styles: Palette,
	import: FileUp,
	export: Download,
	settings: Settings,
};

const CARD_VIEWS: DashboardCardView[] = [ 'locations', 'collections', 'categories', 'markers', 'tags' ];

const CARD_COPY: Record<DashboardCardView, string> = {
	locations: __('Manage every place you want to render on your maps and prepare it for future block integrations.', 'minimal-map'),
	collections: __('Build reusable groups of locations and curate map-ready sets without changing the location editor flow.', 'minimal-map'),
	categories: __('Organize locations into reusable groupings so future filters and styles stay easy to maintain.', 'minimal-map'),
	markers: __('Create marker variants and keep your map pin system consistent across locations and styles.', 'minimal-map'),
	tags: __('Add lightweight labels that make large map datasets easier to sort, search, and evolve.', 'minimal-map'),
};

const CTA_COPY: Record<DashboardCardView, string> = {
	locations: __('Open locations', 'minimal-map'),
	collections: __('Open collections', 'minimal-map'),
	categories: __('Open categories', 'minimal-map'),
	markers: __('Open markers', 'minimal-map'),
	tags: __('Open tags', 'minimal-map'),
};

const COUNT_KEYS: Record<DashboardCardView, keyof AdminAppConfig['stats']> = {
	locations: 'locations',
	collections: 'collections',
	categories: 'categories',
	markers: 'markers',
	tags: 'tags',
};

function isAdminSectionView(value: string): value is AdminSectionView {
	return value in ICONS;
}

function getSectionMap(): Partial<Record<AdminSectionView, AdminSection>> {
	return adminConfig.sections.reduce<Partial<Record<AdminSectionView, AdminSection>>>(
		(accumulator, section) => {
			accumulator[ section.view ] = section;
			return accumulator;
		},
		{}
	);
}

function SectionIcon({ view }: { view: AdminSectionView }) {
	const IconComponent = ICONS[ view ] ?? ICONS.dashboard;

	return <IconComponent aria-hidden="true" size={24} strokeWidth={1.75} />;
}

function AdminSidebar({ currentView }: { currentView: AdminSectionView }) {
	return (
		<aside className="minimal-map-admin__sidebar">
			<nav className="minimal-map-admin__nav" aria-label={__('Minimal Map Sections', 'minimal-map')}>
				{adminConfig.sections.map((section) => {
					const isActive = section.view === currentView;

					return (
						<Button
							key={section.view}
							href={section.url}
							variant="tertiary"
							__next40pxDefaultSize
							className={[
								'minimal-map-admin__nav-item',
								isActive ? 'is-active' : '',
							].filter(Boolean).join(' ')}
						>
							<span className="minimal-map-admin__nav-icon"><SectionIcon view={section.view} /></span>
							<span>{section.title}</span>
						</Button>
					);
				})}
			</nav>
		</aside>
	);
}

function ContentHeader({
	actions,
	description,
	title,
}: {
	actions?: ReactNode;
	description: string;
	title: string;
}) {
	return (
		<header className="minimal-map-admin__header">
			<div className="minimal-map-admin__header-row">
				<div className="minimal-map-admin__header-copy">
					<h2 className="minimal-map-admin__header-title">{title}</h2>
					<p className="minimal-map-admin__header-description">{description}</p>
				</div>
				{actions ? <div className="minimal-map-admin__header-actions">{actions}</div> : null}
			</div>
		</header>
	);
}

function DashboardCard({ section }: { section: AdminSection }) {
	const countKey = COUNT_KEYS[ section.view as DashboardCardView ];
	const count = typeof adminConfig.stats[ countKey ] === 'number' ? adminConfig.stats[ countKey ] : 0;

	return (
		<Card className="minimal-map-admin__feature-card">
			<CardBody>
				<div className="minimal-map-admin__feature-meta">
					<span className="minimal-map-admin__feature-icon"><SectionIcon view={section.view} /></span>
					<span className="minimal-map-admin__feature-count">{count}</span>
				</div>
				<h3 className="minimal-map-admin__feature-title">{section.title}</h3>
				<p className="minimal-map-admin__feature-description">{CARD_COPY[ section.view as DashboardCardView ]}</p>
				<Button href={section.url} variant="link" className="minimal-map-admin__feature-link">
					{CTA_COPY[ section.view as DashboardCardView ]}
				</Button>
			</CardBody>
		</Card>
	);
}

function Dashboard({ sectionMap }: { sectionMap: Partial<Record<AdminSectionView, AdminSection>> }) {
	const mapHostRef = useRef<HTMLDivElement | null>(null);
	const mapInstanceRef = useRef<MinimalMapInstance | null>(null);
	const mapConfig = useMemo<RawMapConfig>(() => ({
		centerLat: 52.517,
		centerLng: 13.388,
		zoom: 9.5,
		height: 100,
		heightUnit: '%',
		stylePreset: 'positron',
		showZoomControls: true,
	}), []);
	const mapRuntimeConfig: MapRuntimeConfig = adminConfig.mapConfig ?? {};

	useEffect(() => {
		if (!mapHostRef.current) {
			return undefined;
		}

		mapInstanceRef.current = createMinimalMap(
			mapHostRef.current,
			mapConfig,
			mapRuntimeConfig
		);

		return () => {
			if (mapInstanceRef.current) {
				mapInstanceRef.current.destroy();
				mapInstanceRef.current = null;
			}
		};
	}, [ mapConfig, mapRuntimeConfig ]);

	return (
		<div className="minimal-map-admin__dashboard">
			<div className="minimal-map-admin__dashboard-grid">
				{CARD_VIEWS.map((view) => {
					const section = sectionMap[ view ];

					return section ? <DashboardCard key={view} section={section} /> : null;
				})}
			</div>
			<div className="minimal-map-admin__dashboard-map">
				<div
					ref={mapHostRef}
					className="minimal-map-admin__dashboard-map-surface"
				/>
			</div>
		</div>
	);
}

function PlaceholderView({ title }: { title: string }) {
	return <div className="minimal-map-admin__placeholder-view" aria-label={title} />;
}

function getActiveSection(currentView: AdminSectionView): AdminSection {
	const sectionMap = getSectionMap();

	return sectionMap[ currentView ] ?? sectionMap.dashboard ?? {
		view: 'dashboard',
		title: __('Dashboard', 'minimal-map'),
		description: __('An overview of Minimal Map sections and upcoming data tools.', 'minimal-map'),
		url: '#',
	};
}

function App({ currentView }: { currentView: AdminSectionView }) {
	const sectionMap = getSectionMap();
	const activeSection = getActiveSection(currentView);
	const locationsController = useLocationsController(
		adminConfig.locationsConfig,
		activeSection.view === 'locations'
	);
	const collectionsController = useCollectionsController(
		adminConfig.collectionsConfig,
		adminConfig.locationsConfig,
		activeSection.view === 'collections'
	);

	return (
		<div className="minimal-map-admin__app">
			<AdminSidebar currentView={activeSection.view} />
			<div className="minimal-map-admin__panel">
				<ContentHeader
					title={activeSection.title}
					description={activeSection.description}
					actions={
						activeSection.view === 'locations'
							? locationsController.headerAction
							: activeSection.view === 'collections'
								? collectionsController.headerAction
								: undefined
					}
				/>
				<div
					className={[
						'minimal-map-admin__content',
						activeSection.view === 'dashboard' ? 'minimal-map-admin__content--dashboard' : '',
					].filter(Boolean).join(' ')}
				>
					{activeSection.view === 'dashboard' ? (
						<Dashboard sectionMap={sectionMap} />
					) : activeSection.view === 'locations' ? (
						<LocationsView controller={locationsController} />
					) : activeSection.view === 'collections' ? (
						<CollectionsView controller={collectionsController} />
					) : (
						<PlaceholderView title={activeSection.title} />
					)}
				</div>
			</div>
		</div>
	);
}

function mount(): void {
	document.querySelectorAll<HTMLElement>('[data-minimal-map-admin-root]').forEach((node) => {
		const requestedView = node.getAttribute('data-current-view') ?? adminConfig.currentView ?? 'dashboard';
		const currentView = isAdminSectionView(requestedView) ? requestedView : 'dashboard';
		createRoot(node).render(<App currentView={currentView} />);
	});
}

domReady(mount);
