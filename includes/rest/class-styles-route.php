<?php
/**
 * Styles REST route.
 *
 * @package Minimal_Map
 */

namespace MinimalMap\Rest;

use WP_REST_Server;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Manages map style themes via REST.
 */
class Styles_Route {
	/**
	 * Namespace for plugin REST routes.
	 */
	const REST_NAMESPACE = 'minimal-map/v1';

	/**
	 * REST route path.
	 */
	const REST_ROUTE = '/styles';

	/**
	 * Capability required for styles requests.
	 */
	const CAPABILITY = 'manage_options';

	/**
	 * Option name for style themes.
	 */
	const OPTION_NAME = 'minimal_map_style_themes';

	/**
	 * Register the routes.
	 *
	 * @return void
	 */
	public function register() {
		register_rest_route(
			self::REST_NAMESPACE,
			self::REST_ROUTE,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_styles' ),
					'permission_callback' => array( $this, 'can_manage_styles' ),
				),
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			self::REST_ROUTE . '/(?P<slug>[a-zA-Z0-9_-]+)',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_style' ),
					'permission_callback' => array( $this, 'can_manage_styles' ),
					'args'                => array(
						'colors' => array(
							'required' => true,
							'type'     => 'object',
						),
					),
				),
			)
		);
	}

	/**
	 * Check route permissions.
	 *
	 * @return bool
	 */
	public function can_manage_styles() {
		return current_user_can( self::CAPABILITY );
	}

	/**
	 * Get all styles.
	 *
	 * @return WP_REST_Response
	 */
	public function get_styles() {
		return rest_ensure_response( array_values( $this->get_themes() ) );
	}

	/**
	 * Update a style theme.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_style( $request ) {
		$slug   = $request->get_param( 'slug' );
		$themes = $this->get_themes();

		if ( ! isset( $themes[ $slug ] ) ) {
			return new WP_Error( 'minimal_map_style_not_found', __( 'Style theme not found.', 'minimal-map' ), array( 'status' => 404 ) );
		}

		$colors = $request->get_param( 'colors' );
		if ( ! is_array( $colors ) ) {
			return new WP_Error( 'minimal_map_invalid_colors', __( 'Invalid colors data.', 'minimal-map' ), array( 'status' => 400 ) );
		}

		$themes[ $slug ]['colors'] = $this->sanitize_theme_colors( $colors );

		update_option( self::OPTION_NAME, $themes );

		return rest_ensure_response( $themes[ $slug ] );
	}

	/**
	 * Get all themes, seeded with default if empty.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	public function get_themes() {
		$themes = get_option( self::OPTION_NAME );

		if ( ! is_array( $themes ) || empty( $themes ) ) {
			$themes = array(
				'default' => array(
					'slug'       => 'default',
					'label'      => __( 'Default Theme', 'minimal-map' ),
					'basePreset' => 'positron',
					'colors'     => $this->get_default_positron_colors(),
				),
			);
			update_option( self::OPTION_NAME, $themes );
		}

		return $themes;
	}

	/**
	 * Sanitize theme colors.
	 *
	 * @param array<string, mixed> $colors Raw colors.
	 * @return array<string, string>
	 */
	private function sanitize_theme_colors( $colors ) {
		$sanitized = array();
		$defaults  = $this->get_default_positron_colors();

		foreach ( $defaults as $slot => $default_color ) {
			$value = isset( $colors[ $slot ] ) ? (string) $colors[ $slot ] : $default_color;
			$hex   = sanitize_hex_color( $value );
			$sanitized[ $slot ] = $hex ? $hex : $default_color;
		}

		return $sanitized;
	}

	/**
	 * Get default colors for Positron.
	 *
	 * @return array<string, string>
	 */
	private function get_default_positron_colors() {
		return array(
			'background'      => '#f2f3f0',
			'park'            => '#d2e8d4',
			'residential'     => '#e4e4e4',
			'forest'          => '#d2e8d4',
			'ice'             => '#e8f4f4',
			'water'           => '#cad2d3',
			'waterway'        => '#cad2d3',
			'building'        => '#d9dad8',
			'buildingOutline' => '#d9dad8',
			'path'            => '#ffffff',
			'roadMinor'       => '#ffffff',
			'roadMajorCasing' => '#e5e5e5',
			'roadMajorFill'   => '#ffffff',
			'motorwayCasing'  => '#e5e5e5',
			'motorwayFill'    => '#ffffff',
			'rail'            => '#dcdcdc',
			'railDash'        => '#ffffff',
			'boundary'        => '#c3c3c3',
			'aerowayLine'     => '#e0e0e0',
			'aerowayArea'     => '#d1d1d1',
			'waterLabel'      => '#7a7a7a',
			'waterLabelHalo'  => '#ffffff',
			'roadLabel'       => '#666666',
			'roadLabelHalo'   => '#ffffff',
			'placeLabel'      => '#333333',
			'placeLabelHalo'  => '#ffffff',
		);
	}

	/**
	 * Get the absolute REST path.
	 *
	 * @return string
	 */
	public static function get_rest_path() {
		return '/' . self::REST_NAMESPACE . self::REST_ROUTE;
	}
}
