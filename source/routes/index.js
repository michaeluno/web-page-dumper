const puppeteer = require('puppeteer');
const express = require('express');
const router  = express.Router();
const urlModule = require( 'url' );
const fs = require("fs");
const path = require('path');
const hash = require( 'object-hash' ); // @see https://www.npmjs.com/package/object-hash
const fse = require( 'fs-extra' );
const username = require( 'username' );

const cacheLifespan = 86400;
/**
 * Stores flags indicating whether a URL request is handled or not.
 * @type {{}}
 */
let requested = {};

router.get('/', function(req, res) {
  _handleRequest( req, res );
});
router.post('/', function(req, res) {
  _handleRequest( req, res );
});

// @see system temp dir https://www.npmjs.com/package/temp-dir
// console.log( new Date().toLocaleTimeString(),  tempDirectory );

module.exports = router;

function _handleRequest( req, res ) {
  requested = {};
  let url = 'undefined' !== typeof req.query.url && req.query.url
    ? decodeURI( req.query.url ).replace(/\/$/, "") // trim trailing slashes
    : '';
  if ( ! url ) {
    res.render('index', req.app.get( 'config' ));
    return;
  }
  _render( url, req, res );

}
  /**
   * Display the fetched contents
   * @param url
   * @param req
   * @param res
   * @private
   * @see https://github.com/puppeteer/puppeteer/issues/1273#issuecomment-667646971
   */
  function _render( url, req, res ) {

    let _type = 'undefined' !== typeof req.query.output && req.query.output
      ? req.query.output.toLowerCase()
      : '';

    (async () => {

        const browser = await puppeteer.launch({
          headless: true,
          userDataDir: req.app.get( 'tempDirPath' ) + '/user-data/' + await username(),
          args: [
            '--no-sandbox',
            '--start-maximized', // Start in maximized state // @see https://github.com/puppeteer/puppeteer/issues/1273#issuecomment-667646971
            '--disk-cache-dir=' + req.app.get( 'tempDirPath' ) + '/user-data/disk-cache',
          ]
        });
        const context = await browser.createIncognitoBrowserContext();
        const page = await context.newPage();

        if ( req.query.user_agent ) {
          await page.setUserAgent( req.query.user_agent );
        }

        await _disableImages( page, req, _type, url );
        await _handleCaches( page, req );
        await page.setCacheEnabled( true );
        const responseHTTP = await page.goto( url, {
          waitUntil: [ "networkidle0", "networkidle2", "domcontentloaded" ],
          timeout: 30000,
        });
        if ( parseInt( req.query.reload ) ) {
          await page.reload({ waitUntil: [ "networkidle0", "networkidle2", "domcontentloaded" ] } );
        }

        await _processRequest( url, page, req, res, responseHTTP, _type );
        await browser.close();

    })();
  }
    async function _disableImages( page, req, typeOutput, urlRequest ) {

      let _imageExtensions = [ 'pdf', 'jpg', 'jpeg', 'png', 'gif' ];
      if ( _imageExtensions.includes( typeOutput ) ) {
        return;
      }
      let _urlParsedMain = urlModule.parse( urlRequest );
      page.on( 'request', async request => {

        let _urlParsedThis = urlModule.parse( request.url() );
        let _hostThis      = _urlParsedThis.hostname;

        // Resources from 3rd party domains
        if ( _urlParsedMain.hostname !== _hostThis ) {
            requested[ request.url() ] = true;
            request.abort();
            return
        }
        // Images
        try {
          switch (await request.resourceType()) {
            case "image":
            case "stylesheet":
            case "font":
              requested[ request.url() ] = true;
              await request.abort();
              break;
            default:
              break;
          }
        } catch (e) {
          console.log(e);
        }

      } );
    }
    async function _handleCaches( page, req ) {

      let _cacheDuration = 'undefined' === typeof req.query.cache_duration
        ? cacheLifespan
        : parseInt( req.query.cache_duration );

      /**
       * Sending cached responses.
       * @see https://stackoverflow.com/a/58639496
       * @see https://github.com/puppeteer/puppeteer/issues/3118#issuecomment-643531996
       */
      await page.setRequestInterception( true );
      page.on( 'request', async request => {

        // Already handled in other callbacks.
        if ( requested[ await request.url() ] ) {
          return;
        }

        let _hash = _getCacheHash( request.url(), request.resourceType(), request.method(), req.query );
        let _cachePath = req.app.get( 'tempDirPathCache' ) + path.sep + _hash + '.dat';
        let _cachePathContentType = req.app.get( 'tempDirPathCache' ) + path.sep + _hash + '.type.txt';

        if ( fs.existsSync( _cachePath ) && _isCacheExpired( _cachePath, _cacheDuration ) ) {
          let _contentType = fs.existsSync( _cachePathContentType ) ? await fse.readFile( _cachePathContentType, 'utf8' ) : undefined;
          request.respond({
              status: 200,
              contentType: _contentType,
              body: await fse.readFile( _cachePath ),
          });
          return;
        }

        try {
            await request.continue();
        } catch (err) {
            console.log( new Date().toLocaleTimeString(), err );
        }

      });

      /**
       * Caching responses.
       */
      page.on( 'response', async response => {

          // Handle redirects
          let _status = response.status()
          if ( ( _status >= 300 ) && ( _status <= 399 ) ) {
            return;
          }

          // Save caches
          let _hash        = _getCacheHash( response.url(), response.request().resourceType(), response.method, req.query );
          let _cachePath   = req.app.get( 'tempDirPathCache' ) + path.sep + _hash + '.dat';
          if ( ! _isCacheExpired( _cachePath, _cacheDuration ) ) {
            return;
          }

          let _cachePathContentType = req.app.get( 'tempDirPathCache' ) + path.sep + _hash + '.type.txt';
          let _buffer      = await response.buffer();
          if ( ! _buffer.length ) {
            return;
          }
          await fse.outputFile( _cachePath, _buffer );
          let _contentType = response.contentType ? response.contentType : response.headers()[ 'content-type' ]; // same as headers[ 'Content-Type' ];
          if ( _contentType ) {
            await fse.outputFile( _cachePathContentType, _contentType );
          }

      });

    }
    async function _processRequest( url, page, req, res, responseHTTP, _type ) {

      if ( ! _type || [ 'json' ].includes( _type ) ) {
        res.setHeader( 'Content-Type', 'application/json' );
        res.json( {
          'url': responseHTTP.url(),
          'query': req.query,
          'resourceType': responseHTTP.request().resourceType(),
          'contentType': responseHTTP.contentType ? responseHTTP.contentType : responseHTTP.headers()[ 'content-type' ], // same as headers[ 'Content-Type' ];
          'status': responseHTTP.status(),
          'headers': responseHTTP.headers(),
          'body': await responseHTTP.text(),
        } );
        return;
      }

      if ( [ 'htm', 'html' ].includes( _type ) ) {
        // Transfer response headers
        // const _headers = responseHTTP.headers();
        // console.log( 'Headers Sanitized', _sanitizeHeaders( _headers ) );

  //       Object.keys( _headers ).forEach(function(key, index) {
  // console.log( key, this[key] );
  //           res.setHeader( key, this[key] );
  //         }, _sanitizeHeaders( _headers )
  //       );

        // res.set( _headers );

        let _html = await page.content();
        res.send( _html );
        return;
      }

      if ( [ 'mhtml' ].includes( _type ) ) {
        // Save the HTML document @see https://github.com/puppeteer/puppeteer/issues/3575#issuecomment-447258318
        const session = await page.target().createCDPSession();
        await session.send( 'Page.enable' );
        const {data} = await session.send( 'Page.captureSnapshot' );
        let _hostName = urlModule.parse( url ).hostname;
        res.setHeader( 'Content-Type', 'message/rfc822' );
        res.setHeader('Content-Disposition','attachment;filename="' + _hostName + '.mhtml"' );
        res.setHeader( 'Content-Length', data.length );
        res.send( data );
        return;
      }

      // Get scroll width and height of the rendered page and set viewport
      let _bodyWidth  = parseInt( req.query.vpw ) || await page.evaluate( () => document.body.scrollWidth );
      let _bodyHeight = parseInt( req.query.vph ) || await page.evaluate( () => document.body.scrollHeight );
      await page.setViewport({ width: _bodyWidth, height: _bodyHeight });

      if ( [ 'jpg', 'jpeg', 'png', 'gif' ].includes( _type ) ) {
        _type = 'jpg' === _type ? 'jpeg' : _type;
        let _getScreenShotOptions = function( req, bodyWidth, bodyHeight ) {
          if ( ! ( parseInt( req.query.ssw ) || parseInt( req.query.ssh ) || parseInt( req.query.ssx ) || parseInt( req.query.ssy ) ) ) {
            return {
              'fullPage': true
            };
          }
          let _ssx = parseInt( req.query.ssx ) || 0;
          let _ssy = parseInt( req.query.ssy ) || 0;
          let _maxW = bodyWidth - _ssx;
          let _maxH = bodyWidth - _ssy;
          let _ssw = parseInt( req.query.ssw ) || _maxW;
          _ssw = Math.min( _ssw, _maxW );
          let _ssh = parseInt( req.query.ssh ) || _maxH;
          _ssh = Math.min( _ssh, _maxH );
          return {
            clip: {
              x: _ssx,
              y: _ssy,
              width: _ssw,
              height: _ssh,
            }
          };
        };
        let _img = await page.screenshot( _getScreenShotOptions( req, _bodyWidth, _bodyHeight ) );
        res.writeHead( 200, { 'Content-Type': 'image/' + _type } );
        res.end( _img, 'binary' );
        return;
      }

      if ( ['pdf'].includes( _type ) ) {
        //await page.pdf({ path: 'hn.pdf', format: 'A4' });
        let _pdf = await page.pdf({
          format: 'A4'
        });
        res.writeHead( 200, { 'Content-Type': 'application/pdf' } );
        res.end( _pdf, 'binary' );
      }
    }

  /**
   *
   * @param url
   * @param resourceType Either of the following:
   * - document
   * - stylesheet
   * - image
   * - media
   * - font
   * - script
   * - texttrack
   * - xhr
   * - fetch
   * - eventsource
   * - websocket
   * - manifest
   * - other
   * @see   https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#httprequestresourcetype
   * @param method
   * @param query
   * @returns {*}
   * @private
   */
  function _getCacheHash( url, resourceType, method, query ) {
    let _hashObject  = {
      url: url
    };
    if ( [ 'document' ].includes( resourceType ) ) {
      _hashObject[ 'method' ] = method;
      _hashObject[ 'query' ]  = query;
    }
    return hash( _hashObject );
  }

  function _isCacheExpired( path, cacheLifetime ) {
    if ( ! fs.existsSync( path ) ) {
      return true;
    }
    let _stats   = fs.statSync( path );
    let _mtime   = _stats.mtime;
    let _seconds = (new Date().getTime() - _stats.mtime) / 1000;
    console.log( 'modified time: ', _mtime, `modified ${_seconds} ago`, 'expired?: ', _seconds >= cacheLifetime );
    return _seconds >= cacheLifetime;
  }