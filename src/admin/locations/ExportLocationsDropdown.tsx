import { Button, Dropdown, MenuGroup, MenuItem, __experimentalHStack as HStack } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { ChevronDown, Download, FileSpreadsheet } from 'lucide-react';

interface ExportLocationsDropdownProps {
	onExport: () => void;
	onExportExample: () => void;
}

export function ExportLocationsDropdown({ onExport, onExportExample }: ExportLocationsDropdownProps) {
	return (
		<Dropdown
			popoverProps={{ placement: 'bottom-end' }}
			renderToggle={({ isOpen, onToggle }) => (
				<Button
					onClick={onToggle}
					aria-expanded={isOpen}
					variant="tertiary"
					icon={<Download size={18} />}
					label={__('Export locations', 'minimal-map')}
					__next40pxDefaultSize
				>
					<ChevronDown size={16} />
				</Button>
			)}
			renderContent={({ onClose }) => (
				<MenuGroup label={__('Export Options', 'minimal-map')}>
					<MenuItem
						onClick={() => {
							onExport();
							onClose();
						}}
						icon={<FileSpreadsheet size={16} />}
					>
						{__('Download as CSV', 'minimal-map')}
					</MenuItem>
					<MenuItem
						onClick={() => {
							onExportExample();
							onClose();
						}}
						icon={<FileSpreadsheet size={16} />}
					>
						{__('Download example CSV', 'minimal-map')}
					</MenuItem>
				</MenuGroup>
			)}
		/>
	);
}
