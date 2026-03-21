<?php
/**
 * Shared plugin configuration.
 *
 * @package Minimal_Map
 */

namespace MinimalMap;

use MinimalMap\Collections\Collection_Post_Type;
use MinimalMap\Logos\Logo_Post_Type;
use MinimalMap\Locations\Location_Post_Type;
use MinimalMap\Markers\Marker_Post_Type;
use MinimalMap\Tags\Tag_Taxonomy;
use MinimalMap\Rest\Frontend_Geocode_Route;
use MinimalMap\Rest\Geocode_Route;
use MinimalMap\Rest\Locations_Route;
use MinimalMap\Rest\Styles_Route;
use WP_Post;

/**
 * Provides shared config for PHP and JS consumers.
 */
class Config {
	/**
	 * Default style preset slug.
	 */
	const DEFAULT_STYLE_PRESET = 'liberty';
	const EMBED_PAYLOAD_VERSION = 1;

	/**
	 * Allowed CSS units for map height.
	 *
	 * @var string[]
	 */
	const HEIGHT_UNITS = array( 'px', 'em', 'rem', '%', 'vh', 'vw' );
	const ZOOM_CONTROLS_POSITIONS = array( 'top-right', 'top-left', 'bottom-right', 'bottom-left' );
	const ZOOM_CONTROLS_ICONS     = array( 'plus', 'plus-circle', 'plus-circle-filled', 'line-solid', 'separator', 'close-small' );

	/**
	 * Get the available style presets.
	 *
	 * @return array<string, array<string, string>>
	 */
	public function get_style_presets() {
		return array(
			'liberty'  => array(
				'label'     => __( 'Liberty', 'minimal-map' ),
				'style_url' => 'https://tiles.openfreemap.org/styles/liberty',
			),
			'bright'   => array(
				'label'     => __( 'Bright', 'minimal-map' ),
				'style_url' => 'https://tiles.openfreemap.org/styles/bright',
			),
			'positron' => array(
				'label'     => __( 'Positron', 'minimal-map' ),
				'style_url' => 'https://tiles.openfreemap.org/styles/positron',
			),
		);
	}

	/**
	 * Get default block attributes.
	 *
	 * @return array<string, mixed>
	 */
	public function get_default_block_attributes() {
		$font_family = $this->get_default_font_family();

		return array(
			'centerLat'        => 52.517,
			'centerLng'        => 13.388,
			'zoom'             => 9.5,
			'collectionId'     => 0,
			'height'           => 420,
			'heightUnit'       => 'px',
			'stylePreset'      => self::DEFAULT_STYLE_PRESET,
			'fontFamily'       => $font_family,
			'borderRadius'     => '',
			'showZoomControls' => true,
			'allowSearch'      => true,
			'enableLiveLocationSearch' => false,
			'enableLiveLocationMap' => false,
			'enableCategoryFilter' => false,
			'enableOpenedFilter' => false,
			'googleMapsNavigation' => false,
			'inMapLocationCard' => false,
			'scrollZoom'       => false,
			'mobileTwoFingerZoom' => false,
			'cooperativeGestures' => true,
			'zoomControlsPosition'        => 'top-right',
			'zoomControlsPadding'         => array(
				'top'    => '8px',
				'right'  => '8px',
				'bottom' => '8px',
				'left'   => '8px',
			),
			'zoomControlsOuterMargin'     => array(
				'top'    => '16px',
				'right'  => '16px',
				'bottom' => '16px',
				'left'   => '16px',
			),
			'zoomControlsBackgroundColor' => '#ffffff',
			'zoomControlsIconColor'       => '#1e1e1e',
			'zoomControlsBorderRadius'    => '2px',
			'zoomControlsBorderColor'     => '#dcdcde',
			'zoomControlsBorderWidth'     => '1px',
			'zoomControlsPlusIcon'        => 'plus',
			'zoomControlsMinusIcon'       => 'line-solid',
			'searchPanelBackgroundPrimary'   => '#ffffff',
			'searchPanelBackgroundSecondary' => '#f0f0f1',
			'searchPanelBackgroundHover'     => '#f8f8f8',
			'searchPanelForegroundPrimary'   => '#1e1e1e',
			'searchPanelForegroundSecondary' => '#1e1e1e',
			'searchPanelOuterMargin'         => array(
				'top'    => '24px',
				'right'  => '24px',
				'bottom' => '24px',
				'left'   => '24px',
			),
			'searchPanelBorderRadiusInput'  => '10px',
			'searchPanelBorderRadiusCard'   => '2px',
			'searchPanelCardGap'            => '12px',
			'searchPanelWidth'              => '320px',
			'googleMapsButtonPadding'       => array(
				'top'    => '5px',
				'right'  => '8px',
				'bottom' => '5px',
				'left'   => '8px',
			),
			'googleMapsButtonBackgroundColor' => '#f0f0f1',
			'googleMapsButtonForegroundColor' => '#1e1e1e',
			'googleMapsButtonBorderRadius'    => '18px',
			'googleMapsButtonShowIcon'        => true,
			'openingHoursOpenColor'          => '#1a7f37',
			'openingHoursClosedColor'        => '#b32d2e',
			'openingHoursSoonColor'          => '#d97706',
			'creditsPadding'             => array(
				'top'    => '4px',
				'right'  => '8px',
				'bottom' => '4px',
				'left'   => '8px',
			),
			'creditsOuterMargin'         => array(
				'top'    => '16px',
				'right'  => '16px',
				'bottom' => '16px',
				'left'   => '16px',
			),
			'creditsBackgroundColor'     => '#ffffff',
			'creditsForegroundColor'     => '#1e1e1e',
			'creditsBorderRadius'        => '999px',
			'styleThemeSlug'              => 'default',
			'_isPreview'                  => false,
		);
	}

