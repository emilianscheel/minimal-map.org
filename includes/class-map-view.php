<?php
/**
 * Dynamic map block rendering.
 *
 * @package Minimal_Map
 */

namespace MinimalMap;

/**
 * Renders the frontend block markup.
 */
class Map_View {
	/**
	 * Shared config service.
	 *
	 * @var Config
	 */
	private $config;

	/**
	 * Constructor.
	 *
	 * @param Config $config Shared config service.
	 */
	public function __construct( Config $config ) {
		$this->config = $config;
	}

	/**
	 * Render callback.
	 *
	 * @param array<string, mixed> $attributes Block attributes.
	 * @return string
	 */
	public function render( $attributes ) {
		$config            = $this->config->normalize_block_attributes( $attributes, false );
		$map_surface_markup = $this->render_surface( $config );

		ob_start();
		require MINIMAL_MAP_PATH . 'templates/map-block.php';
		return (string) ob_get_clean();
	}

	/**
	 * Render the reusable map surface markup.
	 *
	 * @param array<string, mixed> $config Normalized map config.
	 * @return string
	 */
	public function render_surface( $config ) {
		$surface_style = 'height: ' . $config['heightCssValue'] . ';';

		if ( ! empty( $config['fontFamily'] ) ) {
			$surface_style .= ' --minimal-map-font-family: ' . $config['fontFamily'] . ';';
		}

		if ( ! empty( $config['borderRadius'] ) ) {
			$surface_style .= ' border-radius: ' . $config['borderRadius'] . ';';
		}

		$surface_attributes = array(
			'class'                   => 'minimal-map-surface',
			'style'                   => $surface_style,
			'data-minimal-map-config' => wp_json_encode( $config ),
		);

		return sprintf(
			'<div class="%1$s" style="%2$s" data-minimal-map-config="%3$s"></div>',
			esc_attr( $surface_attributes['class'] ),
			esc_attr( $surface_attributes['style'] ),
			esc_attr( $surface_attributes['data-minimal-map-config'] )
		);
	}
}
