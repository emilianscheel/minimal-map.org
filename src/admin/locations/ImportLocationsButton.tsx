import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Upload } from 'lucide-react';

interface ImportLocationsButtonProps {
	onImport: (file: File) => Promise<void>;
	isImporting: boolean;
}

export function ImportLocationsButton({ onImport, isImporting }: ImportLocationsButtonProps) {
	return (
		<Button
			icon={<Upload size={18} />}
			label={__('Import locations from CSV or Excel', 'minimal-map')}
			onClick={() => {
				const input = document.createElement('input');
				input.type = 'file';
				input.accept = '.csv,.xlsx,.xls';
				input.onchange = (e) => {
					const file = (e.target as HTMLInputElement).files?.[0];
					if (file) {
						onImport(file);
					}
				};
				input.click();
			}}
			variant="tertiary"
			isBusy={isImporting}
			disabled={isImporting}
			__next40pxDefaultSize
		/>
	);
}