	/**
	 * Normalize incoming block attributes.
	 *
	 * @param array<string, mixed> $attributes Raw attributes.
	 * @param bool                 $include_locations Whether to include the resolved locations in the result.
	 * @return array<string, mixed>
	 */
	public function normalize_block_attributes( $attributes, $include_locations = true ) {
		$defaults   = $this->get_default_block_attributes();
		$attributes = wp_parse_args( $attributes, $defaults );
		$presets    = $this->get_style_presets();
		$preset     = isset( $attributes['stylePreset'] ) ? sanitize_key( (string) $attributes['stylePreset'] ) : self::DEFAULT_STYLE_PRESET;

		if ( ! isset( $presets[ $preset ] ) ) {
			$preset = self::DEFAULT_STYLE_PRESET;
		}

		$center_lat = isset( $attributes['centerLat'] ) ? (float) $attributes['centerLat'] : 0.0;
		$center_lng = isset( $attributes['centerLng'] ) ? (float) $attributes['centerLng'] : 0.0;
		$zoom       = isset( $attributes['zoom'] ) ? (float) $attributes['zoom'] : 0.0;
		$collection_id = isset( $attributes['collectionId'] ) ? absint( $attributes['collectionId'] ) : 0;
		$height     = isset( $attributes['height'] ) ? (float) $attributes['height'] : 0.0;
		$height     = $height > 0 ? $height : (float) $defaults['height'];
		$height_unit = isset( $attributes['heightUnit'] ) ? sanitize_text_field( (string) $attributes['heightUnit'] ) : 'px';
		$height_unit = in_array( $height_unit, self::HEIGHT_UNITS, true ) ? $height_unit : 'px';
		$height_mobile = isset( $attributes['heightMobile'] ) ? (float) $attributes['heightMobile'] : 0.0;
		$height_mobile = $height_mobile > 0 ? $height_mobile : null;
		$height_mobile_unit = isset( $attributes['heightMobileUnit'] ) ? sanitize_text_field( (string) $attributes['heightMobileUnit'] ) : $height_unit;
		$height_mobile_unit = in_array( $height_mobile_unit, self::HEIGHT_UNITS, true ) ? $height_mobile_unit : $height_unit;
		$height_css_value = $this->format_dimension_value( $height, $height_unit );
		$height_mobile_css_value = null !== $height_mobile
			? $this->format_dimension_value( $height_mobile, $height_mobile_unit )
			: $height_css_value;

		$locations = array();
		if ( $include_locations ) {
			$locations = $collection_id > 0
				? $this->get_map_locations( $this->get_collection_location_ids( $collection_id ) )
				: $this->get_map_locations();
		}

		$style_theme_slug = isset( $attributes['styleThemeSlug'] ) ? sanitize_key( (string) $attributes['styleThemeSlug'] ) : 'default';
		$style_theme      = array();

		if ( 'positron' === $preset ) {
			$styles_route = new Styles_Route();
			$themes       = $styles_route->get_themes();
			if ( isset( $themes[ $style_theme_slug ]['colors'] ) ) {
				$style_theme = $themes[ $style_theme_slug ]['colors'];
			} elseif ( isset( $themes['default']['colors'] ) ) {
				$style_theme = $themes['default']['colors'];
			}
		}

		$font_family = $this->sanitize_font_family( $attributes['fontFamily'] ?? '', $defaults['fontFamily'] );
		$border_radius = $this->sanitize_border_radius_value(
			$attributes['borderRadius'] ?? $attributes['style']['border']['radius'] ?? '',
			$defaults['borderRadius']
		);

		return array(
			'centerLat'        => max( -90, min( 90, $center_lat ) ),
			'centerLng'        => max( -180, min( 180, $center_lng ) ),
			'zoom'             => max( 0, min( 22, $zoom ) ),
			'collectionId'     => $collection_id,
			'height'           => $height,
			'heightUnit'       => $height_unit,
			'heightMobile'     => $height_mobile,
			'heightMobileUnit' => null !== $height_mobile ? $height_mobile_unit : null,
			'heightCssValue'   => $height_css_value,
			'heightMobileCssValue' => $height_mobile_css_value,
			'stylePreset'      => $preset,
			'styleUrl'         => $presets[ $preset ]['style_url'],
			'styleTheme'       => $style_theme,
			'styleThemeSlug'   => $style_theme_slug,
			'fontFamily'       => $font_family,
			'borderRadius'     => $border_radius,
			'showZoomControls' => ! empty( $attributes['showZoomControls'] ),
			'allowSearch'      => ! empty( $attributes['allowSearch'] ),
			'enableLiveLocationSearch' => ! empty( $attributes['enableLiveLocationSearch'] ),
			'enableLiveLocationMap' => ! empty( $attributes['enableLiveLocationMap'] ),
			'enableCategoryFilter' => ! empty( $attributes['enableCategoryFilter'] ),
			'enableOpenedFilter' => ! empty( $attributes['enableOpenedFilter'] ),
			'googleMapsNavigation' => ! empty( $attributes['googleMapsNavigation'] ),
			'inMapLocationCard' => ! empty( $attributes['inMapLocationCard'] ),
			'scrollZoom'       => ! empty( $attributes['scrollZoom'] ),
			'mobileTwoFingerZoom' => ! empty( $attributes['mobileTwoFingerZoom'] ),
			'cooperativeGestures' => ! empty( $attributes['cooperativeGestures'] ),
			'zoomControlsPosition'        => $this->sanitize_zoom_controls_position( $attributes['zoomControlsPosition'] ?? '' ),
			'zoomControlsPadding'         => $this->sanitize_box_value( $attributes['zoomControlsPadding'] ?? array(), $defaults['zoomControlsPadding'] ),
			'zoomControlsOuterMargin'     => $this->sanitize_box_value( $attributes['zoomControlsOuterMargin'] ?? array(), $defaults['zoomControlsOuterMargin'] ),
			'zoomControlsBackgroundColor' => $this->sanitize_color( $attributes['zoomControlsBackgroundColor'] ?? '', $defaults['zoomControlsBackgroundColor'] ),
			'zoomControlsIconColor'       => $this->sanitize_color( $attributes['zoomControlsIconColor'] ?? '', $defaults['zoomControlsIconColor'] ),
			'zoomControlsBorderRadius'    => $this->sanitize_border_radius_value( $attributes['zoomControlsBorderRadius'] ?? '', $defaults['zoomControlsBorderRadius'] ),
			'zoomControlsBorderColor'     => $this->sanitize_color( $attributes['zoomControlsBorderColor'] ?? '', $defaults['zoomControlsBorderColor'] ),
			'zoomControlsBorderWidth'     => $this->sanitize_dimension_value( $attributes['zoomControlsBorderWidth'] ?? '', $defaults['zoomControlsBorderWidth'] ),
			'zoomControlsPlusIcon'        => $this->sanitize_zoom_controls_icon( $attributes['zoomControlsPlusIcon'] ?? '', $defaults['zoomControlsPlusIcon'] ),
			'zoomControlsMinusIcon'       => $this->sanitize_zoom_controls_icon( $attributes['zoomControlsMinusIcon'] ?? '', $defaults['zoomControlsMinusIcon'] ),
			'searchPanelBackgroundPrimary'   => $this->sanitize_color( $attributes['searchPanelBackgroundPrimary'] ?? '', $defaults['searchPanelBackgroundPrimary'] ),
			'searchPanelBackgroundSecondary' => $this->sanitize_color( $attributes['searchPanelBackgroundSecondary'] ?? '', $defaults['searchPanelBackgroundSecondary'] ),
			'searchPanelBackgroundHover'     => $this->sanitize_color( $attributes['searchPanelBackgroundHover'] ?? '', $defaults['searchPanelBackgroundHover'] ),
			'searchPanelForegroundPrimary'   => $this->sanitize_color( $attributes['searchPanelForegroundPrimary'] ?? '', $defaults['searchPanelForegroundPrimary'] ),
			'searchPanelForegroundSecondary' => $this->sanitize_color( $attributes['searchPanelForegroundSecondary'] ?? '', $defaults['searchPanelForegroundSecondary'] ),
			'searchPanelOuterMargin'         => $this->sanitize_box_value( $attributes['searchPanelOuterMargin'] ?? array(), $defaults['searchPanelOuterMargin'] ),
			'searchPanelBorderRadiusInput'   => $this->sanitize_border_radius_value( $attributes['searchPanelBorderRadiusInput'] ?? '', $defaults['searchPanelBorderRadiusInput'] ),
			'searchPanelBorderRadiusCard'    => $this->sanitize_border_radius_value( $attributes['searchPanelBorderRadiusCard'] ?? '', $defaults['searchPanelBorderRadiusCard'] ),
			'searchPanelCardGap'             => $this->sanitize_dimension_value( $attributes['searchPanelCardGap'] ?? '', $defaults['searchPanelCardGap'] ),
			'searchPanelWidth'               => $this->sanitize_dimension_value( $attributes['searchPanelWidth'] ?? '', $defaults['searchPanelWidth'] ),
			'googleMapsButtonPadding'        => $this->sanitize_box_value( $attributes['googleMapsButtonPadding'] ?? array(), $defaults['googleMapsButtonPadding'] ),
			'googleMapsButtonBackgroundColor' => $this->sanitize_color( $attributes['googleMapsButtonBackgroundColor'] ?? '', $defaults['googleMapsButtonBackgroundColor'] ),
			'googleMapsButtonForegroundColor' => $this->sanitize_color( $attributes['googleMapsButtonForegroundColor'] ?? '', $defaults['googleMapsButtonForegroundColor'] ),
			'googleMapsButtonBorderRadius'    => $this->sanitize_border_radius_value( $attributes['googleMapsButtonBorderRadius'] ?? '', $defaults['googleMapsButtonBorderRadius'] ),
			'googleMapsButtonShowIcon'        => ! empty( $attributes['googleMapsButtonShowIcon'] ),
			'openingHoursOpenColor'          => $this->sanitize_color( $attributes['openingHoursOpenColor'] ?? '', $defaults['openingHoursOpenColor'] ),
			'openingHoursClosedColor'        => $this->sanitize_color( $attributes['openingHoursClosedColor'] ?? '', $defaults['openingHoursClosedColor'] ),
			'openingHoursSoonColor'          => $this->sanitize_color( $attributes['openingHoursSoonColor'] ?? '', $defaults['openingHoursSoonColor'] ),
			'creditsPadding'             => $this->sanitize_box_value( $attributes['creditsPadding'] ?? array(), $defaults['creditsPadding'] ),
			'creditsOuterMargin'         => $this->sanitize_box_value( $attributes['creditsOuterMargin'] ?? array(), $defaults['creditsOuterMargin'] ),
			'creditsBackgroundColor'     => $this->sanitize_color( $attributes['creditsBackgroundColor'] ?? '', $defaults['creditsBackgroundColor'] ),
			'creditsForegroundColor'     => $this->sanitize_color( $attributes['creditsForegroundColor'] ?? '', $defaults['creditsForegroundColor'] ),
			'creditsBorderRadius'        => $this->sanitize_border_radius_value( $attributes['creditsBorderRadius'] ?? '', $defaults['creditsBorderRadius'] ),
			'locations'       => $locations,
			'fallbackMessage'  => __( 'Map preview unavailable because this browser does not support WebGL.', 'minimal-map' ),
		);
	}

