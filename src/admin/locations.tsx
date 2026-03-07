import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	Notice,
	Spinner,
	TextControl,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { DataViews } from '@wordpress/dataviews/wp';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { Plus } from 'lucide-react';
import type { Field, View, ViewTable } from '@wordpress/dataviews';
import type { KeyboardEvent, ReactNode } from 'react';
import type {
	LocationDialogStep,
	LocationFormState,
	LocationMeta,
	LocationRecord,
	LocationsAdminConfig,
} from '../types';

const DEFAULT_FORM_STATE: LocationFormState = {
	title: '',
	telephone: '',
	email: '',
	website: '',
	street: '',
	house_number: '',
	postal_code: '',
	city: '',
	state: '',
	country: '',
};

const DEFAULT_VIEW: ViewTable = {
	type: 'table',
	page: 1,
	perPage: 10,
	fields: [
		'title',
		'telephone',
		'email',
		'website',
		'street',
		'house_number',
		'postal_code',
		'city',
		'state',
		'country',
	],
	layout: {
		enableMoving: false,
	},
};

interface LocationRestResponse {
	id: number;
	title?: {
		raw?: string;
		rendered?: string;
	};
	meta?: Partial<LocationMeta>;
}

interface FieldErrors {
	title?: string;
	email?: string;
	website?: string;
}

export interface LocationsController {
	fieldErrors: FieldErrors;
	form: LocationFormState;
	headerAction: ReactNode;
	isDialogOpen: boolean;
	isLoading: boolean;
	isSubmitting: boolean;
	loadError: string | null;
	locations: LocationRecord[];
	submitError: string | null;
	step: LocationDialogStep;
	view: ViewTable;
	setStep: (step: LocationDialogStep) => void;
	onCancel: () => void;
	onChangeFormValue: (key: keyof LocationFormState, value: string) => void;
	onChangeView: (nextView: ViewTable) => void;
	onConfirm: () => Promise<void>;
	paginatedLocations: LocationRecord[];
	totalPages: number;
}

let hasApiFetchNonce = false;

function configureApiFetch(nonce: string): void {
	if (!nonce || hasApiFetchNonce) {
		return;
	}

	apiFetch.use(apiFetch.createNonceMiddleware(nonce));
	hasApiFetchNonce = true;
}

function createEmptyFieldErrors(): FieldErrors {
	return {};
}

function normalizeLocationRecord(record: LocationRestResponse): LocationRecord {
	const meta = record.meta ?? {};

	return {
		id: record.id,
		title: record.title?.raw || record.title?.rendered || '',
		telephone: meta.telephone ?? '',
		email: meta.email ?? '',
		website: meta.website ?? '',
		street: meta.street ?? '',
		house_number: meta.house_number ?? '',
		postal_code: meta.postal_code ?? '',
		city: meta.city ?? '',
		state: meta.state ?? '',
		country: meta.country ?? '',
	};
}

function normalizeWebsiteValue(value: string): string {
	const trimmed = value.trim();

	if (!trimmed) {
		return '';
	}

	const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

	try {
		return new URL(normalized).toString();
	} catch {
		return trimmed;
	}
}

function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidWebsite(website: string): boolean {
	try {
		new URL(normalizeWebsiteValue(website));
		return true;
	} catch {
		return false;
	}
}

function validateDetailsStep(form: LocationFormState): FieldErrors {
	const errors = createEmptyFieldErrors();

	if (!form.title.trim()) {
		errors.title = __('A title is required.', 'minimal-map');
	}

	if (form.email.trim() && !isValidEmail(form.email.trim())) {
		errors.email = __('Enter a valid email address.', 'minimal-map');
	}

	if (form.website.trim() && !isValidWebsite(form.website.trim())) {
		errors.website = __('Enter a valid website URL.', 'minimal-map');
	}

	return errors;
}

function hasFieldErrors(errors: FieldErrors): boolean {
	return Object.values(errors).some(Boolean);
}

