<?php
/**
 * Frontend map block template.
 *
 * @package Minimal_Map
 */

$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'class' => 'minimal-map-block',
	)
);
?>
<div <?php echo $wrapper_attributes; ?>>
	<div
		class="<?php echo esc_attr( $surface_attributes['class'] ); ?>"
		style="<?php echo esc_attr( $surface_attributes['style'] ); ?>"
		data-minimal-map-config="<?php echo esc_attr( $surface_attributes['data-minimal-map-config'] ); ?>"
	></div>
</div>
