import { useMemo, useState } from '@wordpress/element';
import type { AnalyticsTrendPoint } from '../../types';

const CHART_WIDTH = 260;
const CHART_HEIGHT = 84;
const CHART_PADDING_X = 2;
const CHART_PADDING_Y = 8;

function createLinearScale(
	domain: [number, number],
	range: [number, number]
): (value: number) => number {
	const [domainMin, domainMax] = domain;
	const [rangeMin, rangeMax] = range;

	if (domainMax === domainMin) {
		return () => (rangeMin + rangeMax) / 2;
	}

	const ratio = (rangeMax - rangeMin) / (domainMax - domainMin);

	return (value: number) => rangeMin + (value - domainMin) * ratio;
}

function createYDomain(values: number[]): [number, number] {
	if (values.length === 0) {
		return [0, 1];
	}

	const min = Math.min(...values);
	const max = Math.max(...values);

	if (min === max) {
		if (max === 0) {
			return [0, 1];
		}

		return [min * 0.92, max * 1.08];
	}

	const padding = (max - min) * 0.12;

	return [Math.max(0, min - padding), max + padding];
}

function buildSmoothLinePath(
	series: AnalyticsTrendPoint[],
	getX: (index: number) => number,
	getY: (value: number) => number
): string {
	const points = series
		.map((point, index) => (
			point.value === null
				? null
				: {
					x: getX(index),
					y: getY(point.value),
				}
		))
		.filter((point): point is { x: number; y: number } => point !== null);

	if (points.length === 0) {
		return '';
	}

	if (points.length === 1) {
		return `M ${points[0].x} ${points[0].y}`;
	}

	let path = `M ${points[0].x} ${points[0].y}`;

	for (let index = 0; index < points.length - 1; index += 1) {
		const current = points[index];
		const next = points[index + 1];
		const controlX = (current.x + next.x) / 2;

		path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
	}

	return path;
}

export default function AnalyticsSparkline({
	ariaLabel,
	formatTooltipValue,
	isEmpty = false,
	series,
}: {
	ariaLabel: string;
	formatTooltipValue: (value: number | null) => string;
	isEmpty?: boolean;
	series: AnalyticsTrendPoint[];
}) {
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	const definedValues = useMemo(
		() => series.map((point) => point.value).filter((value): value is number => value !== null),
		[series]
	);
	const hasRenderableData = !isEmpty && definedValues.length > 0;
	const xScale = useMemo(
		() => createLinearScale(
			[0, Math.max(0, series.length - 1)],
			[CHART_PADDING_X, CHART_WIDTH - CHART_PADDING_X]
		),
		[series.length]
	);
	const yScale = useMemo(
		() => createLinearScale(
			createYDomain(definedValues),
			[CHART_HEIGHT - CHART_PADDING_Y, CHART_PADDING_Y]
		),
		[definedValues]
	);
	const pathData = useMemo(
		() => hasRenderableData ? buildSmoothLinePath(series, xScale, yScale) : '',
		[hasRenderableData, series, xScale, yScale]
	);
	const activePoint = activeIndex !== null ? series[activeIndex] ?? null : null;
	const activePointX = activeIndex !== null ? xScale(activeIndex) : null;
	const activePointY = activePoint && activePoint.value !== null && activeIndex !== null
		? yScale(activePoint.value)
		: null;

	return (
		<div className="minimal-map-admin__analytics-sparkline" aria-label={ariaLabel}>
			<svg
				className="minimal-map-admin__analytics-sparkline-svg"
				viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
				preserveAspectRatio="none"
				aria-hidden="true"
			>
				{pathData ? (
					<path
						d={pathData}
						stroke="#000"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						fill="none"
					/>
				) : null}
				{activePointX !== null ? (
					<line
						x1={activePointX}
						x2={activePointX}
						y1={CHART_PADDING_Y}
						y2={CHART_HEIGHT - CHART_PADDING_Y}
						stroke="#000"
						strokeDasharray="3 4"
						strokeOpacity="0.16"
						strokeWidth={1}
					/>
				) : null}
				{activePointX !== null && activePointY !== null ? (
					<circle
						cx={activePointX}
						cy={activePointY}
						r={3.5}
						fill="#000"
					/>
				) : null}
			</svg>
			<div className="minimal-map-admin__analytics-sparkline-hotspots" aria-hidden="true">
				{series.map((point, index) => {
					const left = `${(index / Math.max(1, series.length)) * 100}%`;
					const width = `${100 / Math.max(1, series.length)}%`;

					return (
						<button
							key={`${point.date}-${index}`}
							type="button"
							className="minimal-map-admin__analytics-sparkline-hotspot"
							style={{ left, width }}
							onMouseEnter={() => setActiveIndex(index)}
							onFocus={() => setActiveIndex(index)}
							onBlur={() => setActiveIndex((currentIndex) => currentIndex === index ? null : currentIndex)}
							onMouseLeave={() => setActiveIndex((currentIndex) => currentIndex === index ? null : currentIndex)}
							tabIndex={0}
							aria-label={`${point.date}: ${formatTooltipValue(point.value)}`}
						/>
					);
				})}
			</div>
			{activePoint && activePointX !== null ? (
				<div
					className="minimal-map-admin__analytics-sparkline-tooltip"
					style={{ left: `${(activePointX / CHART_WIDTH) * 100}%` }}
				>
					<span className="minimal-map-admin__analytics-sparkline-tooltip-date">
						{activePoint.date}
					</span>
					<span className="minimal-map-admin__analytics-sparkline-tooltip-value">
						{formatTooltipValue(activePoint.value)}
					</span>
				</div>
			) : null}
		</div>
	);
}
