<?php
/**
 * Plugin bootstrap.
 *
 * @package Minimal_Map
 */

namespace MinimalMap;

require_once MINIMAL_MAP_PATH . 'includes/class-config.php';
require_once MINIMAL_MAP_PATH . 'includes/class-assets.php';
require_once MINIMAL_MAP_PATH . 'includes/class-map-view.php';
require_once MINIMAL_MAP_PATH . 'includes/admin/class-admin-menu.php';
require_once MINIMAL_MAP_PATH . 'includes/blocks/class-map-block.php';
require_once MINIMAL_MAP_PATH . 'includes/collections/class-collection-post-type.php';
require_once MINIMAL_MAP_PATH . 'includes/locations/class-location-post-type.php';
require_once MINIMAL_MAP_PATH . 'includes/rest/class-geocode-route.php';
require_once MINIMAL_MAP_PATH . 'includes/rest/class-styles-route.php';
require_once MINIMAL_MAP_PATH . 'includes/class-plugin.php';
