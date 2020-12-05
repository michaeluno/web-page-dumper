const Request_File = require( './Request_File.js' );
module.exports = class Request_pdf extends Request_File {

  type = 'pdf';

  async do() {

    let _pdfOptions = {
      format: 'A4',
      path: this.hostName + '.pdf'
    };
    console.log( 'pdf options:', _pdfOptions );
    this.res.setHeader('Content-Disposition','filename="' + this.hostName + '.pdf"' ); // set the file name.
    this.res.writeHead( 200, { 'Content-Type': 'application/pdf' } );
    this.res.end( await this.page.pdf( _pdfOptions ), 'binary' );

  }

}