<?php
/**
 * Shared plugin configuration.
 *
 * @package Minimal_Map
 */

namespace MinimalMap;

use MinimalMap\Locations\Location_Post_Type;
use MinimalMap\Rest\Geocode_Route;

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
			'messages'      => array(
				'fallback' => __( 'Map preview unavailable because this browser does not support WebGL.', 'minimal-map' ),
			),
		);
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
				'locations'  => Location_Post_Type::get_location_count(),
				'categories' => 0,
				'markers'    => 0,
				'tags'       => 0,
			),
			'mapConfig'      => $this->get_client_config(),
			'locationsConfig' => array(
				'nonce'       => wp_create_nonce( 'wp_rest' ),
				'restBase'    => Location_Post_Type::REST_BASE,
				'restPath'    => Location_Post_Type::get_rest_path(),
				'geocodePath' => Geocode_Route::get_rest_path(),
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
}
