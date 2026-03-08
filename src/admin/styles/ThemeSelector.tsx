import { Button, Dropdown, MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { ChevronDown, Check } from 'lucide-react';
import { StyleThemeRecord } from '../../types';

interface ThemeSelectorProps {
	activeTheme: StyleThemeRecord | null;
	themes: StyleThemeRecord[];
	onSwitch: (slug: string) => void;
}

export function ThemeSelector({ activeTheme, themes, onSwitch }: ThemeSelectorProps) {
	return (
		<Dropdown
			popoverProps={{ placement: 'bottom-start' }}
			renderToggle={({ isOpen, onToggle }) => (
				<Button
					onClick={onToggle}
					aria-expanded={isOpen}
					variant="tertiary"
					__next40pxDefaultSize
					className="minimal-map-styles__theme-selector-toggle"
				>
					<span className="minimal-map-styles__theme-selector-label">
						{activeTheme?.label || __('Select theme', 'minimal-map')}
					</span>
					<ChevronDown size={16} />
				</Button>
			)}
			renderContent={() => (
				<MenuGroup label={__('Switch Theme', 'minimal-map')}>
					{themes.map((theme) => (
						<MenuItem
							key={theme.slug}
							onClick={() => onSwitch(theme.slug)}
							icon={theme.slug === activeTheme?.slug ? <Check size={16} /> : undefined}
						>
							{theme.label}
						</MenuItem>
					))}
				</MenuGroup>
			)}
		/>
	);
}
