const Request_Base = require( './Request_Base.js' );
module.exports = class Request_html extends Request_Base {

  type = 'html';

  async do() {

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
    // console.log( 'Headers Original', _headers );
    // console.log( 'Headers Sanitized', _headersFixed );

    // Output the document
    let _html = await this.page.content();
    this.res.send( _html );

  }

    _removeDefaultHeaders( res ) {
      res.removeHeader("set-cookie" );
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