const Request_Base = require( './Request_Base.js' );
module.exports = class Request_Image extends Request_Base {

  bodyWidth;
  bodyHeight;

  /**
   * Get scroll width and height of the rendered page and set viewport.
   * @returns {Promise<void>}
   * @private
   */
  async _initialize() {

    this.bodyWidth   = this.req.query.viewport.width  || await this.page.evaluate( () => document.body.scrollWidth );
    this.bodyHeight  = this.req.query.viewport.height || await this.page.evaluate( () => document.body.scrollHeight );
    this.req.debug.log( 'page dimensions:', this.bodyWidth, this.bodyHeight );
    await this.page.setViewport( {
      width:  this.bodyWidth,
      height: this.bodyHeight
    } );

  }

  async do() {

    let _img = await this.page.screenshot( this._getScreenShotOptions( this.req, this.bodyWidth, this.bodyHeight ) );
    this.res.writeHead( 200, { 'Content-Type': 'image/' + this.type } );
    this.res.end( _img, 'binary' );

  }

    _getScreenShotOptions( req, bodyWidth, bodyHeight ) {
      if ( ! ( req.query.ssw || req.query.ssh || req.query.ssx || req.query.ssy ) ) {
        return {
          'fullPage': true
        };
      }
      let _ssx  = req.query.ssx;
      let _ssy  = req.query.ssy;
      let _maxW = bodyWidth - _ssx;
      let _maxH = bodyHeight - _ssy;
      let _ssw  = req.query.ssw || _maxW;
      _ssw = Math.min( _ssw, _maxW );
      let _ssh  = req.query.ssh || _maxH;
      _ssh = Math.min( _ssh, _maxH );
      req.debug.log( 'screenshot height calc', _ssh, _maxH, 'body height', bodyHeight, 'y offset', _ssy, 'document height' );
      req.debug.log( 'screenshot dimension', _ssx, _ssy, _ssw, _ssh );
      return {
        clip: {
          x: _ssx,
          y: _ssy,
          width: _ssw,
          height: _ssh,
        }
      };
    };

}