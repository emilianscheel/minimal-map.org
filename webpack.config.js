const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

module.exports = {
	...defaultConfig,
	entry: {
		index: path.resolve( process.cwd(), 'src/block/index.js' ),
		frontend: path.resolve( process.cwd(), 'src/frontend/index.js' ),
		admin: path.resolve( process.cwd(), 'src/admin/index.js' ),
	},
};
