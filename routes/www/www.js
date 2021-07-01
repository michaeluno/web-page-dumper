const express = require('express');
const router  = express.Router();
const path    = require('path');
const hash    = require( 'object-hash' ); // @see https://www.npmjs.com/package/object-hash
const fs      = require('fs');
const getDate = require( '../../utility/getDate' );

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

const Action_select             = require( './action/Action_select' );
const Action_click              = require( './action/Action_click' );
const Action_remove             = require( './action/Action_remove' );
const Action_type               = require( './action/Action_type' );
const Action_choose             = require( './action/Action_choose' );
const Action_extract            = require( './action/Action_extract' );
const Action_waitForTimeout     = require( './action/Action_waitForTimeout' );
const Action_waitForElement     = require( './action/Action_waitForElement' );
const Action_waitForNavigation  = require( './action/Action_waitForNavigation' );

let browserEndpoints = {};
let startedBrowsers  = {};

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

  let _urlThis = 'undefined' !== typeof req.query.url && req.query.url
    ? decodeURI( req.query.url ).replace(/\/$/, "") // trim trailing slashes
    : '';
  if ( ! _urlThis ) {
    res.render( 'index', req.app.get( 'config' ) );
    return;
  }

  req.query = _getQueryFormatted( req.query, req );
  req.logger.debug( 'query', req.query );

  (async () => {
    try {
      await _render( _urlThis, req, res );
    } catch ( e ) {
      req.logger.error( 'Caught an exception while processing the request.', e );
      // req.debug.log( e );
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

    // waitUntil - convert it to array
    query.waituntil = 'undefined' === typeof query.waituntil ? 'load' : query.waituntil;
    if ( ! Array.isArray( query.waituntil ) ) {
      query.waituntil = [ query.waituntil ];
    }
    query.waituntil = query.waituntil.filter( function( value ){
      return [ 'load', 'domcontentloaded', 'networkidle0', 'networkidle2' ].includes( value ); // drop unaccepted values
    } );
    if ( 0 === query.waituntil.length ) {
      query.waituntil = [ 'load' ];
    }

    // Actions
    query.action = Array.isArray( query.action ) ? query.action : [];

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

    let _keyQueryDefault = hash({
      'args': [],
    })
    let _keyQuery = hash( {
      'args': req.query.args,
    } );

    startedBrowsers[ _keyQuery ] = Date.now();
    let browser  = await _getBrowser( browserEndpoints[ _keyQuery ], req );
    browserEndpoints[ _keyQuery ] = await browser.wsEndpoint();
    req.logger.browser( 'Current Browser Instance: ' + Object.keys( browserEndpoints ).length );
    // Incognito mode - deprecated as a new tab cannot be created but it forces to open a new window
    // let context = await browser.createIncognitoBrowserContext();
    // let page    = await context.newPage();
    // const [page] = await context.pages(); // <-- causes an error

    let page    = await browser.newPage();
    // const [page] = await browser.pages(); // uses the tab already opened when launched

    // Proxy
    if ( req.query.proxy ) {
      req.logger.debug( 'Using a proxy: ' + req.query.proxy );
      await useProxy( page, req.query.proxy );
    }

    // Use cache
    req.logger.debug( 'Using cache: ' + ( req.query.cache ).toString() );
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
      waitUntil: req.query.reload ? 'load' : req.query.waituntil,
      timeout: req.query.timeout,
    });

    if ( req.query.reload ) {
      req.logger.debug( 'Reloading' );
      responseHTTP = await page.reload({ waitUntil: req.query.waituntil } );
    }

    req.logger.debug( 'Elapsed: ' + ( Date.now() - startedBrowsers[ _keyQuery ] ).toString() + ' ms' );

    await _doActions( page, req, res );

    await _processRequest( urlThis, page, req, res, responseHTTP, _typeOutput );

    _closePageLater( page, 100 );

    if ( _keyQueryDefault !== _keyQuery ) {
      _closeBrowserLater( browser, _keyQuery, req, 60000 );
    }

  }

    /**
     * Performs actions defined in the `action` URL query parameter.
     * @param page
     * @param req
     * @param res
     * @private
     * @since 1.5.0
     * @see https://devdocs.io/puppeteer-page/
     */
    async function _doActions( page, req, res ) {
      const actionsAccepted = [
        // Puppeteer page methods @see https://devdocs.io/puppeteer-page/
        // click( selector )
        // type( selector, keywords )
        // focus( selector )
        // tap( selector )
        // hover( selector )
        // waitFor( milliseconds )
        // select( selector, value ) for the <select> element
      ];
      let _factoryActions = {
        // the parameter takes a selector
        'select':             Action_select,            // selects elements
        'click':              Action_click,             // clicks on an element
        'remove':             Action_remove,            // removes elements
        'waitForElement':     Action_waitForElement,    // waits for an element to appear
        'extract':            Action_extract,           // extracts elements

        // the parameter takes not a selector
        'type':               Action_type,              // types text in input fields
        'choose':             Action_choose,            // select an item of a <select> element
        'waitForTimeout':     Action_waitForTimeout,
        'waitForNavigation':  Action_waitForNavigation,

        // Not implemented below yet
        // 'focus':    Action_focus,      // focuses on an UI element
        // 'tap':      Action_tap,        // taps an element
        // 'wait':     Action_wait,       // waits for navigation/element/milliseconds
        // 'press':    Action_press,      // presses down a keyboard key
      }
      const _actions = req.query.action;
      req.logger.debug( 'actions', _actions );

      let _previousSelector;

      for ( let _i=0; _i < _actions.length; _i++ ) {

        let _actionSet = _actions[ _i ];
        if ( typeof _actionSet !== 'object' || _actionSet === null ) {
          continue;
        }

        req.logger.debug( 'action-set', _actionSet );
        for ( const _keyAction in _actionSet ) {
          if ( ! _actionSet.hasOwnProperty( _keyAction ) ) {
            continue;
          }

          let _value = _actionSet[ _keyAction ];
          _previousSelector = _value && _factoryActions[ _keyAction ].takesSelector()
            ? _value
            : _previousSelector;

          if ( 'select' === _keyAction ) {
            continue;
          }
          if ( ! _previousSelector ) {
            continue;
          }
          req.logger.debug( 'action: ' + _keyAction + ' selector: ' + _previousSelector + ' value: ', _value );

          // There is a case that the value is an object such as
          // {
          //   "0": "//form[@id='sp-cc']",
          //   "1": "//div[contains(.,'ShovelerList')]"
          // }
          // when the action parameter is like
          // {
          //   "remove": [
          //     "//form[@id='ab-cd']",
          //     "//div[contains(.,'SomeList')]"
          //   ],
          // }
          // Note that somehow it is not an array but an object.
          if ( 'object' === typeof _value && null !== _value ) {
            for ( const _index in _value ) {
              if ( ! _value.hasOwnProperty( _index ) ) {
                continue;
              }
              _previousSelector = _value[ _index ] && _factoryActions[ _keyAction ].takesSelector()
                ? _value[ _index ]
                : _previousSelector;
              let _action = await _factoryActions[ _keyAction ].instantiate( page, _previousSelector, _value[ _index ], req, res );
              await _action.do();
            }
            continue;
          }
          // The value is a string
          let _action = await _factoryActions[ _keyAction ].instantiate( page, _previousSelector, _value, req, res );
          await _action.do();

        }
      }

    }


    function _closeBrowserLater( browser, _keyQuery, req, _limitIdle ) {

      setTimeout( function( thisBrowser, thisKeyQuery ) {

        if ( 'undefined' === typeof startedBrowsers[ thisKeyQuery ] ) {
          req.logger.browser( 'Trying close the browser but it seems already closed.' );
          return;
        }
        if ( Date.now() - startedBrowsers[ thisKeyQuery ] < _limitIdle ) {
          req.logger.browser( 'Not closing the browser as it has still activities.' );
          return;
        }
        if ( 'function' !== typeof thisBrowser[ 'close' ] ) {
          req.logger.browser( 'Trying close the browser but the browser object is gone. type: ' + typeof thisBrowser );
          delete startedBrowsers[ thisKeyQuery ];
          delete browserEndpoints[ thisKeyQuery ];
        }
        thisBrowser.close();
        req.logger.browser( 'Closed the browser.' );
        delete startedBrowsers[ thisKeyQuery ];
        delete browserEndpoints[ thisKeyQuery ];
        req.logger.browser( 'Current Browser Instance (after closing the browser): ' + Object.keys( browserEndpoints ).length );

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

      let _pathUserDataDir = req.app.get( 'pathDirTempUserData' );
      let _pathDirUserDataToday = _pathUserDataDir + path.sep + getDate();
      if ( ! fs.existsSync( _pathDirUserDataToday ) ){
          fs.mkdirSync( _pathDirUserDataToday, { recursive: true } );
      }

      try {

        if ( ! thisBrowserWSEndpoint ) {
          throw new Error( 'A previous browser instance does not exist.' );
        }
        
        thisBrowserWSEndpoint = thisBrowserWSEndpoint.includes( '--user-data-dir=' )
          ? thisBrowserWSEndpoint
          : thisBrowserWSEndpoint + '?--user-data-dir="' + _pathDirUserDataToday + '"'; // @see https://docs.browserless.io/blog/2019/05/03/improving-puppeteer-performance.html

        req.logger.browser( 'Reusing the existing browser, ws endpoint:' + thisBrowserWSEndpoint );
        return await puppeteerExtra.connect({browserWSEndpoint: thisBrowserWSEndpoint } );

      } catch (e) {

        req.logger.browser( 'Newly launching browser.' );
        let _argsMust = [
          '--start-maximized', // Start in maximized state for screenshots // @see https://github.com/puppeteer/puppeteer/issues/1273#issuecomment-667646971
          '--disk-cache-dir=' + _pathDirUserDataToday + path.sep + 'disk-cache',
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
        req.logger.browser( 'req.query.args', req.query.args );

        let _args = [...new Set([ ...req.query.args, ..._argsMust ] ) ];
        req.logger.browser( 'Browser "args"', _args );

        puppeteerExtra.use( pluginStealth() );

        return await puppeteerExtra.launch({
          headless: true,
          // userDataDir: _pathDirUserDataToday, // @deprecated 1.1.1 Causes an error "Unable to move the cache: Access is denied" when multiple browsers try to launch simultaneously.
          args: _args,
        });

      }

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