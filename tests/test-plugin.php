<?php
/**
 * Plugin integration tests.
 *
 * @package Minimal_Map
 */

/**
 * Verifies core plugin registration.
 */
class Minimal_Map_Plugin_Test extends WP_UnitTestCase {

	/**
	 * The block should be registered on init.
	 *
	 * @return void
	 */
	public function test_map_block_is_registered() {
		$this->assertTrue( WP_Block_Type_Registry::get_instance()->is_registered( 'minimal-map/map' ) );
	}

	/**
	 * The OpenFreeMap default should be available.
	 *
	 * @return void
	 */
	public function test_default_style_preset_exists() {
		$config  = new \MinimalMap\Config();
		$presets = $config->get_style_presets();

		$this->assertArrayHasKey( 'liberty', $presets );
		$this->assertSame( 'https://tiles.openfreemap.org/styles/liberty', $presets['liberty']['style_url'] );
	}
}
