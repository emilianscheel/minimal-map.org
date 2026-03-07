<?php
/**
 * Plugin Name:       Minimal Map
 * Description:       Gutenberg-first native map block and admin shell for WordPress.
 * Version:           0.1.0
 * Requires at least: 6.5
 * Requires PHP:      7.4
 * Author:            Codex
 * Text Domain:       minimal-map
 * Domain Path:       /languages
 *
 * @package Minimal_Map
 */

defined( 'ABSPATH' ) || exit;

define( 'MINIMAL_MAP_VERSION', '0.1.0' );
define( 'MINIMAL_MAP_FILE', __FILE__ );
define( 'MINIMAL_MAP_PATH', plugin_dir_path( __FILE__ ) );
define( 'MINIMAL_MAP_URL', plugin_dir_url( __FILE__ ) );

require_once MINIMAL_MAP_PATH . 'includes/bootstrap.php';

\MinimalMap\Plugin::boot();
