# [`🗺️ minimal-map.net`](https://github.com/emilianscheel/minimal-map.net)

Render a minimalist MapLibre-powered map in Wordpress.

![Preview](screenshot.png)

[Download Plugin](https://github.com/emilianscheel/minimal-map.net/releases/latest/download/minimal-map.zip) | [All Screenshots](Screenshots.md)

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
- **Privacy-first search analytics** with search query trends and metrics
- **GDPR-ready tracking** with built-in **Complianz** script blocking support
- **Marker clustering** to easily handle hundreds of locations on a single map
- **"Find Me" button** for real-time user location centering and distance calculation
- **Live user location "blue dot"** indicator on the map
- Reusable location collections for grouped maps and filtered map views
- Merge location collections to easily consolidate data
- Searchable map with integrated search panel
- Distance-based search results with real-time distance calculation (m/km)
- Automatic nearest-location highlighting in search results
- **Search panel quick filters** like "Open Now" and "By Category" (Tag-based)
- Store locator cards with address, phone, email, website, logo, and tags
- **Social media links** for locations (Instagram, X, Facebook, Threads, YouTube, Telegram)
- Detailed opening hours with support for lunch breaks and seasonal notes
- Real-time "Open Now" status with customizable indicator colors
- **Dynamic opening status hints** like "Opens soon" or "Closes soon"
- Address geocoding for fast location entry
- Manual map pin placement and coordinate editing
- **Excel (XLSX) import and export** for seamless data management
- CSV import for locations with custom field mapping
- CSV export for locations
- Example CSV/Excel export for faster onboarding
- Bulk-friendly location management in a native WordPress admin UI
- **Power-user keyboard shortcuts** for lightning-fast admin workflows (New: `n`, Merge: `m`)
- Custom SVG logo library for location branding
- Custom marker presets and visual pin styles
- **Individual location pin colors** to override global marker styles per location
- Multiple map style presets including Liberty, Bright, and Positron
- Custom style themes for map colors and visual branding
- **Custom font family** support to match your site's typography perfectly
- Map theme import from Minimal Map JSON or MapLibre style JSON v8
- **Highly configurable zoom controls** (custom icons, position, and styling)
- Choose from multiple zoom icon sets (plus/minus, circles, lines)
- Configurable search panel colors, spacing, width, and card styling
- **In-map location cards** for modern, overlay-style location details
- Customizable "View on Google Maps" navigation button styling
- Customizable map attribution (credits) styling and positioning
- Collection-based map output for store groups, regions, teams, and categories
- Iframe embed snippet generation for external embeds
- Custom map height controls with mobile-specific height overrides
- Scroll zoom, mobile two-finger zoom, and **cooperative gesture** settings
- English source strings with German translations
- Feels native to WordPress and built for modern WordPress sites

## Development

```bash
# Prepare the plugin for the WordPress Store
mkdir -p minimal-map-net
cp -r includes languages templates build minimal-map.php readme.txt README.md block.json LICENSE minimal-map-net/
zip -r minimal-map.zip minimal-map-net/ -x "*.map"
rm -rf minimal-map-net
```


```bash
ln -s "$(pwd)" ~/Studio/my-wordpress-website/wp-content/plugins/minimal-map.net

rm ~/Studio/my-wordpress-website/wp-content/plugins/minimal-map.net
```
