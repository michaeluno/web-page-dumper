const Request_Image = require( './Request_Image.js' );

module.exports = class Request_debug extends Request_Image {

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
    let _debug = {
      log: this.req.debug.entries
    };
    await this._autoScroll( this.page );
    _debug.screenshot = await this.page.screenshot( {
      // fullPage: true,
      clip: {
        x: 0,
        y: 0,
        width: await this.page.evaluate( () => document.body.scrollWidth ),
        height: await this.page.evaluate( () => document.body.scrollHeight ),
      },
      type: 'jpeg',
      quality: 60,
      encoding: 'base64'
    } );
    this.res.locals.debug = _debug;
    this.res.render( 'debug', this.req.app.get( 'config' ) );
  }

}