	/**
	 * Build client configuration for block scripts.
	 *
	 * @param bool $include_all_locations Whether to include the full locations and collections list.
	 * @return array<string, mixed>
	 */
	public function get_client_config( $include_all_locations = true ) {
		$styles_route = new Styles_Route();

		$config = array(
			'defaults'      => $this->get_default_block_attributes(),
			'heightUnits'   => self::HEIGHT_UNITS,
			'stylePresets'  => $this->get_style_presets(),
			'styleThemes'   => array_values( $styles_route->get_themes() ),
			'frontendGeocodePath' => Frontend_Geocode_Route::get_rest_path(),
			'locationsPath' => Locations_Route::get_rest_path(),
			'locationsUrl' => get_rest_url( null, Locations_Route::REST_NAMESPACE . Locations_Route::REST_ROUTE ),
			'siteTimezone' => $this->get_site_timezone_string(),
			'siteLocale' => str_replace( '_', '-', get_locale() ),
			'messages'      => array(
				'fallback' => __( 'Map preview unavailable because this browser does not support WebGL.', 'minimal-map' ),
			),
			'embedBaseUrl' => $this->get_embed_base_url(),
			'previewImageUrl' => plugins_url( 'assets/preview.png', MINIMAL_MAP_FILE ),
		);

		if ( $include_all_locations ) {
			$config['locations']   = $this->get_map_locations();
			$config['collections'] = $this->get_map_collections();
		} else {
			$config['locations']   = array();
			$config['collections'] = array();
		}

		return $config;
	}

