const Request_File = require( './Request_File.js' );
module.exports = class Request_pdf extends Request_File {

  type = 'pdf';

  async do() {

    let _pdfOptions = this._getPDFArguments( this.req.query.pdf );
    console.log( 'pdf options:', _pdfOptions );
    this.res.setHeader('Content-Disposition','filename="' + this.hostName + '.pdf"' ); // set the file name.
    this.res.writeHead( 200, { 'Content-Type': 'application/pdf' } );
    this.res.end( await this.page.pdf( _pdfOptions ), 'binary' );

  }

    _getPDFArguments( queryPDF ) {
      if ( ! queryPDF ) {
        return {};
      }
      delete queryPDF.path;
      if ( queryPDF.scale ) {
        queryPDF.scale = parseFloat( queryPDF.scale );
      }
      if ( queryPDF.displayHeaderFooter ) {
        queryPDF.displayHeaderFooter = Boolean( queryPDF.displayHeaderFooter );
      }
      if ( queryPDF.printBackground ) {
        queryPDF.printBackground = Boolean( queryPDF.printBackground );
      }
      if ( queryPDF.landscape ) {
        queryPDF.landscape = Boolean( queryPDF.landscape );
      }
      if ( queryPDF.preferCSSPageSize ) {
        queryPDF.preferCSSPageSize = Boolean( queryPDF.preferCSSPageSize );
      }
      return queryPDF;
    }

}