const Request_Base = require( './Request_Base.js' );
module.exports = class Request_html extends Request_Base {

  type = 'html';

  async do() {

    await this._setHeader( this.res );
    await this._setCookies( this.res );

    // Output the document
    let _html = await this.page.content();
    this.res.send( _html );

  }

}