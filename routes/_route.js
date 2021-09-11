const favicon = require( 'serve-favicon' );
const path = require('path');

module.exports = function( app ) {

  app.use( '*', require( './any' ) );
  app.use( '/', require( './index' ) );
  app.use( '/version', require( './version' ) );
  app.use( haltOnTimedout );
  app.use( '/www', require( './www/www.js' ) );
  app.use( haltOnTimedout );
  app.use( '/nodejsinfo', require( './nodejsinfo' ) );
  app.use( haltOnTimedout );
  app.use( '/process', require( './process' ) );
  app.use( haltOnTimedout );
  app.use( '/usage', require( './usage' ) );
  app.use( haltOnTimedout );
  app.use( '/error', require( './error.js' ) );

  if ( process.env.LOG_ROUTE ) {
    app.use( '/' + process.env.LOG_ROUTE, require( './log.js' ) );
  }

  // var usersRouter = require('./users'); // @deprecated

  // Favicon
  app.use( favicon( path.join( path.dirname( __dirname ), 'public', 'images', 'favicon.svg' ) ) );

}

/**
 * @since 1.9.0
 * @see   https://github.com/expressjs/timeout#examples
 * @param req
 * @param res
 * @param next
 */
function haltOnTimedout( req, res, next ) {
  if ( ! req.timedout ) {
    next();
  }
  // next( new Error( "Request timed out." ) );
}