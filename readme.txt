=== Minimal Map ===
Contributors: Emilian Scheel
Tags: maps, gutenberg, blocks, geolocation
Requires at least: 6.9
Tested up to: 6.9.4
Requires PHP: 8.3
Stable tag: 0.3.0
License: MIT
License URI: https://opensource.org/license/mit/

Minimal Map adds a WordPress-native map block plus a dedicated admin workspace for locations, collections, markers, logos, tags, and style themes.

== Description ==

Minimal Map is built for current WordPress only. The plugin supports the latest stable WordPress release and PHP 8.3, and its build pipeline is optimized around that target instead of carrying legacy compatibility code.

Features include:

* Open source WordPress map plugin.
* Completely free map plugin for WordPress.
* WordPress-native map plugin built with native WordPress components.
* Built-in WordPress admin experience.
* Gutenberg map block for the block editor.
* Store locator plugin for WordPress.
* Location finder, branch locator, dealer locator, office locator.
* Interactive map for business locations, shops, studios, offices, showrooms, events, and directories.
* Frontend map powered by MapLibre.
* Live block editor map preview.
* Dedicated admin workspace for locations, collections, tags, markers, logos, and styles.
* Reusable location collections for grouped maps and filtered map views.
* Merge location collections to easily consolidate data.
* Searchable map with integrated search panel.
* Distance-based search results with real-time distance calculation (m/km).
* Automatic nearest-location highlighting in search results.
* Store locator cards with address, phone, email, website, logo, and tags.
* Detailed opening hours with support for lunch breaks and seasonal notes.
* Real-time "Open Now" status with customizable indicator colors.
* Address geocoding for fast location entry.
* Manual map pin placement and coordinate editing.
* CSV import for locations with custom field mapping.
* CSV export for locations.
* Example CSV export for faster onboarding.
* Bulk-friendly location management in a native WordPress admin UI.
* Custom SVG logo library for location branding.
* Custom marker presets and visual pin styles.
* Multiple map style presets including Liberty, Bright, and Positron.
* Custom style themes for map colors and visual branding.
* Map theme import from Minimal Map JSON or MapLibre style JSON v8.
* Configurable zoom controls with custom position, colors, spacing, radius, and icons.
* Choose from multiple zoom icon sets (plus/minus, circles, lines).
* Configurable search panel colors, spacing, width, and card styling.
* Customizable "View on Google Maps" navigation button styling.
* Customizable map attribution (credits) styling and positioning.
* Collection-based map output for store groups, regions, teams, and categories.
* Iframe embed snippet generation for external embeds.
* Custom map height controls with mobile-specific height overrides.
* Scroll zoom, mobile two-finger zoom, and cooperative gesture settings.
* English source strings with German translations.
* Feels native to WordPress and built for modern WordPress sites.

Only the latest stable WordPress release is supported. Older WordPress and PHP versions are intentionally out of scope for this plugin.

== Installation ==

1. Upload the plugin to `/wp-content/plugins/`.
1. Activate the plugin through the 'Plugins' menu in WordPress
1. Add the Minimal Map block in the block editor or manage data through the Minimal Map admin menu.

== Frequently Asked Questions ==

= Which WordPress and PHP versions are supported? =

The plugin supports WordPress 6.9.4 and PHP 8.3. The codebase and CI pipeline are optimized for the latest stable stack only.

= Does the plugin include translations? =

Yes. English is the source language and German translations are included.

== Screenshots ==

1. Dashboard overview (`dashboard.png`)
2. Location management (`locations.png`)
3. Collection management (`collections.png`)
4. Tag management (`tags.png`)
5. Map style management (`styles.png`)
6. Search interface (`search.png`)
7. Zoom controls (`zoom.png`)
8. Layout options (`layout.png`)
9. Gutenberg block integration (`gutenberg.png`)
10. Map preview (`preview.png`)

== Changelog ==

= 0.2.0 =
* Added detailed opening hours with lunch breaks, seasonal notes, and "Open Now" status indicators.
* Added distance-based search results with real-time m/km calculation and nearest-result highlighting.
* Added custom CSV field mapping for flexible location imports from external data sources.
* Added collection merging to consolidate location groups within the admin workspace.
* Added mobile-specific map height overrides and cooperative gesture (two-finger pan) support.
* Added advanced styling controls for zoom icons, map attribution, and navigation buttons.
* Expanded location data fields for more detailed contact and address information.
* Optimized the build pipeline for latest-only WordPress and PHP support.
* Split the admin and map runtime bundles into async chunks.
* Added bundle budget checks and bundle analysis tooling.
* Added native plugin translations for English source strings and German.

== Upgrade Notice ==

= 0.2.0 =
This release switches the plugin to latest-only support and ships a smaller, more efficient runtime loading model.
