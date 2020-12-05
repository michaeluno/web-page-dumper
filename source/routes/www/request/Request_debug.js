const Request_Base = require( './Request_Base.js' );
module.exports = class Request_debug extends Request_Base {

  type = 'debug';

  async do() {
    this.req.debug.log( 'HTTP Status Code:', await this.responseHTTP.status() );
    this.req.debug.log( 'HTTP Headers:', await this.responseHTTP.headers() );
    this.res.locals.debugOutput = this.req.debug.entries;
    this.res.render( 'debug', this.req.app.get( 'config' ) );
  }

}