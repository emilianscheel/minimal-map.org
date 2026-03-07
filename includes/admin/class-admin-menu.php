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
	 * Capability required for the plugin admin UI.
	 */
	const CAPABILITY = 'manage_options';

	/**
	 * Top-level menu slug.
	 */
	const TOP_LEVEL_SLUG = 'minimal-map';

	/**
	 * Default section slug.
	 */
	const DEFAULT_VIEW = 'dashboard';

	/**
	 * Get all internal plugin sections.
	 *
	 * @return array<string, array<string, string>>
	 */
	public static function get_sections() {
		return array(
			'dashboard'  => array(
				'title'       => __( 'Dashboard', 'minimal-map' ),
				'description' => __( 'An overview of Minimal Map sections and upcoming data tools.', 'minimal-map' ),
			),
			'locations'  => array(
				'title'       => __( 'Locations', 'minimal-map' ),
				'description' => __( 'Create and organize the places you want to render on your maps.', 'minimal-map' ),
			),
			'categories' => array(
				'title'       => __( 'Categories', 'minimal-map' ),
				'description' => __( 'Group locations into reusable category collections for future filtering.', 'minimal-map' ),
			),
			'tags'       => array(
				'title'       => __( 'Tags', 'minimal-map' ),
				'description' => __( 'Apply lightweight labels to keep map content easy to organize.', 'minimal-map' ),
			),
			'markers'    => array(
				'title'       => __( 'Markers', 'minimal-map' ),
				'description' => __( 'Define the marker styles and visual pin variants used across maps.', 'minimal-map' ),
			),
			'styles'     => array(
				'title'       => __( 'Styles', 'minimal-map' ),
				'description' => __( 'Manage the map styles and presets available inside the block editor.', 'minimal-map' ),
			),
			'import'     => array(
				'title'       => __( 'Import', 'minimal-map' ),
				'description' => __( 'Bring external map data into Minimal Map when import tools arrive.', 'minimal-map' ),
			),
			'export'     => array(
				'title'       => __( 'Export', 'minimal-map' ),
				'description' => __( 'Download map data and configuration when export tools are added.', 'minimal-map' ),
			),
			'settings'   => array(
				'title'       => __( 'Settings', 'minimal-map' ),
				'description' => __( 'Adjust global plugin defaults and future map behavior settings.', 'minimal-map' ),
			),
		);
	}

	/**
	 * Resolve the current internal section.
	 *
	 * @return string
	 */
	public static function get_current_view() {
		$view     = isset( $_GET['view'] ) ? sanitize_key( wp_unslash( $_GET['view'] ) ) : self::DEFAULT_VIEW;
		$sections = self::get_sections();

		if ( ! isset( $sections[ $view ] ) ) {
			return self::DEFAULT_VIEW;
		}

		return $view;
	}

	/**
	 * Build the admin URL for a given section.
	 *
	 * @param string $view Section slug.
	 * @return string
	 */
	public static function get_view_url( $view ) {
		$base_url = admin_url( 'admin.php?page=' . self::TOP_LEVEL_SLUG );

		if ( self::DEFAULT_VIEW === $view ) {
			return $base_url;
		}

		return add_query_arg( 'view', $view, $base_url );
	}

	/**
	 * Register menu pages.
	 *
	 * @return void
	 */
	public function register() {
		add_menu_page(
			__( 'Minimal Map', 'minimal-map' ),
			__( 'Minimal Map', 'minimal-map' ),
			self::CAPABILITY,
			self::TOP_LEVEL_SLUG,
			array( $this, 'render_page' ),
			'dashicons-admin-site',
			56
		);
	}

	/**
	 * Render a page shell for the React admin app.
	 *
	 * @return void
	 */
	public function render_page() {
		$view        = self::get_current_view();
		$sections    = self::get_sections();
		$title       = $sections[ $view ]['title'];
		$description = $sections[ $view ]['description'];

		require MINIMAL_MAP_PATH . 'templates/admin-page.php';
	}
}
