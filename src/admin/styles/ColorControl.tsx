import { ColorIndicator, ColorPicker, Dropdown } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

interface ColorControlProps {
	label: string;
	color: string;
	onChange: (color: string) => void;
}

export function ColorControl({ label, color, onChange }: ColorControlProps) {
	return (
		<div className="minimal-map-styles__color-control">
			<span className="minimal-map-styles__color-label">{label}</span>
			<Dropdown
				renderToggle={({ isOpen, onToggle }) => (
					<button
						type="button"
						className="minimal-map-styles__color-toggle"
						onClick={onToggle}
						aria-expanded={isOpen}
						aria-label={__('Select color', 'minimal-map')}
					>
						<ColorIndicator colorValue={color} />
						<span className="minimal-map-styles__color-value">{color}</span>
					</button>
				)}
				renderContent={() => (
					<div className="minimal-map-styles__color-picker-popover">
						<ColorPicker
							color={color}
							onChange={onChange}
							enableAlpha={false}
							copyFormat="hex"
						/>
					</div>
				)}
			/>
		</div>
	);
}
