import { Card, CardBody, DropZone, Notice, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect, useMemo, useRef } from '@wordpress/element';
import type { StylesController } from './types';
import { ColorControl } from './ColorControl';
import { CreateThemeModal } from './CreateThemeModal';
import { DeleteThemeModal } from './DeleteThemeModal';
import { createMinimalMap } from '../../map/bootstrap';
import type { MinimalMapInstance, RawMapConfig, MapRuntimeConfig } from '../../types';
import { COLOR_GROUPS, SLOT_LABELS } from './constants';

interface StylesViewProps {
	controller: StylesController;
	runtimeConfig: MapRuntimeConfig;
}

export default function StylesView({ controller, runtimeConfig }: StylesViewProps) {
	const {
		isLoading,
		draftColors,
		setDraftColor,
		activeTheme,
		actionNotice,
		isCreateModalOpen,
		isDeleteModalOpen,
		closeCreateModal,
		closeDeleteModal,
		createTheme,
		deleteTheme,
	} = controller;
	const mapHostRef = useRef<HTMLDivElement | null>(null);
	const mapInstanceRef = useRef<MinimalMapInstance | null>(null);

	const mapConfig = useMemo<RawMapConfig>(() => ({
		centerLat: 52.517,
		centerLng: 13.388,
		zoom: 12,
		height: 100,
		heightUnit: '%',
		stylePreset: activeTheme?.basePreset || 'positron',
		styleTheme: draftColors || {},
		interactive: true,
		scrollZoom: true,
		showAttribution: true,
	}), [ activeTheme?.basePreset, draftColors ]);

	useEffect(() => {
		if (!mapHostRef.current || !activeTheme) {
			return undefined;
		}

		if (!mapInstanceRef.current) {
			mapInstanceRef.current = createMinimalMap(
				mapHostRef.current,
				mapConfig,
				runtimeConfig
			);
		} else {
			mapInstanceRef.current.update(mapConfig);
		}

		return () => {
			// We don't destroy on every re-render to keep it live
		};
	}, [ activeTheme, mapConfig, runtimeConfig ]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (mapInstanceRef.current) {
				mapInstanceRef.current.destroy();
				mapInstanceRef.current = null;
			}
		};
	}, []);

	if (isLoading) {
		return (
			<div className="minimal-map-styles__loading">
				<Spinner />
			</div>
		);
	}

	return (
		<div className="minimal-map-styles" style={{ position: 'relative' }}>
			{actionNotice ? (
				<Notice
					status={actionNotice.status}
					onRemove={controller.dismissActionNotice}
				>
					{actionNotice.message}
				</Notice>
			) : null}
			<DropZone
				onFilesDrop={(files) => {
					void controller.onImportFiles(files as unknown as FileList);
				}}
				label={__('Drop Minimal Map or MapLibre JSON theme files here to upload', 'minimal-map')}
			/>
			<div className="minimal-map-styles__layout">
				<div className="minimal-map-styles__controls">
					{COLOR_GROUPS.map((group) => (
						<Card key={group.label} className="minimal-map-styles__group-card">
							<CardBody>
								<h3 className="minimal-map-styles__group-title">{group.label}</h3>
								<div className="minimal-map-styles__group-grid">
									{group.slots.map((slot) => (
										<ColorControl
											key={slot}
											label={SLOT_LABELS[ slot ]}
											color={draftColors?.[ slot ] || '#000000'}
											onChange={(color) => setDraftColor(slot, color)}
										/>
									))}
								</div>
							</CardBody>
						</Card>
					))}
				</div>
				<div className="minimal-map-styles__preview">
					<div className="minimal-map-styles__preview-sticky">
						<Card className="minimal-map-styles__preview-card">
							<CardBody>
								<div
									ref={mapHostRef}
									className="minimal-map-styles__preview-surface"
								/>
							</CardBody>
						</Card>
					</div>
				</div>
			</div>

			<CreateThemeModal
				isOpen={isCreateModalOpen}
				onRequestClose={closeCreateModal}
				onCreate={createTheme}
			/>

			<DeleteThemeModal
				isOpen={isDeleteModalOpen}
				onRequestClose={closeDeleteModal}
				onDelete={deleteTheme}
				theme={activeTheme}
			/>
		</div>
	);
}
