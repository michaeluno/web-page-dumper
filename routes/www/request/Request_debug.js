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

    this.req.logger.debug( 'HTTP Version: ' + ( await this.page.evaluate( () => performance.getEntries()[0].nextHopProtocol ) ).toString() );
    this.req.logger.debug( 'HTTP Status Code: ' + ( await this.responseHTTP.status() ).toString() );
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
    this.res.locals._debug = _debug; // avoid the key 'locals.debug' as it triggers express console outputs
    await this._setHeader( this.res );
    await this._setCookies( this.res );

    this.res.render( 'debug', this.req.app.get( 'config' ) );
  }

}