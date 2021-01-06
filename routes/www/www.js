const express = require('express');
const router  = express.Router();
const urlModule = require( 'url' );
const fs = require("fs");
const path = require('path');
const hash = require( 'object-hash' ); // @see https://www.npmjs.com/package/object-hash
const fse = require( 'fs-extra' );
const cacheLifespan = 86400;
const Debug = require( '../../utility/debug.js' );

const puppeteerExtra  = require( 'puppeteer-extra' );
const pluginStealth   = require( 'puppeteer-extra-plugin-stealth' );
const useProxy        = require( 'puppeteer-page-proxy' );

const Request_json    = require( './request/Request_json' );
const Request_debug   = require( './request/Request_debug' );
const Request_html    = require( './request/Request_html' );
const Request_mhtml   = require( './request/Request_mhtml' );
const Request_pdf     = require( './request/Request_pdf' );
const Request_jpeg    = require( './request/Request_jpeg' );
const Request_png     = require( './request/Request_png' );

let browserEndpoints = {};
let startedBrowsers  = {};

/**
 * Stores flags indicating whether a URL request is handled or not.
 * @type {{}}
 * @deprecated Not used anymore as the cache mechanism are deprecated. Also, declaring it in this scope is somewhat error prone as it will be continuously available in different requests.
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

  requested    = {};
  req.debug    = new Debug;
  let _urlThis = 'undefined' !== typeof req.query.url && req.query.url
    ? decodeURI( req.query.url ).replace(/\/$/, "") // trim trailing slashes
    : '';
  if ( ! _urlThis ) {
    res.render( 'index', req.app.get( 'config' ) );
    return;
  }

  req.query = _getQueryFormatted( req.query, req );
  req.debug.log( 'query', req.query );

  (async () => {
    try {
      await _render( _urlThis, req, res );
    } catch ( e ) {
      req.debug.log( e );
      next( e );
    }
  })();

}
  function _getQueryFormatted( query ) {

    // Required
    query.output   = 'undefined' !== typeof query.output && query.output ? query.output.toLowerCase() : '';

    // Cache
    query.cache    = 'undefined' === typeof query.cache
      ? true
      : !! parseInt( query.cache );

    // @deprecated
    // query.cache_duration      = 'undefined' === typeof query.cache_duration
    //     ? cacheLifespan
    //     : ( parseInt( query.cache_duration ) || cacheLifespan );

    query.timeout             = 'undefined' === typeof query.timeout ? 30000 : parseInt( query.timeout );
    query.reload              = !! parseInt( query.reload );

    // Viewport
    query.viewport            = 'undefined' === typeof query.viewport ? {} : query.viewport;
    if ( query.viewport.width ) {
      query.viewport.width      = parseInt( query.viewport.width );
    }
    if ( query.viewport.height ) {
      query.viewport.height     = parseInt( query.viewport.height );
    }
    if ( query.viewport.deviceScaleFactor ) {
      query.viewport.deviceScaleFactor = parseInt( query.viewport.deviceScaleFactor );
    }
    if ( query.viewport.isMobile ) {
      query.viewport.isMobile = Boolean( query.viewport.isMobile );
    }
    if ( query.viewport.isLandscape ) {
      query.viewport.isLandscape = Boolean( query.viewport.isLandscape );
    }

    // Screenshot
    query.screenshot          = 'undefined' === typeof query.screenshot ? {} : query.screenshot;
    query.screenshot.clip     = 'undefined' === typeof query.screenshot.clip ? {} : query.screenshot.clip;

    // Basic Authentication
    query.password = 'undefined' === typeof query.password ? '' : query.password;

    // Additional HTTP Headers
    query.headers             = 'undefined' === typeof query.headers ? {} : query.headers;

    // .launch( { arg: ... } )
    query.args                = 'undefined' === typeof query.args ? [] : query.args;

    // PDF
    query.pdf                 = query.pdf || {};

    // Proxy
    query.proxy               = 'undefined' === typeof query.proxy
      ? null
      : ( query.proxy.includes("://" ) ? query.proxy : null );

    // Block resources
    query.block = _getBlockResources( query.output, query );

    return query;
  }
    function _getBlockResources( outputType, query ) {

      let _block   = 'undefined' === typeof query.block ? { 'types': [], 'urls': [] } : query.block;
      _block.types = 'undefined' === typeof _block.types ? [] : _block.types;
      _block.urls  = 'undefined' === typeof _block.urls  ? [] : _block.urls;

      // Supported types: stylesheet, image, font, script.
      // Unsupported: document, media, texttrack, xhr, fetch, eventsource, websocket, manifest, other.
      if ( [ 'html', 'htm', 'json' ].includes( outputType ) ) {
        _block.types = [ 'stylesheet', 'image', 'font' ];
      }
      return _block;

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

    let _keyQuery = hash( {
      'args': req.query.args,
    } );
    startedBrowsers[ _keyQuery ] = Date.now();
    let browser  = await _getBrowser( browserEndpoints[ _keyQuery ], req );
    browserEndpoints[ _keyQuery ] = browser.wsEndpoint();
    // Incognito mode - deprecated as a new tab cannot be created but it forces to open a new window
    // let context = await browser.createIncognitoBrowserContext();
    // let page    = await context.newPage();
    // const [page] = await context.pages(); // <-- causes an error

    let page    = await browser.newPage();
    // const [page] = await browser.pages(); // uses the tab already opened when launched

    // Proxy
    if ( req.query.proxy ) {
      req.debug.log( 'Using a proxy: ', req.query.proxy );
      await useProxy( page, req.query.proxy );
    }
    await useProxy( page, req.query.proxy );

    // Use cache
    req.debug.log( 'use cache:', req.query.cache );
    await page.setCacheEnabled( req.query.cache );
    await page._client.send( 'Network.setCacheDisabled', {  // @see https://github.com/puppeteer/puppeteer/issues/2497#issuecomment-509959074
      cacheDisabled: ! req.query.cache
    });

    // User Agent
    await page.setUserAgent( req.query.user_agent || ( await browser.userAgent() ).replace( 'Headless', '' ) );

    // HTTP Basic Authentication
    if ( req.query.username ) {
      await page.authenticate({ 'username': req.query.username , 'password': req.query.password } );
    }

    // Caching
    // await _disableHTMLResources( page, req, _typeOutput, urlThis );
    // await _handleCaches( page, req ); // @deprecated

    // Debug
    // page.on( 'response', async _response => {
    //   req.debug.log( await _response.fromCache() ? 'using cache:' : 'not using cache:', await _response.request().resourceType(), await _response.url() );
    // });

    // Viewport - set_viewport is needed for a case that the user once set viewport options and then uncheck the Set view port check box.
    if ( req.query.set_viewport && req.query.viewport.width && req.query.viewport.height ) {
      await page.setViewport( req.query.viewport );
    }

    // Additional HTTP headers.
    if ( req.query.headers.length ) {
      await page.setExtraHTTPHeaders( req.query.headers );
    }

    // Block resources
    await page._client.send( 'Network.setBlockedURLs', { urls: _getBlockedResources( req.query.block.types, req.query.block.urls ) } );
    if ( req.query.block.types.includes( 'script' ) ) {
      await page.setJavaScriptEnabled( false );
    }

    // Request
    let responseHTTP = await page.goto( urlThis, {
      waitUntil: [ "networkidle0", "networkidle2", "domcontentloaded" ],
      timeout: req.query.timeout,
    });

    if ( req.query.reload ) {
      req.debug.log( 'reloading' );
      responseHTTP = await page.reload({ waitUntil: [ "networkidle0", "networkidle2", "domcontentloaded" ] } );
    }

    req.debug.log( 'Elapsed:', Date.now() - startedBrowsers[ _keyQuery ], 'ms' );

    await _processRequest( urlThis, page, req, res, responseHTTP, _typeOutput );

    _closePageLater( page, 100 );

    // If after 60 seconds and the browser is not used, close it.
    const _limitIdle = 60000;
    setTimeout( function( thisBrowser, thisKeyQuery ) {

      if ( 'undefined' === typeof startedBrowsers[ thisKeyQuery ] ) {
        req.debug.log( 'Trying close the browser but it seems already closed.' );
        return;
      }
      if ( Date.now() - startedBrowsers[ thisKeyQuery ] < _limitIdle ) {
        req.debug.log( 'Not closing the browser as it has still activities.' );
        return;
      }
      if ( 'function' !== typeof thisBrowser[ 'close' ] ) {
        req.debug.log( 'Trying close the browser but the browser object is gone.', 'type:', typeof thisBrowser );
        delete browserEndpoints[ thisKeyQuery ];
      }
      thisBrowser.close();
      req.debug.log( 'Closed the browser.' );
      delete browserEndpoints[ thisKeyQuery ];

    }, _limitIdle, browser, _keyQuery );

  }
    function _getBlockedResources( blockedResourceTypes, blockedURLs ) {
      const _blockedResources = [
        // Analytics and other fluff
        '*.optimizely.com',
        'everesttech.net',
        'userzoom.com',
        'doubleclick.net',
        'googleadservices.com',
        'adservice.google.com/*',
        'connect.facebook.com',
        'connect.facebook.net',
        'sp.analytics.yahoo.com',
        // Assets
        '*/favicon.ico',
      ];
      if ( blockedResourceTypes.includes( 'image' ) ) {
        _blockedResources.concat( [
          '.jpg', '.jpeg', '.png', '.svg', '.gif', '.tiff'
        ] );
      }
      if ( blockedResourceTypes.includes( 'script' ) ) {
        _blockedResources.concat( [
          '.js',
        ] );
      }
      if ( blockedResourceTypes.includes( 'font' ) ) {
        _blockedResources.concat( [
          '.woff', '.otf', '.woff2', '.svg', '.ttf', '.eot'
        ] );
      }
      if ( blockedResourceTypes.includes( 'stylesheet' ) ) {
        _blockedResources.concat( [
          '.css',
        ] );
      }
      return _blockedResources.concat( blockedURLs );
    }
    /**
     * Let the HTTP request responded to the client.
     * In the meantime, close the page in the background.
     * @param page
     * @param timeout
     * @private
     */
    function _closePageLater( page, timeout ) {
      (async () => {
        await new Promise(resolve => {
          setTimeout( resolve, timeout );
        })
        // Clear cookies @see https://github.com/puppeteer/puppeteer/issues/5253#issuecomment-688861236
        const client = await page.target().createCDPSession();
        await client.send( 'Network.clearBrowserCookies' );

        // await page.goto( 'about:blank' );
        console.log( 'Closing the page:', await page.url() );
        await page.close();
      })();
    }

    async function _getBrowser( thisBrowserWSEndpoint, req ) {

      let _pathUserDataDir = req.app.get( 'tempDirPathUserDataByDay' );

      try {

        if ( ! thisBrowserWSEndpoint ) {
          throw new Error( 'A previous browser instance does not exist.' );
        }
        
        thisBrowserWSEndpoint = thisBrowserWSEndpoint.includes( '--user-data-dir=' )
          ? thisBrowserWSEndpoint
          : thisBrowserWSEndpoint + '?--user-data-dir="' + _pathUserDataDir + '"'; // @see https://docs.browserless.io/blog/2019/05/03/improving-puppeteer-performance.html

        req.debug.log( 'Reusing the existing browser, ws endpoint:', thisBrowserWSEndpoint );
        return await puppeteerExtra.connect({browserWSEndpoint: thisBrowserWSEndpoint } );

      } catch (e) {

        req.debug.log( 'Newly launching browser.' );
        let _argsMust = [
          '--start-maximized', // Start in maximized state for screenshots // @see https://github.com/puppeteer/puppeteer/issues/1273#issuecomment-667646971
          '--disk-cache-dir=' + _pathUserDataDir + path.sep + 'disk-cache',
          '--disable-background-networking',
          '--no-sandbox' // to run on Heroku @see https://elements.heroku.com/buildpacks/jontewks/puppeteer-heroku-buildpack

          // To save CPU usage, @see https://stackoverflow.com/a/58589026
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
        ];
        req.query.args = req.query.args.filter( element => ! element.includes( "--disk-cache-dir=" ) );
        req.debug.log( 'req.query.args', req.query.args );

        let _args = [...new Set([ ...req.query.args, ..._argsMust ] ) ];
        req.debug.log( 'Browser "args"', _args );

        puppeteerExtra.use( pluginStealth() );

        return await puppeteerExtra.launch({
          headless: true,
          // userDataDir: _pathUserDataDir, // @deprecated 1.1.1 Causes an error "Unable to move the cache: Access is denied" when multiple browsers try to launch simultaneously.
          args: _args,
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

      let _imageExtensions = [ 'pdf', 'jpg', 'jpeg', 'png' ];
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
          req.debug.log( e );
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
        req.debug.log( 'cache is disabled' );
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
          req.debug.log( 'already handled:', await request.url() );
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
            req.debug.log( 'using cache:', _resourceType, await request.url() );
            request.respond({
                status: 200,
                contentType: _contentType,
                body: await fse.readFile( _cachePath )
            });
            return;
          }
          await request.continue();
        } catch (err) {
          req.debug.log( err );
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
          req.debug.log( 'save cache', _hash, 'resourceType', await response.request().resourceType(), 'method', response.method, 'url', await response.url() );
          await fse.outputFile( _cachePath, _buffer );
          let _contentType = response.contentType ? response.contentType : response.headers()[ 'content-type' ]; // same as headers[ 'Content-Type' ];
          if ( _contentType ) {
            await fse.outputFile( _cachePathContentType, _contentType );
          }

      });

    }
    async function _processRequest( url, page, req, res, responseHTTP, _type ) {

      let _factory = {
        'debug':  Request_debug,
        'json':   Request_json,
        'html':   Request_html,   'htm': Request_html,
        'mhtml':  Request_mhtml,
        'pdf':    Request_pdf,
        'jpg':    Request_jpeg,   'jpeg': Request_jpeg,
        'png':    Request_png,
      }
      _type = Object.keys( _factory ).includes( _type ) ? _type : 'json';
      let _request = await _factory[ _type ].instantiate( url, page, req, res, responseHTTP );
      await _request.do();

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
