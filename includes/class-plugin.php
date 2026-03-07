<?php
/**
 * Main plugin bootstrap class.
 *
 * @package Minimal_Map
 */

namespace MinimalMap;

use MinimalMap\Admin\Admin_Menu;
use MinimalMap\Blocks\Map_Block;

/**
 * Boots the plugin services.
 */
final class Plugin {
	/**
	 * Singleton instance.
	 *
	 * @var Plugin|null
	 */
	private static $instance = null;

	/**
	 * Assets service.
	 *
	 * @var Assets
	 */
	private $assets;

	/**
	 * Block service.
	 *
	 * @var Map_Block
	 */
	private $map_block;

	/**
	 * Admin menu service.
	 *
	 * @var Admin_Menu
	 */
	private $admin_menu;

	/**
	 * Boot the plugin.
	 *
	 * @return Plugin
	 */
	public static function boot() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
		$config         = new Config();
		$this->assets   = new Assets( $config );
		$map_view       = new Map_View( $config );
		$this->map_block = new Map_Block( $map_view );
		$this->admin_menu = new Admin_Menu();

		$this->register_hooks();
	}

	/**
	 * Register WordPress hooks.
	 *
	 * @return void
	 */
	private function register_hooks() {
		add_action( 'init', array( $this->assets, 'register' ) );
		add_action( 'init', array( $this->map_block, 'register' ) );
		add_action( 'admin_menu', array( $this->admin_menu, 'register' ) );
		add_action( 'admin_enqueue_scripts', array( $this->assets, 'enqueue_admin_assets' ) );
	}
}
