const Request_html = require( './Request_html.js' );
module.exports = class Request_text extends Request_html {

  type = 'text';

  async do() {

    // this._removeDefaultHeaders( this.res );

    await this._setHeader( this.res );
    await this._setCookies( this.res );

    let _headers = this.responseHeaders;
    if ( _headers[ 'Content-Type' ] ) {
      this.res.set( 'Content-Type', _headers[ 'Content-Type' ] );
    }

    // Output the document
    let _text = await this.responseHTTP.text();
    this.res.send( _text );

  }

  async _setHeader( res ) {

    /// Set the requested web site headers.
    let _headers = this.responseHeaders;
    let _headerToSend = {};
    for ( let [ key, value ] of Object.entries( _headers ) ) {

      let _key   = key.replace(/\b\w/g, l => l.toUpperCase() );
      if ( 'Set-Cookie' === _key ) {
        continue;
      }
      let _value = 'Set-Cookie' === _key
        ? value.split( /\r?\n|\r/g )
        : value.replace(/\r?\n|\r/g, '' );
      this.res.setHeader( _key , _value );
      _headerToSend[ _key ] = _value;

    }
    this.res.removeHeader( 'Content-Encoding' ); // "Content-Encoding: gzip" causes a blank page in the browser.
    this.req.logger.debug( 'Set Header', _headerToSend );

  }

}