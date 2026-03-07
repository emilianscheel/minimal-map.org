<?php
/**
 * Admin menu registration.
 *
 * @package Minimal_Map
 */

namespace MinimalMap\Admin;

/**
 * Registers the admin menu structure.
 */
class Admin_Menu {
	/**
	 * Top-level menu slug.
	 */
	const TOP_LEVEL_SLUG = 'minimal-map';

	/**
	 * Get all page slugs and labels.
	 *
	 * @return array<string, string>
	 */
	public static function get_pages() {
		return array(
			self::TOP_LEVEL_SLUG         => __( 'Dashboard', 'minimal-map' ),
			'minimal-map-locations'      => __( 'Locations', 'minimal-map' ),
			'minimal-map-categories'     => __( 'Categories', 'minimal-map' ),
			'minimal-map-tags'           => __( 'Tags', 'minimal-map' ),
			'minimal-map-markers'        => __( 'Markers', 'minimal-map' ),
			'minimal-map-styles'         => __( 'Styles', 'minimal-map' ),
			'minimal-map-import'         => __( 'Import', 'minimal-map' ),
			'minimal-map-export'         => __( 'Export', 'minimal-map' ),
			'minimal-map-settings'       => __( 'Settings', 'minimal-map' ),
		);
	}

	/**
	 * Register menu pages.
	 *
	 * @return void
	 */
	public function register() {
		$pages = self::get_pages();

		add_menu_page(
			__( 'Minimal Map', 'minimal-map' ),
			__( 'Minimal Map', 'minimal-map' ),
			'manage_options',
			self::TOP_LEVEL_SLUG,
			array( $this, 'render_page' ),
			'dashicons-admin-site',
			56
		);

		foreach ( $pages as $slug => $label ) {
			add_submenu_page(
				self::TOP_LEVEL_SLUG,
				$label,
				$label,
				'manage_options',
				$slug,
				array( $this, 'render_page' )
			);
		}
	}

	/**
	 * Render a page shell for the React admin app.
	 *
	 * @return void
	 */
	public function render_page() {
		$slug  = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : self::TOP_LEVEL_SLUG;
		$pages = self::get_pages();
		$title = isset( $pages[ $slug ] ) ? $pages[ $slug ] : __( 'Minimal Map', 'minimal-map' );

		require MINIMAL_MAP_PATH . 'templates/admin-page.php';
	}
}
