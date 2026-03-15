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
	 * Create one published logo post.
	 *
	 * @return int
	 */
	private function create_logo() {
		return self::factory()->post->create(
			array(
				'post_status'  => 'publish',
				'post_title'   => 'Logo ' . wp_generate_uuid4(),
				'post_content' => '<svg viewBox="0 0 32 32"></svg>',
				'post_type'    => \MinimalMap\Logos\Logo_Post_Type::POST_TYPE,
			)
		);
	}

	/**
	 * Encode one embed payload using the public base64url format.
	 *
	 * @param array<string, mixed> $payload Embed payload.
	 * @return string
	 */
	private function encode_embed_payload( $payload ) {
		return rtrim(
			strtr( base64_encode( wp_json_encode( $payload ) ), '+/', '-_' ),
			'='
		);
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
		$this->assertSame( '36px', $attributes['heightMobileCssValue'] );
	}

	/**
	 * Mobile height should be normalized independently when provided.
	 *
	 * @return void
	 */
	public function test_height_mobile_override_normalizes_to_css_value() {
		$config     = new \MinimalMap\Config();
		$attributes = $config->normalize_block_attributes(
			array(
				'height'           => 36,
				'heightUnit'       => 'px',
				'heightMobile'     => 55,
				'heightMobileUnit' => 'vh',
			)
		);

		$this->assertSame( 55.0, $attributes['heightMobile'] );
		$this->assertSame( 'vh', $attributes['heightMobileUnit'] );
		$this->assertSame( '55vh', $attributes['heightMobileCssValue'] );
	}

	/**
	 * Mobile two-finger zoom should default off for blocks and accept explicit enablement.
	 *
	 * @return void
	 */
	public function test_mobile_two_finger_zoom_defaults_off_for_blocks() {
		$config = new \MinimalMap\Config();

		$default_attributes = $config->normalize_block_attributes( array() );
		$enabled_attributes = $config->normalize_block_attributes(
			array(
				'mobileTwoFingerZoom' => true,
			)
		);

		$this->assertFalse( $default_attributes['mobileTwoFingerZoom'] );
		$this->assertTrue( $enabled_attributes['mobileTwoFingerZoom'] );
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
	 * Client config should expose collection options with their assigned points.
	 *
	 * @return void
	 */
	public function test_client_config_includes_collection_payload() {
		$config        = new \MinimalMap\Config();
		$location_id   = $this->create_location( '48.137154', '11.576124' );
		$collection_id = $this->create_collection( array( $location_id ) );

		$client_config = $config->get_client_config();

		$this->assertArrayHasKey( 'collections', $client_config );
		$this->assertCount( 1, $client_config['collections'] );
		$this->assertSame( $collection_id, $client_config['collections'][0]['id'] );
		$this->assertSame(
			array(
				array(
					'lat' => 48.137154,
					'lng' => 11.576124,
				),
			),
			$client_config['collections'][0]['locations']
		);
	}

	/**
	 * Selected collection ids should restrict the rendered block payload to assigned locations.
	 *
	 * @return void
	 */
	public function test_normalize_block_attributes_filters_locations_by_selected_collection() {
		$config            = new \MinimalMap\Config();
		$included_location = $this->create_location( '52.517', '13.388' );
		$this->create_location( '48.137154', '11.576124' );
		$collection_id = $this->create_collection( array( $included_location ) );

		$attributes = $config->normalize_block_attributes(
			array(
				'collectionId' => $collection_id,
			)
		);

		$this->assertSame( $collection_id, $attributes['collectionId'] );
		$this->assertSame(
			array(
				array(
					'lat' => 52.517,
					'lng' => 13.388,
				),
			),
			$attributes['locations']
		);
	}

	/**
	 * Embed payloads should decode and sanitize through the shared block config pipeline.
	 *
	 * @return void
	 */
	public function test_normalize_embed_payload_accepts_v1_payloads() {
		$config         = new \MinimalMap\Config();
		$payload        = array(
			'v'          => \MinimalMap\Config::EMBED_PAYLOAD_VERSION,
			'attributes' => array(
				'height'                   => 320,
				'heightUnit'               => 'vh',
				'heightMobile'             => 44,
				'heightMobileUnit'         => 'rem',
				'zoom'                     => 11,
				'collectionId'             => 999999,
				'zoomControlsBorderColor' => 'invalid',
			),
		);
		$encoded_payload = $this->encode_embed_payload( $payload );
		$normalized      = $config->normalize_embed_payload( $encoded_payload );

		$this->assertIsArray( $normalized );
		$this->assertSame( '320vh', $normalized['heightCssValue'] );
		$this->assertSame( '44rem', $normalized['heightMobileCssValue'] );
		$this->assertSame( '#dcdcde', $normalized['zoomControlsBorderColor'] );
		$this->assertSame( array(), $normalized['locations'] );
	}

	/**
	 * Invalid embed payloads should be rejected.
	 *
	 * @return void
	 */
	public function test_normalize_embed_payload_rejects_invalid_payloads() {
		$config = new \MinimalMap\Config();

		$this->assertWPError( $config->normalize_embed_payload( '%%%not-valid%%%' ) );
		$this->assertWPError(
			$config->normalize_embed_payload(
				$this->encode_embed_payload(
					array(
						'v' => \MinimalMap\Config::EMBED_PAYLOAD_VERSION,
					)
				)
			)
		);
	}

	/**
	 * The iframe endpoint should render a standalone map document for valid payloads.
	 *
	 * @return void
	 */
	public function test_iframe_endpoint_renders_map_surface_for_valid_payload() {
		$config  = new \MinimalMap\Config();
		$view    = new \MinimalMap\Map_View( $config );
		$endpoint = new \MinimalMap\Iframe_Endpoint( $config, $view );
		$encoded_payload = $this->encode_embed_payload(
			array(
				'v'          => \MinimalMap\Config::EMBED_PAYLOAD_VERSION,
				'attributes' => array(
					'height' => 360,
					'zoom'   => 8,
				),
			)
		);

		$response = $endpoint->build_response( $encoded_payload );

		$this->assertSame( 200, $response['status'] );
		$this->assertStringContainsString( 'minimal-map-surface', $response['html'] );
		$this->assertStringContainsString( 'data-minimal-map-config=', $response['html'] );
		$this->assertStringContainsString( '360px', $response['html'] );
	}

	/**
	 * The iframe endpoint should return a bad request document for malformed payloads.
	 *
	 * @return void
	 */
	public function test_iframe_endpoint_returns_400_for_invalid_payload() {
		$config   = new \MinimalMap\Config();
		$view     = new \MinimalMap\Map_View( $config );
		$endpoint = new \MinimalMap\Iframe_Endpoint( $config, $view );
		$response = $endpoint->build_response( 'not-a-payload' );

		$this->assertSame( 400, $response['status'] );
		$this->assertStringContainsString( 'Invalid Minimal Map Embed', $response['html'] );
		$this->assertStringNotContainsString( 'minimal-map-surface', $response['html'] );
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
	 * The logo post type should be registered on init.
	 *
	 * @return void
	 */
	public function test_logo_post_type_is_registered() {
		$this->assertTrue( post_type_exists( \MinimalMap\Logos\Logo_Post_Type::POST_TYPE ) );
	}

	/**
	 * Location logo meta should be registered as integer.
	 *
	 * @return void
	 */
	public function test_location_logo_meta_is_registered() {
		$registered = get_registered_meta_keys( 'post', \MinimalMap\Locations\Location_Post_Type::POST_TYPE );

		$this->assertArrayHasKey( 'logo_id', $registered );
		$this->assertSame( 'integer', $registered['logo_id']['type'] );
		$this->assertTrue( $registered['logo_id']['single'] );
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

	/**
	 * Admin app config should expose logos metadata.
	 *
	 * @return void
	 */
	public function test_admin_app_config_includes_logos() {
		$config = new \MinimalMap\Config();

		$this->create_logo();

		$admin_config = $config->get_admin_app_config();
		$views        = wp_list_pluck( $admin_config['sections'], 'view' );

		$this->assertContains( 'logos', $views, true );
		$this->assertSame( 1, $admin_config['stats']['logos'] );
		$this->assertSame(
			\MinimalMap\Logos\Logo_Post_Type::REST_BASE,
			$admin_config['logosConfig']['restBase']
		);
		$this->assertSame(
			\MinimalMap\Logos\Logo_Post_Type::get_rest_path(),
			$admin_config['logosConfig']['restPath']
		);
	}

	/**
	 * Client config should expose the public iframe base URL.
	 *
	 * @return void
	 */
	public function test_client_config_includes_embed_base_url() {
		$config        = new \MinimalMap\Config();
		$client_config = $config->get_client_config();

		$this->assertSame(
			add_query_arg( 'minimal-map-iframe', '1', home_url( '/' ) ),
			$client_config['embedBaseUrl']
		);
	}
}