	/**
	 * Get optimized map data with deduplicated markers and logos.
	 *
	 * @param int|null $collection_id Optional collection filter.
	 * @return array<string, mixed>
	 */
	public function get_optimized_map_data( $collection_id = null ) {
		$location_ids = null;
		if ( $collection_id > 0 ) {
			$location_ids = $this->get_collection_location_ids( $collection_id );
		}

		$locations = $this->get_map_locations_indexed();
		if ( is_array( $location_ids ) ) {
			$locations_list = $this->filter_locations_by_ids( $locations, $location_ids );
		} else {
			$locations_list = array_values( $locations );
		}

		$markers = array();
		$logos   = array();

		foreach ( $locations_list as &$location ) {
			if ( isset( $location['markerContent'] ) ) {
				$content = $location['markerContent'];
				$hash    = md5( $content );
				$markers[ $hash ] = $content;
				$location['markerId'] = $hash;
				unset( $location['markerContent'] );
			}

			if ( isset( $location['logo'] ) && is_array( $location['logo'] ) ) {
				$logo = $location['logo'];
				if ( isset( $logo['content'] ) ) {
					$content = $logo['content'];
					$hash    = md5( $content );
					$logos[ $hash ] = $content;
					$location['logo'] = array(
						'id'     => $logo['id'],
						'title'  => $logo['title'],
						'logoId' => $hash,
					);
				}
			}
		}

		return array(
			'locations' => $locations_list,
			'markers'   => $markers,
			'logos'     => $logos,
		);
	}

	/**
	 * Get the canonical public iframe endpoint URL.
	 *
	 * @return string
	 */
	public function get_embed_base_url() {
		return add_query_arg(
			Iframe_Endpoint::QUERY_VAR,
			'1',
			home_url( '/' )
		);
	}

