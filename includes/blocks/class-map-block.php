<?php
/**
 * Block registration.
 *
 * @package Minimal_Map
 */

namespace MinimalMap\Blocks;

use MinimalMap\Map_View;

/**
 * Registers the map block.
 */
class Map_Block {
	/**
	 * Frontend view service.
	 *
	 * @var Map_View
	 */
	private $map_view;

	/**
	 * Constructor.
	 *
	 * @param Map_View $map_view Frontend renderer.
	 */
	public function __construct( Map_View $map_view ) {
		$this->map_view = $map_view;
	}

	/**
	 * Register the block.
	 *
	 * @return void
	 */
	public function register() {
		register_block_type(
			MINIMAL_MAP_PATH . 'block.json',
			array(
				'render_callback' => array( $this->map_view, 'render' ),
			)
		);
	}
}
