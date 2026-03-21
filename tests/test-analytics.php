<?php
/**
 * Analytics tests.
 *
 * @package Minimal_Map
 */

/**
 * Verifies analytics storage and routes.
 */
class Minimal_Map_Analytics_Test extends WP_UnitTestCase {
	/**
	 * Analytics service.
	 *
	 * @var \MinimalMap\Analytics\Analytics
	 */
	private $analytics;

	/**
	 * Admin user id.
	 *
	 * @var int
	 */
	private $admin_user_id;

	/**
	 * Set up test state.
	 *
	 * @return void
	 */
	public function set_up() {
		parent::set_up();

		$this->analytics      = new \MinimalMap\Analytics\Analytics();
		$this->admin_user_id  = self::factory()->user->create(
			array(
				'role' => 'administrator',
			)
		);

		wp_set_current_user( $this->admin_user_id );
		$this->analytics->ensure_schema();

		global $wpdb;
		$wpdb->query( 'DELETE FROM ' . $this->analytics->get_table_name() );
		update_option( \MinimalMap\Analytics\Analytics::OPTION_ENABLED, '0', false );

		do_action( 'rest_api_init' );
	}

	/**
	 * The analytics table should be available after schema bootstrap.
	 *
	 * @return void
	 */
	public function test_analytics_table_is_created() {
		global $wpdb;

		$table_name = $this->analytics->get_table_name();
		$found      = $wpdb->get_var(
			$wpdb->prepare( 'SHOW TABLES LIKE %s', $table_name )
		);

		$this->assertSame( $table_name, $found );
	}

	/**
	 * Tracking route should insert sanitized rows when analytics is enabled.
	 *
	 * @return void
	 */
	public function test_tracking_route_inserts_when_enabled() {
		update_option( \MinimalMap\Analytics\Analytics::OPTION_ENABLED, '1', false );

		$request = new WP_REST_Request( 'POST', \MinimalMap\Rest\Analytics_Track_Route::get_rest_path() );
		$request->set_param( 'query_text', 'Berlin Mitte' );
		$request->set_param( 'query_type', 'text' );
		$request->set_param( 'result_count', 4 );
		$request->set_param( 'nearest_distance_meters', 275 );

		$response = rest_do_request( $request );
		$data     = $response->get_data();

		$this->assertTrue( $data['tracked'] );

		$summary = $this->analytics->get_summary();
		$this->assertSame( 1, $summary['totalSearches'] );
		$this->assertSame( 0, $summary['zeroResultSearches'] );
		$this->assertCount( 30, $summary['series']['totalSearches'] );
	}

	/**
	 * Tracking route should write nothing when analytics is disabled.
	 *
	 * @return void
	 */
	public function test_tracking_route_is_noop_when_disabled() {
		$request = new WP_REST_Request( 'POST', \MinimalMap\Rest\Analytics_Track_Route::get_rest_path() );
		$request->set_param( 'query_text', 'Hamburg Hafen' );
		$request->set_param( 'query_type', 'text' );
		$request->set_param( 'result_count', 0 );

		$response = rest_do_request( $request );
		$data     = $response->get_data();

		$this->assertFalse( $data['tracked'] );
		$this->assertSame( 0, $this->analytics->get_summary()['totalSearches'] );
	}

