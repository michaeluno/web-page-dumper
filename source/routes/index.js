const puppeteer = require('puppeteer');
var express = require('express');
var router  = express.Router();

router.get('/', function(req, res) {
  _handleRequest( req, res );
});
router.post('/', function(req, res) {
  _handleRequest( req, res );
});

module.exports = router;

function _handleRequest( req, res ) {

  var url = 'undefined' !== typeof req.query.url && req.query.url
    ? decodeURI( req.query.url )
    : '';
  if ( ! url ) {
    res.render('index', req.app.get( 'config' ));
    return;
  }

  // Display the fetched contents
  _requestWithPuppeteer( url, req, res );

}
  /**
   *
   * @param url
   * @param req
   * @param res
   * @private
   * @see https://github.com/puppeteer/puppeteer/issues/1273#issuecomment-667646971
   */
  function _requestWithPuppeteer( url, req, res ) {
    (async () => {

        const browser = await puppeteer.launch({
          headless: true,

          userDataDir: '/tmp/user-data-dir',
          args: [
            '--no-sandbox',
            '--start-maximized', // Start in maximized state // @see https://github.com/puppeteer/puppeteer/issues/1273#issuecomment-667646971
            // '--disk-cache-dir=./Temp/browser-cache-disk',
          ]
        });
        const page = await browser.newPage();
        await page.setCacheEnabled( true );
        await page.goto( url, {
            waitUntil: [ "networkidle0", "domcontentloaded" ],
            timeout: 30000,
        });
        if ( req.query.reload ) {
          await page.reload({ waitUntil: [ "networkidle0", "domcontentloaded" ] } );
        }
        await _processRequest( page, req, res );
        await browser.close();

    })();
  }
    async function _processRequest (page, req, res) {

      let _type = 'undefined' !== typeof req.query.output && req.query.output
        ? req.query.output.toLowerCase()
        : '';

      if ( ! _type || ['htm', 'html'].includes(_type)) {
        let _html = await page.content();
        res.send( _html );
        return;
      }

      // Get scroll width and height of the rendered page and set viewport
      let bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      let bodyHeight = await page.evaluate(() => document.body.scrollHeight);
      await page.setViewport({ width: bodyWidth, height: bodyHeight });

      if ( [ 'jpg', 'jpeg', 'png' ].includes( _type ) ) {
        _type = 'jpg' === _type ? 'jpeg' : _type;
        // await page.setViewport({ width: 1024, height: 800 });
        var _img = await page.screenshot( {
          'fullPage': true
        } );
        res.writeHead( 200, { 'Content-Type': 'image/' + _type } );
        res.end( _img, 'binary' );
        return;
      }

      if (['pdf'].includes(_type)) {
        //await page.pdf({ path: 'hn.pdf', format: 'A4' });
        var _pdf = await page.pdf({
          format: 'A4'
        });
        res.writeHead( 200, { 'Content-Type': 'application/pdf' } );
        res.end( _pdf, 'binary' );
        return;
      }
    }