	/**
	 * Decode one embed payload and return normalized block config.
	 *
	 * @param string $encoded_payload Base64url-encoded JSON payload.
	 * @return array<string, mixed>|\WP_Error
	 */
	public function normalize_embed_payload( $encoded_payload ) {
		if ( ! is_string( $encoded_payload ) || '' === $encoded_payload ) {
			return new \WP_Error(
				'minimal_map_invalid_embed_payload',
				__( 'The map embed configuration is missing or invalid.', 'minimal-map' )
			);
		}

		$decoded_payload = $this->decode_embed_payload_json( $encoded_payload );

		if ( ! is_array( $decoded_payload ) ) {
			return new \WP_Error(
				'minimal_map_invalid_embed_payload',
				__( 'The map embed configuration is missing or invalid.', 'minimal-map' )
			);
		}

		$version = isset( $decoded_payload['v'] ) ? (int) $decoded_payload['v'] : 0;

		if ( self::EMBED_PAYLOAD_VERSION !== $version || ! isset( $decoded_payload['attributes'] ) || ! is_array( $decoded_payload['attributes'] ) ) {
			return new \WP_Error(
				'minimal_map_invalid_embed_payload',
				__( 'The map embed configuration is missing or invalid.', 'minimal-map' )
			);
		}

		return $this->normalize_block_attributes( $decoded_payload['attributes'], false );
	}

	/**
	 * Get all published map locations with valid coordinates.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	public function get_map_locations( $location_ids = null ) {
		$locations = $this->get_map_locations_indexed();

		if ( is_array( $location_ids ) ) {
			return $this->filter_locations_by_ids( $locations, $location_ids );
		}

		return array_values( $locations );
	}

	/**
	 * Get all published collections with their valid assigned points.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	public function get_map_collections() {
		$posts = get_posts(
			array(
				'post_status'            => 'publish',
				'post_type'              => Collection_Post_Type::POST_TYPE,
				'posts_per_page'         => -1,
				'orderby'                => 'title',
				'order'                  => 'ASC',
				'no_found_rows'          => true,
				'update_post_meta_cache' => true,
				'update_post_term_cache' => false,
			)
		);

		$collections = array();
		$locations   = $this->get_map_locations_indexed();

		foreach ( $posts as $post ) {
			if ( ! $post instanceof WP_Post ) {
				continue;
			}

			$collections[] = array(
				'id'        => $post->ID,
				'title'     => $this->get_payload_post_title( $post ),
				'locations' => $this->filter_locations_by_ids(
					$locations,
					$this->normalize_location_ids(
						get_post_meta( $post->ID, Collection_Post_Type::LOCATION_IDS_META_KEY, true )
					)
				),
			);
		}

		return $collections;
	}

	/**
	 * Get all published map locations with valid coordinates keyed by post id.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	private function get_map_locations_indexed() {
		$posts = get_posts(
			array(
				'post_status'            => 'publish',
				'post_type'              => Location_Post_Type::POST_TYPE,
				'posts_per_page'         => -1,
				'orderby'                => 'menu_order title',
				'order'                  => 'ASC',
				'no_found_rows'          => true,
				'update_post_meta_cache' => true,
				'update_post_term_cache' => false,
			)
		);

		$locations = array();

		foreach ( $posts as $post ) {
			if ( ! $post instanceof WP_Post ) {
				continue;
			}

			if ( rest_sanitize_boolean( get_post_meta( $post->ID, 'is_hidden', true ) ) ) {
				continue;
			}

			$lat = get_post_meta( $post->ID, 'latitude', true );
			$lng = get_post_meta( $post->ID, 'longitude', true );

			$normalized = $this->normalize_map_location( $lat, $lng );

			if ( null === $normalized ) {
				continue;
			}

			$location = array(
				'id'           => (int) $post->ID,
				'title'        => $this->get_payload_post_title( $post ),
				'lat'          => $normalized['lat'],
				'lng'          => $normalized['lng'],
				'telephone'    => (string) get_post_meta( $post->ID, 'telephone', true ),
				'email'        => (string) get_post_meta( $post->ID, 'email', true ),
				'website'      => (string) get_post_meta( $post->ID, 'website', true ),
				'street'       => (string) get_post_meta( $post->ID, 'street', true ),
				'house_number' => (string) get_post_meta( $post->ID, 'house_number', true ),
				'postal_code'  => (string) get_post_meta( $post->ID, 'postal_code', true ),
				'city'         => (string) get_post_meta( $post->ID, 'city', true ),
				'state'        => (string) get_post_meta( $post->ID, 'state', true ),
				'country'      => (string) get_post_meta( $post->ID, 'country', true ),
				'opening_hours' => get_post_meta( $post->ID, 'opening_hours', true ),
				'opening_hours_notes' => (string) get_post_meta( $post->ID, 'opening_hours_notes', true ),
			);

			$location_tags = $this->get_location_tags( $post->ID );

			if ( ! empty( $location_tags ) ) {
				$location['tags'] = $location_tags;
			}

			$location_logo = $this->get_location_logo( $post->ID );

			if ( ! empty( $location_logo ) ) {
				$location['logo'] = $location_logo;
			}

			$marker_content = $this->get_location_marker_content( $post->ID );

			if ( '' !== $marker_content ) {
				$location['markerContent'] = $marker_content;
			}

			$locations[ $post->ID ] = $location;
		}

		return $locations;
	}

	/**
	 * Get the configured site timezone string for frontend time formatting.
	 *
	 * @return string
	 */
	private function get_site_timezone_string() {
		$timezone = wp_timezone_string();

		if ( '' !== $timezone ) {
			return $timezone;
		}

		$site_timezone = wp_timezone();

		if ( $site_timezone instanceof \DateTimeZone ) {
			return $site_timezone->getName();
		}

		return 'UTC';
	}

