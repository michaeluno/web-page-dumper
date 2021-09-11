// Express generated dependencies
var express = require('express');
var path = require('path');

// Additional dependencies

/// Environment variables
require( 'dotenv' ).config( {path: __dirname + '/.env' } );

/// To parse POST
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();

var app = express();

// [1.9.0+] For Heroku instances, they should return a response within 30 seconds to avoid getting stuck with the 503 error.
if ( process.env.WPD_TIMEOUT ) {
  var ms = require( 'ms' );
  _timeout = '' + process.env.WPD_TIMEOUT;
  app.set( 'connectionTimeout', ms( _timeout ) );
  var timeout = require( 'connect-timeout' ); // @see https://github.com/expressjs/timeout
  app.use( timeout( _timeout ) );
}

var compression = require( 'compression' );
app.use(compression({}));
app.enable( 'trust proxy' );  // for Heroku environments to detect whether the scheme is https or not.

// Custom Data
app.set( 'config', require( './config/project' ) );

/// Temporary directories
const tempDirectory = require('temp-dir');
const tempDirPath   = tempDirectory + path.sep + 'web-page-dumper';
require( './app/temp-dirs' )( app, tempDirPath );

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Logger
/// Morgan
require( './app/log/loggerWinstonForMorgan.js' )( app, tempDirPath );
/// Browser Activities
/// Debug Memory Leaks

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
var cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Dependencies to handle forms
/// for parsing application/json
app.use(bodyParser.json());

/// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true }));
///form-urlencoded

/// for parsing multipart/form-data
app.use(upload.array());
app.use(express.static('public'));

// Custom properties
const Debug = require( './utility/debug.js' );
app.use(function (req, res, next) {
  req.debug = new Debug;
  next();
});

// Routers
require( './routes/_route' )( app );

// Error handler
require( './app/errorHandler.js' )( app, tempDirPath );

// Periodical routines.
require( './tasks/cleanUserData' )( app.get( 'pathDirTempUserData' ) );

module.exports = app;