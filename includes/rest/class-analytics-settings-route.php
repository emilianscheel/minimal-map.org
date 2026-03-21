<?php
/**
 * Analytics settings REST route.
 *
 * @package Minimal_Map
 */

namespace MinimalMap\Rest;

use MinimalMap\Admin\Admin_Menu;
use MinimalMap\Analytics\Analytics;

/**
 * Exposes analytics settings to the admin UI.
 */
class Analytics_Settings_Route {
	/**
	 * Namespace for plugin REST routes.
	 */
	const REST_NAMESPACE = 'minimal-map/v1';

	/**
	 * REST route path.
	 */
	const REST_ROUTE = '/analytics/settings';

	/**
	 * Analytics service.
	 *
	 * @var Analytics
	 */
	private $analytics;

	/**
	 * Constructor.
	 *
	 * @param Analytics $analytics Analytics service.
	 */
	public function __construct( Analytics $analytics ) {
		$this->analytics = $analytics;
	}

	/**
	 * Register the route.
	 *
	 * @return void
	 */
	public function register() {
		register_rest_route(
			self::REST_NAMESPACE,
			self::REST_ROUTE,
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_settings' ),
					'permission_callback' => array( $this, 'can_manage_analytics' ),
				),
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_settings' ),
					'permission_callback' => array( $this, 'can_manage_analytics' ),
					'args'                => $this->get_route_args(),
				),
			)
		);
	}

	/**
	 * Read analytics settings.
	 *
	 * @return \WP_REST_Response
	 */
	public function get_settings() {
		return rest_ensure_response(
			array(
				'enabled'           => $this->analytics->is_enabled(),
				'complianzEnabled'  => $this->analytics->is_complianz_enabled(),
			)
		);
	}

	/**
	 * Update analytics settings.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response
	 */
	public function update_settings( $request ) {
		$params  = $request->get_json_params();
		if ( ! is_array( $params ) ) {
			$params = $request->get_params();
		}

		$response = array();

		if ( isset( $params['enabled'] ) ) {
			$response['enabled'] = $this->analytics->update_enabled(
				rest_sanitize_boolean( $params['enabled'] )
			);
		}

		if ( isset( $params['complianzEnabled'] ) ) {
			$response['complianzEnabled'] = $this->analytics->update_complianz_enabled(
				rest_sanitize_boolean( $params['complianzEnabled'] )
			);
		}

		return rest_ensure_response( $response );
	}

	/**
	 * Verify analytics management capability.
	 *
	 * @return bool
	 */
	public function can_manage_analytics() {
		return current_user_can( Admin_Menu::CAPABILITY );
	}

	/**
	 * Return route args.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	private function get_route_args() {
		return array(
			'enabled' => array(
				'required' => false,
				'type'     => 'boolean',
			),
			'complianzEnabled' => array(
				'required' => false,
				'type'     => 'boolean',
			),
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
