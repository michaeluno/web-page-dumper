// Express generated dependencies
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var compression = require( 'compression' );

const username = require( 'username' );
const getDate  = require( './utility/getDate' );

const cleanUserData = require( './tasks/cleanUserData' );

const favicon = require( 'serve-favicon' );

// Additional dependencies

const tempDirectory = require('temp-dir');
var fs = require('fs');

/// To parse POST
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();

var routerIndex = require( './routes/index' );
var routerWWW   = require( './routes/www/www.js' );
// var usersRouter = require('./routes/users'); // @deprecated

var app = express();
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

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Dependencies to handle forms
// @see
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