	/**
	 * Get the effective global font family configured for the site.
	 *
	 * @return string
	 */
	private function get_default_font_family() {
		$font_family = '';

		if ( function_exists( 'wp_get_global_styles' ) ) {
			$global_style_font_family = wp_get_global_styles(
				array( 'typography', 'fontFamily' ),
				array(
					'transforms' => array( 'resolve-variables' ),
				)
			);

			if ( is_string( $global_style_font_family ) ) {
				$font_family = $global_style_font_family;
			}
		}

		if ( '' === $font_family && function_exists( 'wp_get_global_settings' ) ) {
			$global_settings_font_family = wp_get_global_settings( array( 'typography', 'fontFamily' ) );

			if ( is_string( $global_settings_font_family ) ) {
				$font_family = $global_settings_font_family;
			}
		}

		return $this->sanitize_font_family( $font_family, '' );
	}

	/**
	 * Get normalized location ids assigned to one collection.
	 *
	 * @param int $collection_id Collection post id.
	 * @return int[]
	 */
	private function get_collection_location_ids( $collection_id ) {
		$collection = get_post( $collection_id );

		if ( ! $collection instanceof WP_Post ) {
			return array();
		}

		if ( Collection_Post_Type::POST_TYPE !== $collection->post_type || 'publish' !== $collection->post_status ) {
			return array();
		}

		return $this->normalize_location_ids(
			get_post_meta( $collection_id, Collection_Post_Type::LOCATION_IDS_META_KEY, true )
		);
	}

	/**
	 * Filter a location map by ordered location ids.
	 *
	 * @param array<int, array<string, mixed>> $locations Indexed locations.
	 * @param int[]                            $location_ids Ordered location ids.
	 * @return array<int, array<string, mixed>>
	 */
	private function filter_locations_by_ids( $locations, $location_ids ) {
		$normalized_ids = $this->normalize_location_ids( $location_ids );
		$filtered       = array();

		foreach ( $normalized_ids as $location_id ) {
			if ( isset( $locations[ $location_id ] ) ) {
				$filtered[] = $locations[ $location_id ];
			}
		}

		return $filtered;
	}

	/**
	 * Normalize a list of location ids into unique positive integers.
	 *
	 * @param mixed $location_ids Raw location ids.
	 * @return int[]
	 */
	private function normalize_location_ids( $location_ids ) {
		if ( ! is_array( $location_ids ) ) {
			return array();
		}

		$location_ids = array_map( 'absint', $location_ids );
		$location_ids = array_filter(
			$location_ids,
			static function ( $location_id ) {
				return $location_id > 0;
			}
		);

		return array_values( array_unique( $location_ids ) );
	}

	/**
	 * Build client configuration for the admin app.
	 *
	 * @return array<string, mixed>
	 */
	public function get_admin_app_config() {
		$sections = array();
		$map_config = $this->get_client_config( true );
		$map_config['defaults']['mobileTwoFingerZoom'] = true;
		$map_config['defaults']['cooperativeGestures'] = true;

		foreach ( Admin\Admin_Menu::get_sections() as $view => $section ) {
			$sections[] = array(
				'view'        => $view,
				'title'       => $section['title'],
				'description' => $section['description'],
				'url'         => Admin\Admin_Menu::get_view_url( $view ),
			);
		}

		return array(
			'currentView'    => Admin\Admin_Menu::get_current_view(),
			'sections'       => $sections,
			'stats'          => array(
				'locations'   => Location_Post_Type::get_location_count(),
				'collections' => Collection_Post_Type::get_collection_count(),
				'logos'       => Logo_Post_Type::get_logo_count(),
				'markers'     => Marker_Post_Type::get_marker_count(),
				'tags'        => Tag_Taxonomy::get_tag_count(),
			),
			'mapConfig'      => $map_config,
			'locationsConfig' => array(
				'nonce'       => wp_create_nonce( 'wp_rest' ),
				'restBase'    => Location_Post_Type::REST_BASE,
				'restPath'    => Location_Post_Type::get_rest_path(),
				'geocodePath' => Geocode_Route::get_rest_path(),
			),
			'collectionsConfig' => array(
				'nonce'    => wp_create_nonce( 'wp_rest' ),
				'restBase' => Collection_Post_Type::REST_BASE,
				'restPath' => Collection_Post_Type::get_rest_path(),
			),
			'markersConfig' => array(
				'nonce'    => wp_create_nonce( 'wp_rest' ),
				'restBase' => Marker_Post_Type::REST_BASE,
				'restPath' => Marker_Post_Type::get_rest_path(),
			),
			'logosConfig' => array(
				'nonce'    => wp_create_nonce( 'wp_rest' ),
				'restBase' => Logo_Post_Type::REST_BASE,
				'restPath' => Logo_Post_Type::get_rest_path(),
			),
			'tagsConfig' => array(
				'nonce'    => wp_create_nonce( 'wp_rest' ),
				'restBase' => Tag_Taxonomy::REST_BASE,
				'restPath' => Tag_Taxonomy::get_rest_path(),
			),
			'stylesConfig' => array(
				'nonce'    => wp_create_nonce( 'wp_rest' ),
				'restBase' => 'styles',
				'restPath' => Styles_Route::get_rest_path(),
			),
		);
	}

