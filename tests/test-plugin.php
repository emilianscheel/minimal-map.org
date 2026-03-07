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
	 * Collection content model service.
	 *
	 * @var \MinimalMap\Collections\Collection_Post_Type
	 */
	private $collection_post_type;

	/**
	 * Bootstrap test services.
	 *
	 * @return void
	 */
	public function set_up() {
		parent::set_up();

		$this->collection_post_type = new \MinimalMap\Collections\Collection_Post_Type();
	}

	/**
	 * Create one published location post with optional coordinates.
	 *
	 * @param mixed $latitude Latitude meta value.
	 * @param mixed $longitude Longitude meta value.
	 * @return int
	 */
	private function create_location( $latitude, $longitude ) {
		$post_id = self::factory()->post->create(
			array(
				'post_status' => 'publish',
				'post_title'  => 'Location ' . wp_generate_uuid4(),
				'post_type'   => \MinimalMap\Locations\Location_Post_Type::POST_TYPE,
			)
		);

		if ( null !== $latitude ) {
			update_post_meta( $post_id, 'latitude', $latitude );
		}

		if ( null !== $longitude ) {
			update_post_meta( $post_id, 'longitude', $longitude );
		}

		return $post_id;
	}

	/**
	 * Create one published collection post with optional assigned location ids.
	 *
	 * @param int[] $location_ids Assigned location ids.
	 * @return int
	 */
	private function create_collection( $location_ids = array() ) {
		$post_id = self::factory()->post->create(
			array(
				'post_status' => 'publish',
				'post_title'  => 'Collection ' . wp_generate_uuid4(),
				'post_type'   => \MinimalMap\Collections\Collection_Post_Type::POST_TYPE,
			)
		);

		update_post_meta(
			$post_id,
			\MinimalMap\Collections\Collection_Post_Type::LOCATION_IDS_META_KEY,
			$location_ids
		);

		return $post_id;
	}

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

	/**
	 * Height units should normalize into a CSS-ready value.
	 *
	 * @return void
	 */
	public function test_height_unit_defaults_to_pixels() {
		$config      = new \MinimalMap\Config();
		$attributes  = $config->normalize_block_attributes(
			array(
				'height' => 36,
			)
		);

		$this->assertSame( 'px', $attributes['heightUnit'] );
		$this->assertSame( '36px', $attributes['heightCssValue'] );
	}

	/**
	 * Published locations with valid coordinates should be exposed to the client.
	 *
	 * @return void
	 */
	public function test_get_map_locations_includes_only_valid_published_locations() {
		$config = new \MinimalMap\Config();

		$this->create_location( '52.517', '13.388' );
		$this->create_location( '', '13.400' );
		$this->create_location( '52.520', '' );
		$this->create_location( 'not-a-number', '13.410' );
		$this->create_location( '91', '13.420' );

		wp_insert_post(
			array(
				'post_status' => 'draft',
				'post_title'  => 'Draft location',
				'post_type'   => \MinimalMap\Locations\Location_Post_Type::POST_TYPE,
				'meta_input'  => array(
					'latitude'  => '40.7128',
					'longitude' => '-74.0060',
				),
			)
		);

		$this->assertSame(
			array(
				array(
					'lat' => 52.517,
					'lng' => 13.388,
				),
			),
			$config->get_map_locations()
		);
	}

	/**
	 * Client config should contain the normalized location payload.
	 *
	 * @return void
	 */
	public function test_client_config_includes_locations_payload() {
		$config = new \MinimalMap\Config();

		$this->create_location( '48.137154', '11.576124' );

		$client_config = $config->get_client_config();

		$this->assertArrayHasKey( 'locations', $client_config );
		$this->assertSame(
			array(
				array(
					'lat' => 48.137154,
					'lng' => 11.576124,
				),
			),
			$client_config['locations']
		);
	}

	/**
	 * The collection post type should be registered on init.
	 *
	 * @return void
	 */
	public function test_collection_post_type_is_registered() {
		$this->assertTrue( post_type_exists( \MinimalMap\Collections\Collection_Post_Type::POST_TYPE ) );
	}

	/**
	 * Collection assignment meta should be registered.
	 *
	 * @return void
	 */
	public function test_collection_assignment_meta_is_registered() {
		$registered = get_registered_meta_keys( 'post', \MinimalMap\Collections\Collection_Post_Type::POST_TYPE );

		$this->assertArrayHasKey( \MinimalMap\Collections\Collection_Post_Type::LOCATION_IDS_META_KEY, $registered );
		$this->assertSame( 'array', $registered[ \MinimalMap\Collections\Collection_Post_Type::LOCATION_IDS_META_KEY ]['type'] );
		$this->assertTrue( $registered[ \MinimalMap\Collections\Collection_Post_Type::LOCATION_IDS_META_KEY ]['single'] );
	}

	/**
	 * Collection assignment ids should sanitize to unique positive integers.
	 *
	 * @return void
	 */
	public function test_collection_assignment_ids_are_sanitized() {
		$this->assertSame(
			array( 12, 8 ),
			$this->collection_post_type->sanitize_location_ids( array( '12', 12, -3, 0, 'foo', 8 ) )
		);
	}

	/**
	 * Admin app config should expose collections metadata.
	 *
	 * @return void
	 */
	public function test_admin_app_config_includes_collections() {
		$config = new \MinimalMap\Config();

		$this->create_collection();

		$admin_config = $config->get_admin_app_config();
		$views        = wp_list_pluck( $admin_config['sections'], 'view' );

		$this->assertContains( 'collections', $views, true );
		$this->assertSame( 1, $admin_config['stats']['collections'] );
		$this->assertSame(
			\MinimalMap\Collections\Collection_Post_Type::REST_BASE,
			$admin_config['collectionsConfig']['restBase']
		);
		$this->assertSame(
			\MinimalMap\Collections\Collection_Post_Type::get_rest_path(),
			$admin_config['collectionsConfig']['restPath']
		);
	}
}
