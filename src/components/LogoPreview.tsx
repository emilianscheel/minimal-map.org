import type { LogoRecord } from '../types';

interface LogoPreviewProps {
	logo: Pick<LogoRecord, 'content' | 'title'>;
	className?: string;
}

export default function LogoPreview({ logo, className = '' }: LogoPreviewProps) {
	const isSvgMarkup = logo.content.trim().startsWith('<svg');

	return (
		<div
			className={['minimal-map-admin__logo-preview', className].filter(Boolean).join(' ')}
			aria-label={logo.title}
			role="img"
		>
			<div className="minimal-map-admin__logo-preview-svg">
				{isSvgMarkup ? (
					<div dangerouslySetInnerHTML={{ __html: logo.content }} />
				) : (
					<img src={logo.content} alt={logo.title} />
				)}
			</div>
		</div>
	);
}