	/**
	 * Summary should expose daily trend series in site-local day buckets.
	 *
	 * @return void
	 */
	public function test_summary_returns_30_day_daily_series_with_local_day_grouping() {
		global $wpdb;

		update_option( \MinimalMap\Analytics\Analytics::OPTION_ENABLED, '1', false );

		$timezone = wp_timezone();
		$table_name = $this->analytics->get_table_name();
		$today = new DateTimeImmutable( 'now', $timezone );
		$target_day = $today->setTime( 0, 0, 0 )->modify( '-1 day' );
		$target_key = $target_day->format( 'Y-m-d' );
		$before_midnight_gmt = $target_day->setTime( 23, 30, 0 )->setTimezone( new DateTimeZone( 'UTC' ) )->format( 'Y-m-d H:i:s' );
		$after_midnight_gmt = $target_day->modify( '+1 day' )->setTime( 0, 15, 0 )->setTimezone( new DateTimeZone( 'UTC' ) )->format( 'Y-m-d H:i:s' );

		$wpdb->insert(
			$table_name,
			array(
				'query_text' => 'Late local query',
				'query_type' => 'text',
				'result_count' => 0,
				'occurred_at_gmt' => $before_midnight_gmt,
			),
			array( '%s', '%s', '%d', '%s' )
		);
		$wpdb->insert(
			$table_name,
			array(
				'query_text' => 'Distance query',
				'query_type' => 'address',
				'result_count' => 2,
				'nearest_distance_meters' => 600,
				'occurred_at_gmt' => $before_midnight_gmt,
			),
			array( '%s', '%s', '%d', '%d', '%s' )
		);
		$wpdb->insert(
			$table_name,
			array(
				'query_text' => 'Next day query',
				'query_type' => 'text',
				'result_count' => 1,
				'occurred_at_gmt' => $after_midnight_gmt,
			),
			array( '%s', '%s', '%d', '%s' )
		);

		$summary = $this->analytics->get_summary();
		$total_series = wp_list_pluck( $summary['series']['totalSearches'], 'value', 'date' );
		$zero_series = wp_list_pluck( $summary['series']['zeroResultSearches'], 'value', 'date' );
		$distance_series = wp_list_pluck( $summary['series']['averageNearestDistanceMeters'], 'value', 'date' );

		$this->assertCount( 30, $summary['series']['totalSearches'] );
		$this->assertSame( 2, $total_series[ $target_key ] );
		$this->assertSame( 1, $zero_series[ $target_key ] );
		$this->assertSame( 600.0, $distance_series[ $target_key ] );
		$this->assertSame( 0, $distance_series[ $today->setTime( 0, 0, 0 )->format( 'Y-m-d' ) ] );
	}

	/**
	 * Queries route should paginate and search stored rows.
	 *
	 * @return void
	 */
	public function test_queries_route_supports_pagination_and_search() {
		update_option( \MinimalMap\Analytics\Analytics::OPTION_ENABLED, '1', false );

		$this->analytics->track_query(
			array(
				'query_text'   => 'Berlin Mitte',
				'query_type'   => 'text',
				'result_count' => 2,
			)
		);
		$this->analytics->track_query(
			array(
				'query_text'              => 'Hamburg Port',
				'query_type'              => 'address',
				'result_count'            => 1,
				'nearest_distance_meters' => 420,
			)
		);

		$request = new WP_REST_Request( 'GET', \MinimalMap\Rest\Analytics_Queries_Route::get_rest_path() );
		$request->set_param( 'page', 1 );
		$request->set_param( 'per_page', 1 );
		$request->set_param( 'search', 'Berlin' );

		$response = rest_do_request( $request );
		$data     = $response->get_data();

		$this->assertSame( 1, $data['totalItems'] );
		$this->assertSame( 1, $data['totalPages'] );
		$this->assertSame( 'Berlin Mitte', $data['items'][0]['query_text'] );
	}

	/**
	 * Cleanup should remove rows older than the retention window.
	 *
	 * @return void
	 */
	public function test_cleanup_removes_queries_older_than_retention_window() {
		global $wpdb;

		$table_name = $this->analytics->get_table_name();

		$wpdb->insert(
			$table_name,
			array(
				'query_text'      => 'Old query',
				'query_type'      => 'text',
				'result_count'    => 0,
				'occurred_at_gmt' => gmdate( 'Y-m-d H:i:s', time() - ( 120 * DAY_IN_SECONDS ) ),
			),
			array( '%s', '%s', '%d', '%s' )
		);
		$wpdb->insert(
			$table_name,
			array(
				'query_text'      => 'Recent query',
				'query_type'      => 'text',
				'result_count'    => 1,
				'occurred_at_gmt' => gmdate( 'Y-m-d H:i:s', time() - DAY_IN_SECONDS ),
			),
			array( '%s', '%s', '%d', '%s' )
		);

		$this->analytics->cleanup_old_queries();

		$remaining = $wpdb->get_col( "SELECT query_text FROM {$table_name} ORDER BY id ASC" );

		$this->assertSame( array( 'Recent query' ), $remaining );
	}
}