function buildLocationMeta(form: LocationFormState): LocationMeta {
	return {
		telephone: form.telephone.trim(),
		email: form.email.trim(),
		website: normalizeWebsiteValue(form.website),
		street: form.street.trim(),
		house_number: form.house_number.trim(),
		postal_code: form.postal_code.trim(),
		city: form.city.trim(),
		state: form.state.trim(),
		country: form.country.trim(),
	};
}

function paginateLocations(locations: LocationRecord[], view: ViewTable): {
	locations: LocationRecord[];
	totalPages: number;
} {
	const page = view.page ?? 1;
	const perPage = view.perPage ?? 10;
	const totalPages = Math.max(1, Math.ceil(locations.length / perPage));
	const startIndex = (page - 1) * perPage;

	return {
		locations: locations.slice(startIndex, startIndex + perPage),
		totalPages,
	};
}

async function fetchAllLocations(config: LocationsAdminConfig): Promise<LocationRecord[]> {
	const perPage = 100;
	let page = 1;
	let totalPages = 1;
	const locations: LocationRecord[] = [];

	while (page <= totalPages) {
		const response = (await apiFetch({
			method: 'GET',
			parse: false,
			path: `${config.restPath}?context=edit&page=${page}&per_page=${perPage}&_fields=id,title,meta`,
		})) as Response;
		const records = (await response.json()) as LocationRestResponse[];

		locations.push(...records.map(normalizeLocationRecord));
		totalPages = Number(response.headers.get('X-WP-TotalPages') || '1');
		page += 1;
	}

	return locations;
}

async function createLocation(config: LocationsAdminConfig, form: LocationFormState): Promise<void> {
	await apiFetch({
		path: config.restPath,
		method: 'POST',
		data: {
			title: form.title.trim(),
			status: 'publish',
			meta: buildLocationMeta(form),
		},
	});
}

