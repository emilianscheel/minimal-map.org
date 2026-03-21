import { Card, CardBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { ChartColumn, Clock3, Route, SearchX } from 'lucide-react';
import type { AnalyticsSummary } from '../../types';
import AnalyticsSparkline from './AnalyticsSparkline';

function formatMetricValue(value: number | null, suffix = ''): string {
	if (value === null) {
		return '—';
	}

	return `${Math.round(value)}${suffix}`;
}

function formatDistanceValue(distanceMeters: number | null, hasData: boolean): string {
	if (!hasData || distanceMeters === null) {
		return '—';
	}

	if (distanceMeters >= 1000) {
		return `${(distanceMeters / 1000).toFixed(1)} km`;
	}

	return `${Math.round(distanceMeters)} m`;
}

function formatSparklineCount(value: number | null): string {
	if (value === null) {
		return '—';
	}

	return `${Math.round(value)}`;
}

function formatSparklineDistance(value: number | null): string {
	if (value === null) {
		return '—';
	}

	if (value >= 1000) {
		return `${(value / 1000).toFixed(1)} km`;
	}

	return `${Math.round(value)} m`;
}

export default function AnalyticsCards({
	summary,
}: {
	summary: AnalyticsSummary;
}) {
	const hasData = summary.totalSearches > 0;

	const cards = [
		{
			id: 'total',
			icon: <ChartColumn aria-hidden="true" size={22} strokeWidth={1.8} />,
			title: __('Total searches', 'minimal-map'),
			value: hasData ? formatMetricValue(summary.totalSearches) : '—',
			isEmpty: !hasData,
			series: summary.series.totalSearches,
			formatTooltipValue: formatSparklineCount,
		},
		{
			id: 'today',
			icon: <Clock3 aria-hidden="true" size={22} strokeWidth={1.8} />,
			title: __('Searches today', 'minimal-map'),
			value: hasData ? formatMetricValue(summary.searchesToday) : '—',
			isEmpty: !hasData,
			series: summary.series.searchesToday,
			formatTooltipValue: formatSparklineCount,
		},
		{
			id: 'zero',
			icon: <SearchX aria-hidden="true" size={22} strokeWidth={1.8} />,
			title: __('Zero-result searches', 'minimal-map'),
			value: hasData ? formatMetricValue(summary.zeroResultSearches) : '—',
			isEmpty: !hasData,
			series: summary.series.zeroResultSearches,
			formatTooltipValue: formatSparklineCount,
		},
		{
			id: 'distance',
			icon: <Route aria-hidden="true" size={22} strokeWidth={1.8} />,
			title: __('Average nearest distance', 'minimal-map'),
			value: formatDistanceValue(summary.averageNearestDistanceMeters, hasData),
			isEmpty: !hasData && summary.averageNearestDistanceMeters === null,
			series: summary.series.averageNearestDistanceMeters,
			formatTooltipValue: formatSparklineDistance,
		},
	];

	return (
		<div className="minimal-map-admin__analytics-cards">
			{cards.map((card) => (
				<Card key={card.id} className="minimal-map-admin__feature-card minimal-map-admin__analytics-card">
					<CardBody>
						<AnalyticsSparkline
							ariaLabel={card.title}
							formatTooltipValue={card.formatTooltipValue}
							isEmpty={card.isEmpty}
							series={card.series}
						/>
						<div className="minimal-map-admin__feature-meta">
							<span className="minimal-map-admin__feature-icon">{card.icon}</span>
							<span className="minimal-map-admin__analytics-card-value">{card.value}</span>
						</div>
						<h3 className="minimal-map-admin__feature-title">{card.title}</h3>
					</CardBody>
				</Card>
			))}
		</div>
	);
}
