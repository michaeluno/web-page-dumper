const favicon = require( 'serve-favicon' );
const path = require('path');

module.exports = function( app ) {

  app.use( '*', require( './any' ) );
  app.use( '/', require( './index' ) );
  app.use( '/www', require( './www/www.js' ) );
  app.use( '/nodejsinfo', require( './nodejsinfo' ) );
  app.use( '/process', require( './process' ) );
  app.use( '/usage', require( './usage' ) );
  app.use( '/error', require( './error.js' ) );

  if ( process.env.LOG_ROUTE ) {
    app.use( '/' + process.env.LOG_ROUTE, require( './log.js' ) );
  }

  // var usersRouter = require('./users'); // @deprecated

  // Favicon
  app.use( favicon( path.join( path.dirname( __dirname ), 'public', 'images', 'favicon.svg' ) ) );

}