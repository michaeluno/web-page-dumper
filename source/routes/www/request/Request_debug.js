const Request_Base = require( './Request_Base.js' );
const nodeinfo = require('nodejs-info');

module.exports = class Request_debug extends Request_Base {

  type = 'debug';

  async do() {

    let browser = this.page.browser();
    this.res.locals.systemInfo = {
      'node.js': this.req.app.get( 'config' ).system[ "node.js" ],
      'Browser':( await browser.userAgent() ).replace( 'Headless', '' ) + ' ' + ( await browser.version() ).replace( 'Headless', '' ),
    };

    let _config = this.req.app.get( 'config' );

    this.req.debug.log( 'HTTP Version:', await this.page.evaluate( () => performance.getEntries()[0].nextHopProtocol ) );
    this.req.debug.log( 'HTTP Status Code:', await this.responseHTTP.status() );
    this.req.debug.log( 'HTTP Headers:', await this.responseHTTP.headers() );
    this.res.locals.title = 'Debug Info - ' + _config.project.name;
    this.res.locals.debugOutput = this.req.debug.entries;

    this.res.render( 'debug', this.req.app.get( 'config' ) );
  }

}