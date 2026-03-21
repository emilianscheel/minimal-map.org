import type { ReactNode } from 'react';
import './style.scss';

type KbdVariant = 'neutral' | 'blue' | 'red' | 'search';
type ShortcutKey = 'primary' | 'shift' | 'alt' | 'enter' | string;

interface PlatformSource {
	userAgent?: string;
	platform?: string;
	userAgentData?: {
		platform?: string;
	};
}

export function isApplePlatform(
	platformSource: PlatformSource | undefined = typeof navigator !== 'undefined'
		? navigator
		: undefined,
): boolean {
	const platform = [
		platformSource?.userAgentData?.platform,
		platformSource?.platform,
		platformSource?.userAgent,
	]
		.filter(Boolean)
		.join(' ');

	return /mac|iphone|ipad|ipod/i.test(platform);
}

function getShortcutKeyLabel(key: ShortcutKey, isApple: boolean): string {
	switch (key.toLowerCase()) {
		case 'primary':
			return isApple ? '⌘' : 'Ctrl';
		case 'shift':
			return isApple ? '⇧' : 'Shift';
		case 'alt':
			return isApple ? '⌥' : 'Alt';
		case 'enter':
			return 'Enter';
		default:
			return key.length === 1 ? key.toUpperCase() : key;
	}
}

function getShortcutAriaToken(key: ShortcutKey, isApple: boolean): string {
	switch (key.toLowerCase()) {
		case 'primary':
			return isApple ? 'Meta' : 'Control';
		case 'shift':
			return 'Shift';
		case 'alt':
			return 'Alt';
		case 'enter':
			return 'Enter';
		default:
			return key.length === 1 ? key.toUpperCase() : key;
	}
}

export function getShortcutAriaKeys(
	keys: ShortcutKey[],
	platformSource?: PlatformSource,
): string {
	const isApple = isApplePlatform(platformSource);

	return keys.map((key) => getShortcutAriaToken(key, isApple)).join('+');
}

export default function Kbd({
	children,
	variant = 'neutral',
}: {
	children: ReactNode;
	variant?: KbdVariant;
}) {
	return <kbd className={`minimal-map-kbd minimal-map-kbd--${variant}`}>{children}</kbd>;
}

export function KeyboardShortcut({
	keys,
	variant = 'neutral',
	platformSource,
}: {
	keys: ShortcutKey[];
	variant?: KbdVariant;
	platformSource?: PlatformSource;
}) {
	const isApple = isApplePlatform(platformSource);

	return (
		<span
			className="minimal-map-kbd-shortcut"
			aria-label={getShortcutAriaKeys(keys, platformSource)}
		>
			{keys.map((key, index) => (
				<span key={`${key}-${index}`} className="minimal-map-kbd-shortcut-token">
					{index > 0 ? (
						<span className="minimal-map-kbd-shortcut-separator" aria-hidden="true">
							+
						</span>
					) : null}
					<Kbd variant={variant}>{getShortcutKeyLabel(key, isApple)}</Kbd>
				</span>
			))}
		</span>
	);
}
