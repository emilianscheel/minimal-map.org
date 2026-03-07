<?php
/**
 * Shared plugin configuration.
 *
 * @package Minimal_Map
 */

namespace MinimalMap;

use MinimalMap\Collections\Collection_Post_Type;
use MinimalMap\Locations\Location_Post_Type;
use MinimalMap\Rest\Geocode_Route;
use WP_Post;

/**
 * Provides shared config for PHP and JS consumers.
 */
class Config {
	/**
	 * Default style preset slug.
	 */
	const DEFAULT_STYLE_PRESET = 'liberty';

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
		return array(
			'centerLat'        => 52.517,
			'centerLng'        => 13.388,
			'zoom'             => 9.5,
			'height'           => 420,
			'heightUnit'       => 'px',
			'stylePreset'      => self::DEFAULT_STYLE_PRESET,
			'showZoomControls' => true,
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
		);
	}

	/**
	 * Normalize incoming block attributes.
	 *
	 * @param array<string, mixed> $attributes Raw attributes.
	 * @return array<string, mixed>
	 */
	public function normalize_block_attributes( $attributes ) {
		$attributes = wp_parse_args( $attributes, $this->get_default_block_attributes() );
		$presets    = $this->get_style_presets();
		$preset     = isset( $attributes['stylePreset'] ) ? sanitize_key( (string) $attributes['stylePreset'] ) : self::DEFAULT_STYLE_PRESET;

		if ( ! isset( $presets[ $preset ] ) ) {
			$preset = self::DEFAULT_STYLE_PRESET;
		}

		$center_lat = isset( $attributes['centerLat'] ) ? (float) $attributes['centerLat'] : 0.0;
		$center_lng = isset( $attributes['centerLng'] ) ? (float) $attributes['centerLng'] : 0.0;
		$zoom       = isset( $attributes['zoom'] ) ? (float) $attributes['zoom'] : 0.0;
		$height     = isset( $attributes['height'] ) ? (float) $attributes['height'] : 0.0;
		$height     = $height > 0 ? $height : (float) $this->get_default_block_attributes()['height'];
		$height_unit = isset( $attributes['heightUnit'] ) ? sanitize_text_field( (string) $attributes['heightUnit'] ) : 'px';
		$height_unit = in_array( $height_unit, self::HEIGHT_UNITS, true ) ? $height_unit : 'px';

		return array(
			'centerLat'        => max( -90, min( 90, $center_lat ) ),
			'centerLng'        => max( -180, min( 180, $center_lng ) ),
			'zoom'             => max( 0, min( 22, $zoom ) ),
			'height'           => $height,
			'heightUnit'       => $height_unit,
			'heightCssValue'   => $this->format_dimension_value( $height, $height_unit ),
			'stylePreset'      => $preset,
			'styleUrl'         => $presets[ $preset ]['style_url'],
			'showZoomControls' => ! empty( $attributes['showZoomControls'] ),
			'zoomControlsPosition'        => $this->sanitize_zoom_controls_position( $attributes['zoomControlsPosition'] ?? '' ),
			'zoomControlsPadding'         => $this->sanitize_box_value( $attributes['zoomControlsPadding'] ?? array(), $this->get_default_block_attributes()['zoomControlsPadding'] ),
			'zoomControlsOuterMargin'     => $this->sanitize_box_value( $attributes['zoomControlsOuterMargin'] ?? array(), $this->get_default_block_attributes()['zoomControlsOuterMargin'] ),
			'zoomControlsBackgroundColor' => $this->sanitize_color( $attributes['zoomControlsBackgroundColor'] ?? '', $this->get_default_block_attributes()['zoomControlsBackgroundColor'] ),
			'zoomControlsIconColor'       => $this->sanitize_color( $attributes['zoomControlsIconColor'] ?? '', $this->get_default_block_attributes()['zoomControlsIconColor'] ),
			'zoomControlsBorderRadius'    => $this->sanitize_border_radius_value( $attributes['zoomControlsBorderRadius'] ?? '', $this->get_default_block_attributes()['zoomControlsBorderRadius'] ),
			'zoomControlsBorderColor'     => $this->sanitize_color( $attributes['zoomControlsBorderColor'] ?? '', $this->get_default_block_attributes()['zoomControlsBorderColor'] ),
			'zoomControlsBorderWidth'     => $this->sanitize_dimension_value( $attributes['zoomControlsBorderWidth'] ?? '', $this->get_default_block_attributes()['zoomControlsBorderWidth'] ),
			'zoomControlsPlusIcon'        => $this->sanitize_zoom_controls_icon( $attributes['zoomControlsPlusIcon'] ?? '', $this->get_default_block_attributes()['zoomControlsPlusIcon'] ),
			'zoomControlsMinusIcon'       => $this->sanitize_zoom_controls_icon( $attributes['zoomControlsMinusIcon'] ?? '', $this->get_default_block_attributes()['zoomControlsMinusIcon'] ),
			'fallbackMessage'  => __( 'Map preview unavailable because this browser does not support WebGL.', 'minimal-map' ),
		);
	}

	/**
	 * Build client configuration for block scripts.
	 *
	 * @return array<string, mixed>
	 */
	public function get_client_config() {
		return array(
			'defaults'      => $this->get_default_block_attributes(),
			'heightUnits'   => self::HEIGHT_UNITS,
			'stylePresets'  => $this->get_style_presets(),
			'locations'     => $this->get_map_locations(),
			'messages'      => array(
				'fallback' => __( 'Map preview unavailable because this browser does not support WebGL.', 'minimal-map' ),
			),
		);
	}

	/**
	 * Get all published map locations with valid coordinates.
	 *
	 * @return array<int, array<string, float>>
	 */
	public function get_map_locations() {
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

			$location = $this->normalize_map_location(
				get_post_meta( $post->ID, 'latitude', true ),
				get_post_meta( $post->ID, 'longitude', true )
			);

			if ( null === $location ) {
				continue;
			}

			$locations[] = $location;
		}

		return $locations;
	}

	/**
	 * Build client configuration for the admin app.
	 *
	 * @return array<string, mixed>
	 */
	public function get_admin_app_config() {
		$sections = array();

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
				'categories'  => 0,
				'markers'     => 0,
				'tags'        => 0,
			),
			'mapConfig'      => $this->get_client_config(),
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
