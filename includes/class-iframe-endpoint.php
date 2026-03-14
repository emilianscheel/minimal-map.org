<?php
/**
 * Public iframe endpoint renderer.
 *
 * @package Minimal_Map
 */

namespace MinimalMap;

/**
 * Renders one standalone map document for iframe embeds.
 */
class Iframe_Endpoint {
	/**
	 * Public request flag.
	 */
	const QUERY_VAR = 'minimal-map-iframe';

	/**
	 * Encoded config query arg.
	 */
	const CONFIG_QUERY_VAR = 'minimal-map-config';

	/**
	 * Shared config service.
	 *
	 * @var Config
	 */
	private $config;

	/**
	 * Shared map renderer.
	 *
	 * @var Map_View
	 */
	private $map_view;

	/**
	 * Constructor.
	 *
	 * @param Config   $config Shared config service.
	 * @param Map_View $map_view Shared map renderer.
	 */
	public function __construct( Config $config, Map_View $map_view ) {
		$this->config   = $config;
		$this->map_view = $map_view;
	}

	/**
	 * Render the standalone iframe response if requested.
	 *
	 * @return void
	 */
	public function maybe_render() {
		if ( ! $this->is_iframe_request() ) {
			return;
		}

		add_filter( 'show_admin_bar', '__return_false' );

		$encoded_config = isset( $_GET[ self::CONFIG_QUERY_VAR ] ) ? wp_unslash( (string) $_GET[ self::CONFIG_QUERY_VAR ] ) : '';
		$response       = $this->build_response( $encoded_config );

		status_header( $response['status'] );
		nocache_headers();

		echo $response['html']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		exit;
	}

	/**
	 * Determine whether the current request targets the iframe document.
	 *
	 * @return bool
	 */
	public function is_iframe_request() {
		return isset( $_GET[ self::QUERY_VAR ] );
	}

	/**
	 * Build one iframe response without sending it.
	 *
	 * @param string $encoded_config Base64url-encoded JSON config.
	 * @return array{status:int,html:string}
	 */
	public function build_response( $encoded_config ) {
		$normalized_config = $this->config->normalize_embed_payload( $encoded_config );

		if ( is_wp_error( $normalized_config ) ) {
			return array(
				'status' => 400,
				'html'   => $this->render_document(
					array(
						'document_title'    => __( 'Invalid Minimal Map Embed', 'minimal-map' ),
						'error_message'     => $normalized_config->get_error_message(),
						'map_surface_markup' => '',
					)
				),
			);
		}

		return array(
			'status' => 200,
			'html'   => $this->render_document(
				array(
					'document_title'    => __( 'Minimal Map', 'minimal-map' ),
					'error_message'     => '',
					'map_surface_markup' => $this->map_view->render_surface( $normalized_config ),
				)
			),
		);
	}

	/**
	 * Render one standalone HTML document.
	 *
	 * @param array<string, string> $context Document context.
	 * @return string
	 */
	private function render_document( $context ) {
		if ( '' !== $context['map_surface_markup'] ) {
			wp_enqueue_style( 'minimal-map-style' );
			wp_enqueue_script( 'minimal-map-frontend' );
		}

		$document_title    = $context['document_title'];
		$error_message     = $context['error_message'];
		$map_surface_markup = $context['map_surface_markup'];
		$language_attributes = get_language_attributes();
		$charset             = get_bloginfo( 'charset' );

		ob_start();
		require MINIMAL_MAP_PATH . 'templates/map-iframe.php';
		return (string) ob_get_clean();
	}
}