	/**
	 * Convert a numeric value and CSS unit into a CSS-ready dimension string.
	 *
	 * @param float  $value Numeric value.
	 * @param string $unit  CSS unit.
	 * @return string
	 */
	private function format_dimension_value( $value, $unit ) {
		$formatted = number_format( $value, 4, '.', '' );
		$formatted = rtrim( rtrim( $formatted, '0' ), '.' );

		if ( '' === $formatted ) {
			$formatted = '0';
		}

		return $formatted . $unit;
	}

	/**
	 * Decode one base64url JSON payload.
	 *
	 * @param string $encoded_payload Base64url-encoded JSON payload.
	 * @return array<string, mixed>|null
	 */
	private function decode_embed_payload_json( $encoded_payload ) {
		$normalized = strtr( trim( $encoded_payload ), '-_', '+/' );
		$padding    = strlen( $normalized ) % 4;

		if ( 0 !== $padding ) {
			$normalized .= str_repeat( '=', 4 - $padding );
		}

		$decoded = base64_decode( $normalized, true );

		if ( false === $decoded ) {
			return null;
		}

		$payload = json_decode( $decoded, true );

		return is_array( $payload ) ? $payload : null;
	}

	/**
	 * Normalize one pair of map coordinates.
	 *
	 * @param mixed $latitude Raw latitude.
	 * @param mixed $longitude Raw longitude.
	 * @return array<string, float>|null
	 */
	private function normalize_map_location( $latitude, $longitude ) {
		if ( '' === $latitude || '' === $longitude ) {
			return null;
		}

		if ( ! is_numeric( $latitude ) || ! is_numeric( $longitude ) ) {
			return null;
		}

		$lat = (float) $latitude;
		$lng = (float) $longitude;

		if ( $lat < -90 || $lat > 90 || $lng < -180 || $lng > 180 ) {
			return null;
		}

		return array(
			'lat' => $lat,
			'lng' => $lng,
		);
	}

	/**
	 * Resolve the assigned marker SVG content for one location.
	 *
	 * @param int $location_id Location post id.
	 * @return string
	 */
	private function get_location_marker_content( $location_id ) {
		$marker_id = absint( get_post_meta( $location_id, 'marker_id', true ) );

		if ( $marker_id <= 0 ) {
			return '';
		}

		$marker_post = get_post( $marker_id );

		if ( ! $marker_post instanceof WP_Post ) {
			return '';
		}

		if ( Marker_Post_Type::POST_TYPE !== $marker_post->post_type || 'publish' !== $marker_post->post_status ) {
			return '';
		}

		$content = trim( (string) $marker_post->post_content );

		return '' !== $content ? $content : '';
	}

	/**
	 * Resolve assigned tags for one location.
	 *
	 * @param int $location_id Location post id.
	 * @return array<int, array<string, mixed>>
	 */
	private function get_location_tags( $location_id ) {
		$terms = get_the_terms( $location_id, Tag_Taxonomy::TAXONOMY );

		if ( empty( $terms ) || is_wp_error( $terms ) ) {
			return array();
		}

		usort(
			$terms,
			static function ( $left, $right ) {
				return strcmp( $left->name, $right->name );
			}
		);

		return array_values(
			array_map(
				static function ( $term ) {
					$background_color = (string) get_term_meta( $term->term_id, 'background_color', true );
					$foreground_color = (string) get_term_meta( $term->term_id, 'foreground_color', true );

					return array(
						'id'               => (int) $term->term_id,
						'name'             => (string) $term->name,
						'background_color' => '' !== $background_color ? $background_color : '#000000',
						'foreground_color' => '' !== $foreground_color ? $foreground_color : '#ffffff',
					);
				},
				$terms
			)
		);
	}

	/**
	 * Resolve the assigned logo for one location.
	 *
	 * @param int $location_id Location post id.
	 * @return array<string, mixed>
	 */
	private function get_location_logo( $location_id ) {
		$logo_id = absint( get_post_meta( $location_id, 'logo_id', true ) );

		if ( $logo_id <= 0 ) {
			return array();
		}

		$logo_post = get_post( $logo_id );

		if ( ! $logo_post instanceof WP_Post ) {
			return array();
		}

		if ( Logo_Post_Type::POST_TYPE !== $logo_post->post_type || 'publish' !== $logo_post->post_status ) {
			return array();
		}

		$content = trim( (string) $logo_post->post_content );

		if ( '' === $content ) {
			return array();
		}

		return array(
			'id'      => $logo_post->ID,
			'title'   => $this->get_payload_post_title( $logo_post ),
			'content' => $content,
		);
	}

	/**
	 * Get one frontend-safe raw post title for JSON payloads.
	 *
	 * Avoid `get_the_title()` here because it runs display formatting such as
	 * `wptexturize()`, which can introduce HTML entities like `&#8217;` into the
	 * API payload. The frontend needs the original text content instead.
	 *
	 * @param WP_Post $post Post object.
	 * @return string
	 */
	private function get_payload_post_title( WP_Post $post ) {
		$charset = get_bloginfo( 'charset' );

		if ( ! is_string( $charset ) || '' === $charset ) {
			$charset = 'UTF-8';
		}

		return html_entity_decode( (string) $post->post_title, ENT_QUOTES | ENT_HTML5, $charset );
	}

