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

    this.bodyWidth   = await this.page.evaluate( () => document.body.scrollWidth );
    this.bodyHeight  = await this.page.evaluate( () => document.body.scrollHeight );
    this.req.debug.log( 'Page document dimensions:', this.bodyWidth, this.bodyHeight );
    await this.page.setViewport( {
      width:  this.bodyWidth,
      height: this.bodyHeight
    } );

  }

  async do() {

    let _screenshot = this._getScreenShotOptions( this.req, this.bodyWidth, this.bodyHeight );
    this.req.debug.log( 'Screenshot options:', _screenshot );

    await this._autoScroll( this.page );
    let _img = await this.page.screenshot( _screenshot );

    await this._setHeader( this.res );

    if ( 'base64' !== _screenshot.encoding ) {
      this.res.writeHead( 200, { 'Content-Type': 'image/' + this.type } );
      this.res.end( _img, 'binary' );
      return;
    }
    this.res.writeHead( 200, { 'Content-Type': 'text/plain' } );
    this.res.end( _img, 'utf8' );

  }

    _getScreenShotOptions( req, bodyWidth, bodyHeight ) {

      let _screenshot = req.query.screenshot

      delete _screenshot.fullPage;
      delete _screenshot.path;
      _screenshot.type = this.type;
      if ( 'undefined' !== typeof _screenshot.quality ) {
        _screenshot.quality        = parseInt( _screenshot.quality );
      }
      if ( 'undefined' !== typeof _screenshot.omitBackground ) {
        _screenshot.omitBackground = Boolean( _screenshot.omitBackground );
      }
      if ( 'base64' !== _screenshot.encoding ) {
        delete _screenshot.encoding;
      }
      _screenshot.clip.width  = parseInt( this.req.query.screenshot.clip.width );
      _screenshot.clip.height = parseInt( this.req.query.screenshot.clip.height );
      _screenshot.clip.x      = parseInt( this.req.query.screenshot.clip.x ) || 0;
      _screenshot.clip.y      = parseInt( this.req.query.screenshot.clip.y ) || 0;

      if ( ! ( req.query.screenshot.clip.width || req.query.screenshot.clip.height || req.query.screenshot.clip.x || req.query.screenshot.clip.y ) ) {
        _screenshot.fullPage = true;
        delete _screenshot.clip;
        return _screenshot;
      }
      let _ssx  = _screenshot.clip.x;
      let _ssy  = _screenshot.clip.y;
      let _maxW = bodyWidth - _ssx;
      let _maxH = bodyHeight - _ssy;
      let _ssw  = _screenshot.clip.width || _maxW;
      _ssw = Math.min( _ssw, _maxW );
      let _ssh  = _screenshot.clip.height || _maxH;
      _ssh = Math.min( _ssh, _maxH );
      req.debug.log( 'screenshot height calc', _ssh, _maxH, 'body height', bodyHeight, 'y offset', _ssy, 'document height' );
      req.debug.log( 'screenshot dimension', _ssx, _ssy, _ssw, _ssh );
      _screenshot.clip = {
        x: _ssx,
        y: _ssy,
        width: _ssw,
        height: _ssh,
      }
      return _screenshot;
    };

  /**
   * @see https://stackoverflow.com/a/53527984
   * @param page
   * @returns {Promise<void>}
   */
  async _autoScroll(page){
    await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
        let totalHeight = 0;
        let distance = 100;
        let timer = setInterval(() => {
          let scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if(totalHeight >= scrollHeight){
              clearInterval(timer);
              resolve();
          }
        }, 100);
      });
    });
  }

}