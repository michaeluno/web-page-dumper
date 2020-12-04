const puppeteer = require('puppeteer');
const express = require('express');
const router  = express.Router();
const urlModule = require( 'url' );
const fs = require("fs");
const path = require('path');
const hash = require( 'object-hash' ); // @see https://www.npmjs.com/package/object-hash
const fse = require( 'fs-extra' );
const username = require( 'username' );
const util = require('util');
const cacheLifespan = 86400;

let requestStarted;
let debugOutput     = [];
let browserWSEndpoint;
/**
 * Stores flags indicating whether a URL request is handled or not.
 * @type {{}}
 */
let requested = {};

router.get('/', function(req, res, next ) {
  _handleRequest( req, res, next );
});
router.post('/', function(req, res, next ) {
  _handleRequest( req, res, next );
});

// @see system temp dir https://www.npmjs.com/package/temp-dir
// console.log( new Date().toLocaleTimeString(),  tempDirectory );

module.exports = router;

function _handleRequest( req, res, next ) {

  requestStarted = Date.now();
  debugOutput    = [];
  requested      = {};
  let _urlThis = 'undefined' !== typeof req.query.url && req.query.url
    ? decodeURI( req.query.url ).replace(/\/$/, "") // trim trailing slashes
    : '';
  if ( ! _urlThis ) {
    res.render( 'index', req.app.get( 'config' ) );
    return;
  }

  req.query = _getQueryFormatted( req.query );

  (async () => {
    try {
      await _render( _urlThis, req, res );
    } catch ( e ) {
      debugLog( e );
      next( e );
    }
  })();

}
  function _getQueryFormatted( query ) {
    query.output  = 'undefined' !== typeof query.output && query.output ? query.output.toLowerCase() : '';
    query.cache   = 'undefined' === typeof query.cache
      ? true
      : !! parseInt( query.cache );
    query.cache_duration = 'undefined' === typeof query.cache_duration
        ? cacheLifespan
        : ( parseInt( query.cache_duration ) || cacheLifespan );
    query.timeout = 'undefined' === typeof query.timeout ? 30000 : parseInt( query.timeout );
    query.reload  = !! parseInt( query.reload );
    query.vpw     = parseInt( query.vpw );
    query.vph     = parseInt( query.vph );
    query.ssw     = parseInt( query.ssw );
    query.ssh     = parseInt( query.ssh );
    query.ssx     = parseInt( query.ssx ) || 0;
    query.ssy     = parseInt( query.ssy ) || 0;
    debugLog( 'query', query );
    return query;
  }
  /**
   * Display the fetched contents
   * @param urlThis
   * @param req
   * @param res
   * @private
   * @see https://github.com/puppeteer/puppeteer/issues/1273#issuecomment-667646971
   */
  async function _render( urlThis, req, res ) {

    let _typeOutput = req.query.output;

    let browser  = await _getBrowser( browserWSEndpoint, req );

    // Incognito mode
    // let context = await browser.createIncognitoBrowserContext();
    // let page    = await context.newPage();
    // const [page] = await context.pages(); // <-- causes an error

    let page    = await browser.newPage();
    // const [page] = await browser.pages(); // uses the tab already opened when launched

    // Use cache
    debugLog( 'use cache:', req.query.cache );
    await page.setCacheEnabled( req.query.cache );
    await page._client.send( 'Network.setCacheDisabled', {  // @see https://github.com/puppeteer/puppeteer/issues/2497#issuecomment-509959074
      cacheDisabled: ! req.query.cache
    });

    // User Agent
    await page.setUserAgent( req.query.user_agent || ( await browser.userAgent() ).replace( 'Headless', '' ) );

    // Caching
    // await _disableHTMLResources( page, req, _typeOutput, urlThis );
    // await _handleCaches( page, req ); // @deprecated

    // Debug
    page.on( 'response', async _response => {
      if ( ! await _response.fromCache() ) {
        debugLog( 'not using cache:', await _response.request().resourceType(), await _response.url() );
      }
    });

    let responseHTTP = await page.goto( urlThis, {
      waitUntil: [ "networkidle0", "networkidle2", "domcontentloaded" ],
      timeout: req.query.timeout,
    });

    if ( req.query.reload ) {
      debugLog( 'reloading' );
      responseHTTP = await page.reload({ waitUntil: [ "networkidle0", "networkidle2", "domcontentloaded" ] } );
    }

    debugLog( 'Elapsed:', Date.now() - requestStarted, 'ms' );

    await _processRequest( urlThis, page, req, res, responseHTTP, _typeOutput );
    await page.goto( 'about:blank' );

    // Clear cookies @see https://github.com/puppeteer/puppeteer/issues/5253#issuecomment-688861236
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies' );

    browserWSEndpoint = browser.wsEndpoint();
    await page.close();
    // await browser.close(); // not closing the browser instance to reuse it



  }

    async function _getBrowser( browserWSEndpoint, req ) {

      let _userDataDirPath = req.app.get( 'tempDirPath' ) + '/user-data/' + await username();

      try {

        browserWSEndpoint = browserWSEndpoint.includes( '--user-data-dir=' )
          ? browserWSEndpoint
          : browserWSEndpoint + '?--user-data-dir="' + _userDataDirPath + '"'; // @see https://docs.browserless.io/blog/2019/05/03/improving-puppeteer-performance.html
        debugLog( 'browser ws endpoint:', browserWSEndpoint );
        return await puppeteer.connect({browserWSEndpoint: browserWSEndpoint } );

      } catch (e) {

        debugLog( 'newly launching browser' );
        return await puppeteer.launch({
          headless: true,
          userDataDir: _userDataDirPath,
          args: [

            '--start-maximized', // Start in maximized state for screenshots // @see https://github.com/puppeteer/puppeteer/issues/1273#issuecomment-667646971
            '--disk-cache-dir=' + req.app.get( 'tempDirPath' ) + '/user-data/disk-cache',

            '--disable-background-networking',

            // To save CPU usage, @see https://stackoverflow.com/a/58589026
            // '--no-sandbox',
            // '--disable-setuid-sandbox',
            // '--disable-dev-shm-usage',
            // '--disable-accelerated-2d-canvas',
            // '--no-first-run',
            // '--no-zygote',
            // '--disable-gpu'

            // Not working
            // '--single-process', // <- causes an error in Windows
            // '--incognito', // <-- doesn't create new tabs in the incognito window

            // For more options @see https://github.com/puppeteer/puppeteer/issues/824#issue-258832025
          ]
        });
      }
    }

    /**
     *
     * @param   page
     * @param   req
     * @param   typeOutput
     * @param   urlRequest
     * @returns {Promise<void>}
     * @private
     * @see     https://qiita.com/unhurried/items/56ea099c895fa437b56e
     * @see     https://github.com/puppeteer/puppeteer/issues/5334
     */
    async function _disableHTMLResources( page, req, typeOutput, urlRequest ) {

      await page.setRequestInterception( true );

      let _imageExtensions = [ 'pdf', 'jpg', 'jpeg', 'png', 'gif' ];
      if ( _imageExtensions.includes( typeOutput ) ) {
        await page.setRequestInterception( false );
        return;
      }
      let _urlParsedMain = urlModule.parse( urlRequest );
      page.on( 'request', async request => {

        let _urlParsedThis = urlModule.parse( request.url() );

        // Resources from 3rd party domains
        // @deprecated Redirected responses become unavailable such as entering https://amazon.com which results in https://www.amazon.com
        // let _hostThis      = _urlParsedThis.hostname;
        // if ( ! _hostThis.hostname.includes( _urlParsedMain ) ) {
        //   debugLog( 'requested host', _urlParsedMain.hostname, 'parsing host', _hostThis );
        //   requested[ request.url() ] = true;
        //   request.abort();
        //   return;
        // }

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
              await request.continue();
              // allows the cache method to handle it
              break;
          }
        } catch ( e ) {
          debugLog( e );
        }

      } );
    }

    /**
     * @param page
     * @param req
     * @returns {Promise<void>}
     * @private
     */
    async function _handleCaches( page, req ) {

      if ( ! req.query.cache ) {
        debugLog( 'cache is disabled' );
        return;
      }

      await page.setRequestInterception( true );

      let _cacheDuration = req.query.cache_duration;

      /**
       * Sending cached responses.
       * @see https://stackoverflow.com/a/58639496
       * @see https://github.com/puppeteer/puppeteer/issues/3118#issuecomment-643531996
       */
      page.on( 'request', async request => {

        // Already handled in other callbacks.
        if ( requested[ await request.url() ] ) {
          debugLog( 'already handled:', await request.url() );
          return;
        }

        // Document is often not cached. Other types such as image and font are usually cached.
        let _resourceType = await request.resourceType();
        // if ( ! [ 'document' ].includes( _resourceType ) ) {
        //   await request.continue();
        //   return;
        // }

        let _hash = _getCacheHash( await request.url(), _resourceType, await request.method(), req.query );
        let _cachePath = req.app.get( 'tempDirPathCache' ) + path.sep + _hash + '.dat';
        let _cachePathContentType = req.app.get( 'tempDirPathCache' ) + path.sep + _hash + '.type.txt';

        requested[ await request.url() ] = true;
        try {
          if ( fs.existsSync( _cachePath ) && ! _isCacheExpired( _cachePath, _cacheDuration ) ) {
            let _contentType = fs.existsSync( _cachePathContentType ) ? await fse.readFile( _cachePathContentType, 'utf8' ) : undefined;
            debugLog( 'using cache:', _resourceType, await request.url() );
            request.respond({
                status: 200,
                contentType: _contentType,
                body: await fse.readFile( _cachePath )
            });
            return;
          }
          await request.continue();
        } catch (err) {
          debugLog( err );
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
          let _resourceType = await response.request().resourceType();
          // if ( ! [ 'document' ].includes( _resourceType ) ) {
          //   return;
          // }
          let _hash         = _getCacheHash( await response.url(), _resourceType, response.method, req.query );
          let _cachePath   = req.app.get( 'tempDirPathCache' ) + path.sep + _hash + '.dat';
          if ( ! _isCacheExpired( _cachePath, _cacheDuration ) ) {
            return;
          }

          let _cachePathContentType = req.app.get( 'tempDirPathCache' ) + path.sep + _hash + '.type.txt';
          let _buffer      = await response.buffer();
          if ( ! _buffer.length ) {
            return;
          }
          debugLog( 'save cache', _hash, 'resourceType', await response.request().resourceType(), 'method', response.method, 'url', await response.url() );
          await fse.outputFile( _cachePath, _buffer );
          let _contentType = response.contentType ? response.contentType : response.headers()[ 'content-type' ]; // same as headers[ 'Content-Type' ];
          if ( _contentType ) {
            await fse.outputFile( _cachePathContentType, _contentType );
          }

      });

    }
    async function _processRequest( url, page, req, res, responseHTTP, _type ) {

      if ( [ 'debug' ].includes( _type ) ) {
        res.locals.debugOutput = debugOutput;
        res.render( 'debug', req.app.get( 'config' ) );
        return;
      }

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
        // debugLogconsole.log( 'Headers Sanitized', _sanitizeHeaders( _headers ) );

  //       Object.keys( _headers ).forEach(function(key, index) {
  // debugLog( key, this[key] );
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
      let _bodyWidth  = req.query.vpw || await page.evaluate( () => document.body.scrollWidth );
      let _bodyHeight = req.query.vph || await page.evaluate( () => document.body.scrollHeight );
      debugLog( 'viewport:', _bodyWidth, _bodyHeight, 'document body: ', await page.evaluate( () => document.body.scrollWidth ), await page.evaluate( () => document.body.scrollHeight ) );
      await page.setViewport({ width: _bodyWidth, height: _bodyHeight });

      if ( [ 'jpg', 'jpeg', 'png', 'gif' ].includes( _type ) ) {
        _type = 'jpg' === _type ? 'jpeg' : _type;
        let _getScreenShotOptions = function( req, bodyWidth, bodyHeight ) {
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
          debugLog( 'screenshot height calc', _ssh, _maxH, 'body height', bodyHeight, 'y offset', _ssy, 'document height' );
          debugLog( 'screenshot dimension', _ssx, _ssy, _ssw, _ssh );
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
   * @param urlResource
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
  function _getCacheHash( urlResource, resourceType, method, query ) {
    let _hashObject  = {
      url: urlResource,
    };
    if ( [ 'document' ].includes( resourceType ) ) {
      _hashObject[ 'method' ] = method;
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
    // debugLog( 'expired:', _seconds >= cacheLifetime, 'modified time: ', _mtime, `modified ${_seconds} ago` );
    return _seconds >= cacheLifetime;
  }

  function debugLog( ...args ) {
    args.unshift( new Date().toLocaleTimeString( [], { hour12: false } ) );
    console.log.apply(null, args );
    debugOutput.push( util.format.apply( null, args ) );
  }