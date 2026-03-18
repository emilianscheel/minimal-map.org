<?php
/**
 * Public locations REST route.
 *
 * @package Minimal_Map
 */

namespace MinimalMap\Rest;

use MinimalMap\Config;

/**
 * Provides optimized location data for the frontend.
 */
class Locations_Route {
	/**
	 * Namespace for plugin REST routes.
	 */
	const REST_NAMESPACE = 'minimal-map/v1';

	/**
	 * REST route path.
	 */
	const REST_ROUTE = '/locations';

	/**
	 * Shared config service.
	 *
	 * @var Config
	 */
	private $config;

	/**
	 * Constructor.
	 *
	 * @param Config $config Shared config service.
	 */
	public function __construct( Config $config ) {
		$this->config = $config;
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
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'handle_request' ),
				'permission_callback' => '__return_true',
				'args'                => $this->get_route_args(),
			)
		);
	}

	/**
	 * Handle location requests.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response
	 */
	public function handle_request( $request ) {
		$collection_id = absint( $request->get_param( 'collection_id' ) );
		
		$data = $this->config->get_optimized_map_data( $collection_id );

		return rest_ensure_response( $data );
	}

	/**
	 * Get route args schema.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	private function get_route_args() {
		return array(
			'collection_id' => array(
				'required'          => false,
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
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
