const Request_html = require( './Request_html.js' );
module.exports = class Request_text extends Request_html {

  type = 'text';

  async do() {

    await this._setHeader( true );
    await this._setCookies( this.res );

    let _headers = this.responseHeaders;
    if ( _headers[ 'Content-Type' ] ) {
      this.res.set( 'Content-Type', _headers[ 'Content-Type' ] );
    }

    // Output the document
    let _text = await this.responseHTTP.text();
    this.res.send( _text );

  }

}