function useLocationFields(): Field<LocationRecord>[] {
	return useMemo<Field<LocationRecord>[]>(
		() => [
			{
				id: 'title',
				label: __('Title', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
			},
			{
				id: 'telephone',
				label: __('Telephone', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
			},
			{
				id: 'email',
				label: __('Email address', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
				render: ({ item }) => {
					if (!item.email) {
						return null;
					}

					return <a href={`mailto:${item.email}`}>{item.email}</a>;
				},
			},
			{
				id: 'website',
				label: __('Website', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
				render: ({ item }) => {
					if (!item.website) {
						return null;
					}

					return (
						<a href={item.website} rel="noreferrer" target="_blank">
							{item.website}
						</a>
					);
				},
			},
			{
				id: 'street',
				label: __('Street', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
			},
			{
				id: 'house_number',
				label: __('House number', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
			},
			{
				id: 'postal_code',
				label: __('Postal code', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
			},
			{
				id: 'city',
				label: __('City', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
			},
			{
				id: 'state',
				label: __('State', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
			},
			{
				id: 'country',
				label: __('Country', 'minimal-map'),
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
			},
		],
		[]
	);
}

function LocationDialogFields({
	fieldErrors,
	form,
	onChange,
	step,
}: {
	fieldErrors: FieldErrors;
	form: LocationFormState;
	onChange: (key: keyof LocationFormState, value: string) => void;
	step: LocationDialogStep;
}) {
	if (step === 'details') {
		return (
			<div className="minimal-map-admin__location-dialog-fields">
				<TextControl
					autoFocus
					label={__('Title', 'minimal-map')}
					value={form.title}
					onChange={(value) => onChange('title', value)}
					help={fieldErrors.title}
				/>
				<TextControl
					label={__('Telephone', 'minimal-map')}
					type="tel"
					value={form.telephone}
					onChange={(value) => onChange('telephone', value)}
				/>
				<TextControl
					label={__('Email address', 'minimal-map')}
					type="email"
					value={form.email}
					onChange={(value) => onChange('email', value)}
					help={fieldErrors.email}
				/>
				<TextControl
					label={__('Website', 'minimal-map')}
					type="url"
					value={form.website}
					onChange={(value) => onChange('website', value)}
					help={fieldErrors.website}
				/>
			</div>
		);
	}

	return (
		<div className="minimal-map-admin__location-dialog-fields minimal-map-admin__location-dialog-fields--address">
			<div className="minimal-map-admin__location-dialog-grid minimal-map-admin__location-dialog-grid--row-one">
				<TextControl
					autoFocus
					label={__('Street', 'minimal-map')}
					value={form.street}
					onChange={(value) => onChange('street', value)}
				/>
				<TextControl
					label={__('House number', 'minimal-map')}
					value={form.house_number}
					onChange={(value) => onChange('house_number', value)}
				/>
			</div>
			<div className="minimal-map-admin__location-dialog-grid minimal-map-admin__location-dialog-grid--row-two">
				<TextControl
					label={__('Postal code', 'minimal-map')}
					value={form.postal_code}
					onChange={(value) => onChange('postal_code', value)}
				/>
				<TextControl
					label={__('City', 'minimal-map')}
					value={form.city}
					onChange={(value) => onChange('city', value)}
				/>
			</div>
			<div className="minimal-map-admin__location-dialog-grid minimal-map-admin__location-dialog-grid--row-three">
				<TextControl
					label={__('State', 'minimal-map')}
					value={form.state}
					onChange={(value) => onChange('state', value)}
				/>
				<TextControl
					label={__('Country', 'minimal-map')}
					value={form.country}
					onChange={(value) => onChange('country', value)}
				/>
			</div>
		</div>
	);
}

function shouldHandleDialogEnter(event: KeyboardEvent<HTMLDivElement>): boolean {
	const target = event.target;

	if (!(target instanceof HTMLElement)) {
		return false;
	}

	const tagName = target.tagName.toLowerCase();

	if (tagName === 'button' || tagName === 'textarea') {
		return false;
	}

	if (target.getAttribute('role') === 'button') {
		return false;
	}

	return event.key === 'Enter' && !event.shiftKey;
}

export function useLocationsController(
	config: LocationsAdminConfig,
	enabled: boolean
): LocationsController {
	const [ form, setForm ] = useState<LocationFormState>(DEFAULT_FORM_STATE);
	const [ fieldErrors, setFieldErrors ] = useState<FieldErrors>(createEmptyFieldErrors());
	const [ isDialogOpen, setDialogOpen ] = useState(false);
	const [ isSubmitting, setSubmitting ] = useState(false);
	const [ isLoading, setLoading ] = useState(enabled);
	const [ loadError, setLoadError ] = useState<string | null>(null);
	const [ submitError, setSubmitError ] = useState<string | null>(null);
	const [ locations, setLocations ] = useState<LocationRecord[]>([]);
	const [ step, setStep ] = useState<LocationDialogStep>('details');
	const [ view, setView ] = useState<ViewTable>(DEFAULT_VIEW);
	const loadLocations = useCallback(async () => {
		if (!enabled) {
			return;
		}

		setLoading(true);
		setLoadError(null);

		try {
			const records = await fetchAllLocations(config);
			setLocations(records);
		} catch (error) {
			setLoadError(
				error instanceof Error
					? error.message
					: __('Locations could not be loaded.', 'minimal-map')
			);
		} finally {
			setLoading(false);
		}
	}, [ config, enabled ]);

	useEffect(() => {
		configureApiFetch(config.nonce);

		if (!enabled) {
			return;
		}

		void loadLocations();
	}, [ config.nonce, enabled, loadLocations ]);

	useEffect(() => {
		setView((currentView) => ({
			...currentView,
			page: 1,
		}));
	}, [ locations.length ]);

	const { locations: paginatedLocations, totalPages } = useMemo(
		() => paginateLocations(locations, view),
		[ locations, view ]
	);

	const openDialog = (): void => {
		setForm(DEFAULT_FORM_STATE);
		setFieldErrors(createEmptyFieldErrors());
		setSubmitError(null);
		setStep('details');
		setDialogOpen(true);
	};

	const onCancel = (): void => {
		if (isSubmitting) {
			return;
		}

		setDialogOpen(false);
	};

	const onChangeFormValue = (key: keyof LocationFormState, value: string): void => {
		setForm((currentForm) => ({
			...currentForm,
			[key]: value,
		}));

		if (key === 'title' || key === 'email' || key === 'website') {
			setFieldErrors((currentErrors) => ({
				...currentErrors,
				[key]: undefined,
			}));
		}
	};

	const onConfirm = async (): Promise<void> => {
		if (step === 'details') {
			const errors = validateDetailsStep(form);
			setFieldErrors(errors);

			if (hasFieldErrors(errors)) {
				return;
			}

			setSubmitError(null);
			setStep('address');
			return;
		}

		const errors = validateDetailsStep(form);
		setFieldErrors(errors);

		if (hasFieldErrors(errors)) {
			setStep('details');
			return;
		}

		setSubmitting(true);
		setSubmitError(null);

		try {
			await createLocation(config, form);
			await loadLocations();
			setDialogOpen(false);
			setForm(DEFAULT_FORM_STATE);
			setFieldErrors(createEmptyFieldErrors());
			setStep('details');
		} catch (error) {
			setSubmitError(
				error instanceof Error
					? error.message
					: __('Location could not be created.', 'minimal-map')
			);
		} finally {
			setSubmitting(false);
		}
	};

	return {
		fieldErrors,
		form,
		headerAction: enabled ? (
			<Button
				variant="primary"
				onClick={openDialog}
				icon={<Plus size={18} strokeWidth={2} />}
				iconPosition="left"
			>
				{__('Add location', 'minimal-map')}
			</Button>
		) : null,
		isDialogOpen,
		isLoading,
		isSubmitting,
		loadError,
		locations,
		onCancel,
		onChangeFormValue,
		onChangeView: (nextView) => setView(nextView),
		onConfirm,
		paginatedLocations,
		setStep,
		submitError,
		step,
		totalPages,
		view,
	};
}

function useLocationFieldsForTable(): Field<LocationRecord>[] {
	return useLocationFields();
}

export default function LocationsView({ controller }: { controller: LocationsController }) {
	const fields = useLocationFieldsForTable();

	return (
		<>
			{controller.loadError && (
				<Notice className="minimal-map-admin__locations-notice" status="error" isDismissible={false}>
					{controller.loadError}
				</Notice>
			)}
			{controller.isLoading ? (
				<div className="minimal-map-admin__locations-state minimal-map-admin__locations-state--loading">
					<Spinner />
				</div>
			) : controller.locations.length === 0 ? (
				<div className="minimal-map-admin__locations-empty">
					<h3>{__('No locations yet', 'minimal-map')}</h3>
					<p>{__('Use the “Add location” button to create your first location.', 'minimal-map')}</p>
				</div>
			) : (
				<div className="minimal-map-admin__locations-table-wrap">
					<DataViews
						data={controller.paginatedLocations}
						defaultLayouts={{ table: {} }}
						fields={fields}
						getItemId={(item: LocationRecord) => `${item.id}`}
						paginationInfo={{
							totalItems: controller.locations.length,
							totalPages: controller.totalPages,
						}}
						view={controller.view}
						onChangeView={(nextView: View) => controller.onChangeView(nextView as ViewTable)}
					>
						<DataViews.Layout className="minimal-map-admin__locations-dataviews-layout" />
						<DataViews.Footer />
					</DataViews>
				</div>
			)}
			{controller.isDialogOpen && (
				<ConfirmDialog
					confirmButtonText={controller.step === 'details' ? __('Next', 'minimal-map') : __('Add location', 'minimal-map')}
					cancelButtonText={__('Cancel', 'minimal-map')}
					isBusy={controller.isSubmitting}
					isOpen={controller.isDialogOpen}
					onCancel={controller.onCancel}
					onConfirm={() => {
						void controller.onConfirm();
					}}
					title={__('Add location', 'minimal-map')}
				>
					<div
						className="minimal-map-admin__location-dialog"
						onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
							if (!shouldHandleDialogEnter(event)) {
								return;
							}

							event.preventDefault();
							void controller.onConfirm();
						}}
					>
						{controller.submitError && (
							<Notice status="error" isDismissible={false}>
								{controller.submitError}
							</Notice>
						)}
						<LocationDialogFields
							fieldErrors={controller.fieldErrors}
							form={controller.form}
							onChange={controller.onChangeFormValue}
							step={controller.step}
						/>
					</div>
				</ConfirmDialog>
			)}
		</>
	);
}
