/**
 * ### Usage
 * ```
 * const obj = await MyClass.instantiate( 'bar', 'foo' );
 * ```
 * @type {Request_Base}
 */
module.exports = class Request_Base {

  type = '';

  urlRequest = '';
  page;
  req;
  res;
  responseHTTP;
  responseHeaders;

  constructor( urlRequest, page, req, res, responseHTTP, responseHeaders ) {
    this.urlRequest = urlRequest;
    this.page = page;
    this.req = req;
    this.res = res;
    this.responseHTTP = responseHTTP;
    this.responseHeaders = responseHeaders;
  }

  static async instantiate( urlRequest, page, req, res, responseHTTP, responseHeaders ) {
     const o = new this( urlRequest, page, req, res, responseHTTP, responseHeaders );
     await o._initialize();
     return o;
  }

  async _initialize() {}

  async do() {}

  /**
   * Transfer Puppeteer cookies to Express cookies.
   * @param res
   * @returns {Promise<void>}
   */
  async _setCookies( res ) {
    let _allCookies = await this.page._client.send( 'Network.getAllCookies' );
    let _cookies = _allCookies.cookies.length
      ? _allCookies.cookies
      : await this.page.cookies();
    // this.req.logger.debug( 'Set Cookies', _cookies );
    for ( let _cookie of _cookies ){
      // Puppeteer sets `expires` serving as the `maxAge` value indicating how long it lasts. So format it to a date object.
      if ( _cookie.expires && 'number' === typeof _cookie.expires ) {
        _cookie.expires = new Date( ( + new Date() ) + _cookie.expires ); // current timestamp + lifespan (maxAge)
      }
      res.cookie( _cookie.name, _cookie.value, _cookie );
    }
  }

  async _setHeader( removeDefault ) {

    // Transfer response headers
    if ( removeDefault ) {
      this._removeDefaultHeaders();
    }

    /// Set the requested web site headers.
    let _headers = this.responseHeaders;
    let _headerToSend = {};
    for ( let [ key, value ] of Object.entries( _headers ) ) {

      let _key   = key.replace(/\b\w/g, l => l.toUpperCase() );
      if ( 'Set-Cookie' === _key ) {
        continue;
      }
      _headerToSend[ _key ] = 'Set-Cookie' === _key
        ? value.split( /\r?\n|\r/g )
        : value.replace(/\r?\n|\r/g, '' );

    }
    _headerToSend[ 'Access-Control-Allow-Origin' ] = '*';
    this.res.set( _headerToSend );
    this.res.removeHeader( 'Content-Encoding' ); // "Content-Encoding: gzip" causes a blank page in the browser.

    this.req.logger.debug( 'Set Header', _headerToSend );

  }

  _removeDefaultHeaders() {
    this.res.removeHeader( "set-cookie" );
    this.res.removeHeader( "Set-Cookie" );
    this.res.removeHeader( "Connection" );
    this.res.removeHeader( "Content-Length" );
    this.res.removeHeader( "Content-Type" );
    this.res.removeHeader( "Date" );
    this.res.removeHeader( "ETag" );
    this.res.removeHeader( "Keep-Alive" );
    this.res.removeHeader( "X-DNS-Prefetch-Control" );
    this.res.removeHeader( "X-Powered-By" );
  }


}