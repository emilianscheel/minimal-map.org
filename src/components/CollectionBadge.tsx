/**
 * CollectionBadge component.
 *
 * @package Minimal_Map
 */

/**
 * Render a simple badge for a collection.
 *
 * @param {Object} props       Component props.
 * @param {string} props.label Badge label.
 * @return {JSX.Element} The badge element.
 */
export default function CollectionBadge({ label }: { label: string }) {
	return (
		<span className="components-badge is-default">
			<span className="components-badge__flex-wrapper">
				<span className="components-badge__content">{label}</span>
			</span>
		</span>
	);
}
