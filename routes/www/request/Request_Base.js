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

  constructor( urlRequest, page, req, res, responseHTTP ) {
    this.urlRequest = urlRequest;
    this.page = page;
    this.req = req;
    this.res = res;
    this.responseHTTP = responseHTTP;
  }

  static async instantiate( urlRequest, page, req, res, responseHTTP ) {
     const o = new this( urlRequest, page, req, res, responseHTTP );
     await o._initialize();
     return o;
  }

  async _initialize() {}

  async do() {}


  async _setHeader( res ) {

    // Transfer response headers
    this._removeDefaultHeaders( this.res )

    /// Set the requested web site headers.
    let _headers = await this.responseHTTP.headers();
    let _headersFixed = {};
    for ( let [ key, value ] of Object.entries( _headers ) ) {
      _headersFixed[ key.replace(/\b\w/g, l => l.toUpperCase()) ] = value.replace(/\r?\n|\r/g, '');
      this.res.setHeader( key.replace(/\b\w/g, l => l.toUpperCase()), value.replace(/\r?\n|\r/g, '') );
    }
    this.res.removeHeader( 'Content-Encoding' ); // "Content-Encoding: gzip" causes a blank page in the browser.

  }

  _removeDefaultHeaders( res ) {
    res.removeHeader( "set-cookie" );
    res.removeHeader( "Set-Cookie" );
    res.removeHeader( "Connection" );
    res.removeHeader( "Content-Length" );
    res.removeHeader( "Content-Type" );
    res.removeHeader( "Date" );
    res.removeHeader( "ETag" );
    res.removeHeader( "Keep-Alive" );
    res.removeHeader( "X-DNS-Prefetch-Control" );
    res.removeHeader( "X-Powered-By" );
  }


}