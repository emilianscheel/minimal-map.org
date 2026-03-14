=== Minimal Map ===
Contributors: codex
Tags: maps, gutenberg, blocks, geolocation
Requires at least: 6.9
Tested up to: 6.9.4
Requires PHP: 8.3
Stable tag: 0.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Minimal Map adds a WordPress-native map block plus a dedicated admin workspace for locations, collections, markers, logos, tags, and style themes.

== Description ==

Minimal Map is built for current WordPress only. The plugin supports the latest stable WordPress release and PHP 8.3, and its build pipeline is optimized around that target instead of carrying legacy compatibility code.

Features include:

* A configurable block editor map preview.
* A frontend map runtime powered by MapLibre.
* Admin tools for managing locations, collections, markers, logos, tags, and style themes.
* Built-in internationalization with English source strings and German translations.

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

== Changelog ==

= 0.2.0 =
* Optimized the build pipeline for latest-only WordPress and PHP support.
* Split the admin and map runtime bundles into async chunks.
* Added bundle budget checks and bundle analysis tooling.
* Added native plugin translations for English source strings and German.

== Upgrade Notice ==

= 0.2.0 =
This release switches the plugin to latest-only support and ships a smaller, more efficient runtime loading model.