	/**
	 * Sanitize one CSS dimension value.
	 *
	 * @param mixed  $value Raw value.
	 * @param string $fallback Fallback value.
	 * @return string
	 */
	private function sanitize_dimension_value( $value, $fallback ) {
		$value = is_string( $value ) ? trim( $value ) : '';

		if ( '0' === $value ) {
			return '0px';
		}

		if ( preg_match( '/^\d*\.?\d+(px|em|rem|%|vh|vw)$/i', $value ) ) {
			return $value;
		}

		return $fallback;
	}

	/**
	 * Sanitize a border radius value that may contain up to four dimensions.
	 *
	 * @param mixed  $value Raw value.
	 * @param string $fallback Fallback value.
	 * @return string
	 */
	private function sanitize_border_radius_value( $value, $fallback ) {
		if ( is_array( $value ) ) {
			$top_left = $this->sanitize_dimension_value( $value['topLeft'] ?? $value['top'] ?? '', '' );
			$top_right = $this->sanitize_dimension_value( $value['topRight'] ?? $value['right'] ?? '', '' );
			$bottom_right = $this->sanitize_dimension_value( $value['bottomRight'] ?? $value['bottom'] ?? '', '' );
			$bottom_left = $this->sanitize_dimension_value( $value['bottomLeft'] ?? $value['left'] ?? '', '' );

			if ( '' === $top_left || '' === $top_right || '' === $bottom_right || '' === $bottom_left ) {
				return $fallback;
			}

			return implode(
				' ',
				array(
					$top_left,
					$top_right,
					$bottom_right,
					$bottom_left,
				)
			);
		}

		$value = is_string( $value ) ? trim( $value ) : '';

		if ( '' === $value ) {
			return $fallback;
		}

		$parts = preg_split( '/\s+/', $value );

		if ( ! is_array( $parts ) || count( $parts ) < 1 || count( $parts ) > 4 ) {
			return $fallback;
		}

		$sanitized_parts = array();

		foreach ( $parts as $part ) {
			$sanitized_part = $this->sanitize_dimension_value( $part, '' );

			if ( '' === $sanitized_part ) {
				return $fallback;
			}

			$sanitized_parts[] = $sanitized_part;
		}

		return implode( ' ', $sanitized_parts );
	}

	/**
	 * Sanitize a hex color value.
	 *
	 * @param mixed  $value Raw value.
	 * @param string $fallback Fallback value.
	 * @return string
	 */
	private function sanitize_color( $value, $fallback ) {
		$sanitized = sanitize_hex_color( is_string( $value ) ? $value : '' );

		return $sanitized ? $sanitized : $fallback;
	}

	/**
	 * Sanitize a CSS font-family value.
	 *
	 * @param mixed  $value Raw value.
	 * @param string $fallback Fallback value.
	 * @return string
	 */
	private function sanitize_font_family( $value, $fallback ) {
		if ( ! is_string( $value ) ) {
			return $fallback;
		}

		$sanitized = sanitize_text_field( $value );
		$segments  = preg_split( '/[;{}<>]/', $sanitized );
		$sanitized = is_array( $segments ) ? (string) ( $segments[0] ?? '' ) : '';
		$sanitized = preg_replace( '/\s+/', ' ', trim( $sanitized ) );

		return '' !== $sanitized ? $sanitized : $fallback;
	}

	/**
	 * Sanitize box values.
	 *
	 * @param mixed                $value Raw box value.
	 * @param array<string,string> $fallback Fallback box value.
	 * @return array<string,string>
	 */
	private function sanitize_box_value( $value, $fallback ) {
		$value = is_array( $value ) ? $value : array();

		return array(
			'top'    => $this->sanitize_dimension_value( $value['top'] ?? '', $fallback['top'] ),
			'right'  => $this->sanitize_dimension_value( $value['right'] ?? '', $fallback['right'] ),
			'bottom' => $this->sanitize_dimension_value( $value['bottom'] ?? '', $fallback['bottom'] ),
			'left'   => $this->sanitize_dimension_value( $value['left'] ?? '', $fallback['left'] ),
		);
	}

	/**
	 * Sanitize zoom controls position.
	 *
	 * @param mixed $value Raw value.
	 * @return string
	 */
	private function sanitize_zoom_controls_position( $value ) {
		$value = sanitize_text_field( is_string( $value ) ? $value : '' );

		return in_array( $value, self::ZOOM_CONTROLS_POSITIONS, true )
			? $value
			: $this->get_default_block_attributes()['zoomControlsPosition'];
	}

	/**
	 * Sanitize zoom controls icon slug.
	 *
	 * @param mixed $value Raw value.
	 * @return string
	 */
	private function sanitize_zoom_controls_icon( $value, $fallback ) {
		$value = sanitize_text_field( is_string( $value ) ? $value : '' );

		return in_array( $value, self::ZOOM_CONTROLS_ICONS, true )
			? $value
			: $fallback;
	}
}
