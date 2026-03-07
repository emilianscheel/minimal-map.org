<?php
/**
 * Location post type registration.
 *
 * @package Minimal_Map
 */

namespace MinimalMap\Locations;

/**
 * Registers the location content model.
 */
class Location_Post_Type {
	/**
	 * Capability required to manage locations.
	 */
	const CAPABILITY = 'manage_options';

	/**
	 * Location post type slug.
	 */
	const POST_TYPE = 'minimal_map_location';

	/**
	 * REST base.
	 */
	const REST_BASE = 'minimal_map_location';

	/**
	 * Registered meta fields.
	 *
	 * @var array<string, string>
	 */
	const META_FIELDS = array(
		'telephone'    => 'sanitize_text_field',
		'email'        => 'sanitize_email',
		'website'      => 'esc_url_raw',
		'street'       => 'sanitize_text_field',
		'house_number' => 'sanitize_text_field',
		'postal_code'  => 'sanitize_text_field',
		'city'         => 'sanitize_text_field',
		'state'        => 'sanitize_text_field',
		'country'      => 'sanitize_text_field',
	);

	/**
	 * Register the post type and meta.
	 *
	 * @return void
	 */
	public function register() {
		register_post_type(
			self::POST_TYPE,
			array(
				'labels'              => array(
					'name'          => __( 'Locations', 'minimal-map' ),
					'singular_name' => __( 'Location', 'minimal-map' ),
				),
				'public'              => false,
				'show_ui'             => false,
				'show_in_menu'        => false,
				'show_in_rest'        => true,
				'rest_base'           => self::REST_BASE,
				'supports'            => array( 'title' ),
				'map_meta_cap'        => true,
				'capability_type'     => array( 'minimal_map_location', 'minimal_map_locations' ),
				'capabilities'        => $this->get_capabilities(),
				'delete_with_user'    => false,
				'exclude_from_search' => true,
			)
		);

		foreach ( self::META_FIELDS as $meta_key => $sanitize_callback ) {
			register_post_meta(
				self::POST_TYPE,
				$meta_key,
				array(
					'auth_callback'     => array( $this, 'can_manage_locations' ),
					'sanitize_callback' => $sanitize_callback,
					'show_in_rest'      => true,
					'single'            => true,
					'type'              => 'string',
				)
			);
		}
	}

	/**
	 * Get mapped primitive capabilities for the location post type.
	 *
	 * @return array<string, string>
	 */
	private function get_capabilities() {
		return array(
			'create_posts'           => self::CAPABILITY,
			'delete_others_posts'    => self::CAPABILITY,
			'delete_posts'           => self::CAPABILITY,
			'delete_private_posts'   => self::CAPABILITY,
			'delete_published_posts' => self::CAPABILITY,
			'edit_others_posts'      => self::CAPABILITY,
			'edit_posts'             => self::CAPABILITY,
			'edit_private_posts'     => self::CAPABILITY,
			'edit_published_posts'   => self::CAPABILITY,
			'publish_posts'          => self::CAPABILITY,
			'read'                   => self::CAPABILITY,
			'read_private_posts'     => self::CAPABILITY,
		);
	}

	/**
	 * Whether the current user can manage locations.
	 *
	 * @return bool
	 */
	public function can_manage_locations() {
		return current_user_can( self::CAPABILITY );
	}

	/**
	 * Get the REST path for locations.
	 *
	 * @return string
	 */
	public static function get_rest_path() {
		return '/wp/v2/' . self::REST_BASE;
	}

	/**
	 * Get the current published location count.
	 *
	 * @return int
	 */
	public static function get_location_count() {
		if ( ! post_type_exists( self::POST_TYPE ) ) {
			return 0;
		}

		$counts = wp_count_posts( self::POST_TYPE );

		if ( ! $counts ) {
			return 0;
		}

		return property_exists( $counts, 'publish' ) ? (int) $counts->publish : 0;
	}
}
