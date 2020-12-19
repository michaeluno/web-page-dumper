const Request_Base = require( './Request_Base.js' );
module.exports = class Request_json extends Request_Base {

  type = 'json';

  async do() {
    
    await this._setHeader( this.res );
    this.res.setHeader( 'Content-Type', 'application/json' );
    this.res.json( {
      'url': await this.responseHTTP.url(),
      'query': this.req.query,
      'resourceType': await this.responseHTTP.request().resourceType(),
      'contentType': this.responseHTTP.contentType ? this.responseHTTP.contentType : await this.responseHTTP.headers()[ 'content-type' ], // same as headers[ 'Content-Type' ];
      'status': await this.responseHTTP.status(),
      'headers': await this.responseHTTP.headers(),
      'body': await this.responseHTTP.text(),
    } );
  }

}