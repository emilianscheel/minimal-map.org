<?php
/**
 * Shared plugin configuration.
 *
 * @package Minimal_Map
 */

namespace MinimalMap;

/**
 * Provides shared config for PHP and JS consumers.
 */
class Config {
	/**
	 * Default style preset slug.
	 */
	const DEFAULT_STYLE_PRESET = 'liberty';

	/**
	 * Get the available style presets.
	 *
	 * @return array<string, array<string, string>>
	 */
	public function get_style_presets() {
		return array(
			'liberty'   => array(
				'label'     => __( 'Liberty', 'minimal-map' ),
				'style_url' => 'https://tiles.openfreemap.org/styles/liberty',
			),
			'bright'    => array(
				'label'     => __( 'Bright', 'minimal-map' ),
				'style_url' => 'https://tiles.openfreemap.org/styles/bright',
			),
			'positron'  => array(
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
		$height     = isset( $attributes['height'] ) ? (int) $attributes['height'] : 0;

		return array(
			'centerLat'        => max( -90, min( 90, $center_lat ) ),
			'centerLng'        => max( -180, min( 180, $center_lng ) ),
			'zoom'             => max( 0, min( 22, $zoom ) ),
			'height'           => max( 240, $height ),
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
			'defaults'     => $this->get_default_block_attributes(),
			'stylePresets' => $this->get_style_presets(),
			'messages'     => array(
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
		return array(
			'pages' => Admin\Admin_Menu::get_pages(),
			'stats' => array(
				'locations'  => 0,
				'categories' => 0,
				'markers'    => 0,
				'tags'       => 0,
			),
		);
	}
}
