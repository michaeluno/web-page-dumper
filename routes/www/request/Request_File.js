const Request_Base = require( './Request_Base.js' );
const urlModule = require( 'url' );
module.exports = class Request_File extends Request_Base {

  hostName = '';

  constructor( urlRequest, page, req, res, responseHTTP ) {
    super( urlRequest, page, req, res, responseHTTP );
    this.hostName = urlModule.parse( this.urlRequest ).hostname;
  }

}