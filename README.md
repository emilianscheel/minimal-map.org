# [`🗺️ minimal-map.net`](https://github.com/emilianscheel/minimal-map.net)

Render a minimalist MapLibre-powered map in Wordpress.

![Preview](plugin/screenshot.png)

[All Screenshots](plugin/Screenshots.md)

## Features

- Open source WordPress map plugin (MIT licensed)
- Completely free map plugin for WordPress
- WordPress-native map plugin built with native WordPress components
- Built-in WordPress admin experience, not a bolted-on SaaS dashboard
- Gutenberg map block for the block editor
- Store locator plugin for WordPress
- Location finder, branch locator, dealer locator, office locator
- Interactive map for business locations, shops, studios, offices, showrooms, events, and directories
- Frontend map powered by MapLibre
- Live block editor map preview
- Dedicated admin workspace for locations, collections, tags, markers, logos, and styles
- Reusable location collections for grouped maps and filtered map views
- Merge location collections to easily consolidate data
- Searchable map with integrated search panel
- Distance-based search results with real-time distance calculation (m/km)
- Automatic nearest-location highlighting in search results
- Store locator cards with address, phone, email, website, logo, and tags
- Detailed opening hours with support for lunch breaks and seasonal notes
- Real-time "Open Now" status with customizable indicator colors
- Address geocoding for fast location entry
- Manual map pin placement and coordinate editing
- CSV import for locations with custom field mapping
- CSV export for locations
- Example CSV export for faster onboarding
- Bulk-friendly location management in a native WordPress admin UI
- Custom SVG logo library for location branding
- Custom marker presets and visual pin styles
- Multiple map style presets including Liberty, Bright, and Positron
- Custom style themes for map colors and visual branding
- Map theme import from Minimal Map JSON or MapLibre style JSON v8
- Configurable zoom controls with custom position, colors, spacing, radius, and icons
- Choose from multiple zoom icon sets (plus/minus, circles, lines)
- Configurable search panel colors, spacing, width, and card styling
- Customizable "View on Google Maps" navigation button styling
- Customizable map attribution (credits) styling and positioning
- Collection-based map output for store groups, regions, teams, and categories
- Iframe embed snippet generation for external embeds
- Custom map height controls with mobile-specific height overrides
- Scroll zoom, mobile two-finger zoom, and cooperative gesture settings
- English source strings with German translations
- Feels native to WordPress and built for modern WordPress sites

## Development

```bash
zip -r ../minimal-map-0.4.0.zip . \
  -x "node_modules/*" ".git/*" "src/*" "tests/*" "reports/*" ".circleci/*" ".github/*" "bin/*" \
     "package.json" "bun.lock" "webpack.config.js" "composer.json" "phpunit.xml.dist" ".distignore"
```

```bash
ln -s "$(pwd)/plugin" ~/Studio/my-wordpress-website/wp-content/plugins/minimal-map.net

rm ~/Studio/my-wordpress-website/wp-content/plugins/minimal-map.net
```
