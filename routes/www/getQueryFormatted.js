/**
 * Formats the URL query string object
 * @param query
 * @param req
 * @param urlThis
 * @returns {*}
 */
module.exports = function formatQuery( query, req, urlThis ) {

  // Required
  query.output   = 'undefined' !== typeof query.output && query.output ? query.output.toLowerCase() : '';

  // Cache
  query.cache    = 'undefined' === typeof query.cache
    ? true
    : !! parseInt( query.cache );

  query.timeout             = 'undefined' === typeof query.timeout ? 29000 : parseInt( query.timeout + '' );
  query.reload              = query.reload
    ? parseInt( query.reload + '' )
    : 0;

  // Viewport
  query.viewport            = 'undefined' === typeof query.viewport ? {} : query.viewport;
  if ( query.viewport.width ) {
    query.viewport.width      = parseInt( query.viewport.width );
  }
  if ( query.viewport.height ) {
    query.viewport.height     = parseInt( query.viewport.height );
  }
  if ( query.viewport.deviceScaleFactor ) {
    query.viewport.deviceScaleFactor = parseInt( query.viewport.deviceScaleFactor );
  }
  if ( query.viewport.isMobile ) {
    query.viewport.isMobile = Boolean( query.viewport.isMobile );
  }
  if ( query.viewport.isLandscape ) {
    query.viewport.isLandscape = Boolean( query.viewport.isLandscape );
  }

  // Screenshot
  query.screenshot          = 'undefined' === typeof query.screenshot ? {} : query.screenshot;
  query.screenshot.clip     = 'undefined' === typeof query.screenshot.clip ? {} : query.screenshot.clip;

  // Basic Authentication
  query.password = 'undefined' === typeof query.password ? '' : query.password;

  // Additional HTTP Headers
  query.headers             = 'undefined' === typeof query.headers ? {} : query.headers;

  // .launch( { arg: ... } )
  query.args                = 'undefined' === typeof query.args ? [] : query.args;

  // PDF
  query.pdf                 = query.pdf || {};

  // Proxy
  query.proxy               = 'undefined' === typeof query.proxy
    ? null
    : ( query.proxy.includes("://" ) ? query.proxy : null );

  // Block resources
  query.block = _getBlockResources( query.output, query );

  // waitUntil - convert it to array
  query.waitUntil = 'undefined' === typeof query.waitUntil ? 'load' : query.waitUntil;
  if ( ! Array.isArray( query.waitUntil ) ) {
    query.waitUntil = [ query.waitUntil ];
  }
  query.waitUntil = query.waitUntil.filter( function( value ){
    return [ 'load', 'domcontentloaded', 'networkidle0', 'networkidle2' ].includes( value ); // drop unaccepted values
  } );
  if ( 0 === query.waitUntil.length ) {
    query.waitUntil = [ 'load' ];
  }

  // Actions
  query.action = Array.isArray( query.action ) ? query.action : [];

  // Cookies
  query.cookies = 'undefined' === typeof query.cookies ? [] : query.cookies;
  for ( let _i=0; _i < query.cookies.length; _i++ ) {
    if ( typeof query.cookies[ _i ] !== 'object' || null === query.cookies[ _i ] ) {
      continue;
    }
    if ( ! query.cookies[ _i ].hasOwnProperty( 'domain' ) && ! query.cookies[ _i ].hasOwnProperty( 'url' ) ) {
      query.cookies[ _i ][ 'url' ] = urlThis;
    }
  }

  // Omits
  query.omit                 = query.omit || {};

  return query;

}

  function _getBlockResources( outputType, query ) {

    let _block   = 'undefined' === typeof query.block ? { 'types': [], 'urls': [] } : query.block;
    _block.types = 'undefined' === typeof _block.types ? [] : _block.types;
    _block.urls  = 'undefined' === typeof _block.urls  ? [] : _block.urls;

    // Supported types: stylesheet, image, font, script.
    // Unsupported: document, media, texttrack, xhr, fetch, eventsource, websocket, manifest, other.
    if ( [ 'html', 'htm', 'json' ].includes( outputType ) ) {
      _block.types = [ 'stylesheet', 'image', 'font' ];
    }
    return _block;

  }