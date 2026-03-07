<?php
/**
 * Asset registration.
 *
 * @package Minimal_Map
 */

namespace MinimalMap;

/**
 * Registers scripts and styles.
 */
class Assets {
	/**
	 * Config service.
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
	 * Register all plugin assets.
	 *
	 * @return void
	 */
	public function register() {
		$this->register_script( 'minimal-map-block-editor', 'index.js' );
		$this->register_script( 'minimal-map-frontend', 'frontend.js' );
		$this->register_script( 'minimal-map-admin', 'admin.js' );

		$this->register_style( 'minimal-map-maplibre-style', 'frontend.css' );
		$this->register_style( 'minimal-map-editor-style', 'index.css', array( 'wp-edit-blocks', 'wp-components' ) );
		$this->register_style( 'minimal-map-style', 'style-frontend.css', array( 'wp-components', 'minimal-map-maplibre-style' ) );
		$this->register_style( 'minimal-map-admin-style', 'style-admin.css', array( 'wp-components' ) );

		$this->attach_inline_data();
	}

	/**
	 * Enqueue admin assets for plugin pages.
	 *
	 * @param string $hook_suffix Current admin page hook suffix.
	 * @return void
	 */
	public function enqueue_admin_assets( $hook_suffix ) {
		if ( 0 !== strpos( (string) $hook_suffix, 'minimal-map' ) && false === strpos( (string) $hook_suffix, 'minimal-map' ) ) {
			return;
		}

		wp_enqueue_script( 'minimal-map-admin' );
		wp_enqueue_style( 'minimal-map-admin-style' );
	}

	/**
	 * Register a JS entry.
	 *
	 * @param string $handle Script handle.
	 * @param string $filename Output filename.
	 * @return void
	 */
	private function register_script( $handle, $filename ) {
		$file_path = MINIMAL_MAP_PATH . 'build/' . $filename;
		$file_url  = MINIMAL_MAP_URL . 'build/' . $filename;

		if ( ! file_exists( $file_path ) ) {
			return;
		}

		$asset = $this->get_asset_metadata( $filename );

		wp_register_script(
			$handle,
			$file_url,
			$asset['dependencies'],
			$asset['version'],
			true
		);
	}

	/**
	 * Register a CSS entry.
	 *
	 * @param string $handle Style handle.
	 * @param string $filename Output filename.
	 * @param array  $dependencies Style dependencies.
	 * @return void
	 */
	private function register_style( $handle, $filename, $dependencies = array() ) {
		$file_path = MINIMAL_MAP_PATH . 'build/' . $filename;
		$file_url  = MINIMAL_MAP_URL . 'build/' . $filename;

		if ( ! file_exists( $file_path ) ) {
			return;
		}

		wp_register_style(
			$handle,
			$file_url,
			$dependencies,
			(string) filemtime( $file_path )
		);
	}

	/**
	 * Attach inline config objects.
	 *
	 * @return void
	 */
	private function attach_inline_data() {
		if ( wp_script_is( 'minimal-map-block-editor', 'registered' ) ) {
			wp_add_inline_script(
				'minimal-map-block-editor',
				'window.MinimalMapBlockConfig = ' . wp_json_encode( $this->config->get_client_config() ) . ';',
				'before'
			);
		}

		if ( wp_script_is( 'minimal-map-frontend', 'registered' ) ) {
			wp_add_inline_script(
				'minimal-map-frontend',
				'window.MinimalMapFrontConfig = ' . wp_json_encode( $this->config->get_client_config() ) . ';',
				'before'
			);
		}

		if ( wp_script_is( 'minimal-map-admin', 'registered' ) ) {
			wp_add_inline_script(
				'minimal-map-admin',
				'window.MinimalMapAdminConfig = ' . wp_json_encode( $this->config->get_admin_app_config() ) . ';',
				'before'
			);
		}
	}

	/**
	 * Read the generated asset metadata.
	 *
	 * @param string $filename Build filename.
	 * @return array<string, mixed>
	 */
	private function get_asset_metadata( $filename ) {
		$asset_path = MINIMAL_MAP_PATH . 'build/' . str_replace( '.js', '.asset.php', $filename );

		if ( file_exists( $asset_path ) ) {
			$asset = require $asset_path;

			if ( is_array( $asset ) ) {
				return array(
					'dependencies' => isset( $asset['dependencies'] ) ? $asset['dependencies'] : array(),
					'version'      => isset( $asset['version'] ) ? $asset['version'] : MINIMAL_MAP_VERSION,
				);
			}
		}

		return array(
			'dependencies' => array(),
			'version'      => MINIMAL_MAP_VERSION,
		);
	}
}
