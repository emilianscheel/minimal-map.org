import type { ReactNode } from 'react';
import './style.scss';

type KbdVariant = 'neutral' | 'blue' | 'red';

export default function Kbd({
	children,
	variant = 'neutral',
}: {
	children: ReactNode;
	variant?: KbdVariant;
}) {
	return <kbd className={`minimal-map-kbd minimal-map-kbd--${variant}`}>{children}</kbd>;
}
