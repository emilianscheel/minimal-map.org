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
	<?php echo $map_surface_markup; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
</div>
