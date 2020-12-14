const Request_File = require( './Request_File.js' );
module.exports = class Request_mhtml extends Request_File {

  type = 'mhtml';

  async do() {

    // Save the HTML document @see https://github.com/puppeteer/puppeteer/issues/3575#issuecomment-447258318
    const session = await this.page.target().createCDPSession();
    await session.send( 'Page.enable' );
    const {data} = await session.send( 'Page.captureSnapshot' );
    this.res.setHeader( 'Content-Type', 'message/rfc822' );
    this.res.setHeader('Content-Disposition','attachment;filename="' + this.hostName + '.mhtml"' );
    this.res.setHeader( 'Content-Length', data.length );
    this.res.send( data );

  }

}