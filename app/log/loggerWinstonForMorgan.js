var winston = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');
var loggerMorgan = require('morgan');

const requestInfo = require( '../../utility/request-info' );

// Ignore log messages if they have { private: true }
const filterAllowOnlyLabelMorgan = winston.format((info, opts) => {
  if ( 'morgan' !== info.label ) { 
    return false; 
  }
  return info;
});

const filterDenyLabelMorgan = winston.format((info, opts) => {
  if ( 'morgan' === info.label ) {
    return false;
  }
  return info;
});

const filterDeny = winston.format((info, opts) => {
  let _ignoreString = [
    'GET /fontawsome5/', 'GET /stylesheets/', 'GET /javascripts/', 'GET /images/',
    'GET /log/', 'GET /error'
  ];
  if ( _ignoreString.some( info.message.includes.bind( info.message ) ) ) {
      return false;
  }
  return info;
});

const filterAllowOnlyLevelDebug = winston.format((info, opts) => {
  if ( 'debug' !== info.level ) {
    return false;
  }
  return info;
});
const filterAllowOnlyLabelBrowser = winston.format((info, opts) => {
  if ( 'browser' !== info.label ) {
    return false;
  }
  return info;
});
const formatMessageGeneral = winston.format.printf( ( info) => {
  let _splat = undefined === info.splat ? ' ' : info.splat + ' ';
  let _label = undefined === info.label ? '' : info.label + ': ';
  let _level = undefined === info.level ? '' : info.level.trim() + ': ';

  let _meta  = _getMeta( info.metadata.hasOwnProperty('metadata' )
    ? info.metadata[ 'metadata' ]
    : info.metadata
  );
  return `[${info.timestamp}] ${_level}${_label}${info.message}${_splat}${_meta}`;

  function _getMeta( metadata ) {
    let _type = typeof metadata;
    if ( 'undefined' === _type ) {
      return '';
    }
    if ( ! [ 'object', 'array' ].includes( _type ) ) {
      return metadata;
    }
    if ( 'array' === _type ) {
      return metadata.length
        ? '\n' + JSON.stringify( metadata, null, 2 )
        : '';
    }
    if ( Object.keys( metadata ).length === 0 ) {
      return '';
    }
    return '\n' + JSON.stringify( metadata, null, 2 );
  }
});

const formatMessageMorgan = winston.format.printf( ( info) => {
  return info.message.replace( /(^.+)(\[.+)/, '$2 $1' );
});

module.exports = function( app, pathDirTemp ) {

  const _pathDirLogMorgan  = pathDirTemp + path.sep + 'logs' + path.sep + 'request';
  const _pathDirLogDebug   = pathDirTemp + path.sep + 'logs' + path.sep + 'debug';
  const _pathDirLogBrowser = pathDirTemp + path.sep + 'logs' + path.sep + 'browser';
  const _pathDirs          = [ _pathDirLogMorgan, _pathDirLogDebug ];
  _pathDirs.forEach( function( _pathDir, index, array ) {
    if ( ! fs.existsSync( _pathDir ) ){
        fs.mkdirSync( _pathDir, { recursive: true } );
    }
  });

  app.loggerWinston = winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
    ),
    transports: [
      // Only Morgan log - console & file
      new winston.transports.Console({
        format: winston.format.combine(
          filterDeny(),
          filterAllowOnlyLabelMorgan(),
          winston.format.colorize(),
          formatMessageMorgan
        ),
        level: 'http'
      }),
      new winston.transports.DailyRotateFile({
        format: winston.format.combine(
          filterDeny(),
          filterAllowOnlyLabelMorgan(),
          formatMessageMorgan
        ),
        timestamp: true,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: false,
        maxSize: '1m',
        maxFiles: '7d',
        filename: `${_pathDirLogMorgan}/%DATE%.log`,
        prepend: true,
        json: false,
        level: 'http'
      }),
      // General console log
      new winston.transports.Console({
        format: winston.format.combine(
          filterDeny(),
          filterDenyLabelMorgan(),
          winston.format.metadata( { fillExcept: ['message', 'level', 'timestamp', 'label'] } ),
          winston.format.colorize(),
          formatMessageGeneral
        ),
        level: 'silly'
      }),
      // Only debug log
      new winston.transports.DailyRotateFile({
        format: winston.format.combine(
          filterAllowOnlyLevelDebug(),
          winston.format.metadata( { fillExcept: ['message', 'level', 'timestamp', 'label'] } ),
          formatMessageGeneral
        ),
        timestamp: true,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: false,
        maxSize: '1m',
        maxFiles: '7d',
        filename: `${_pathDirLogDebug}/%DATE%.log`,
        prepend: true,
        json: false,
        level: 'debug'
      }),
      // Browser Activity log
      new winston.transports.DailyRotateFile({
        format: winston.format.combine(
          filterAllowOnlyLabelBrowser(),
          winston.format.metadata( { fillExcept: ['message', 'level', 'timestamp', 'label'] } ),
          formatMessageGeneral
        ),
        timestamp: true,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: false,
        maxSize: '1m',
        maxFiles: '7d',
        filename: `${_pathDirLogBrowser}/%DATE%.log`,
        prepend: true,
        json: false,
        level: 'info'
      }),
    ],
    exitOnError: false
  });

  // app.use(logger('dev')); // the default express Morgan logger
  app.use(
    loggerMorgan(
      'combined',
      {
        stream: {
          write:
            message => app.loggerWinston.log( {
              level: 'http',
              label: 'morgan',
              message: message.trim(),
            } )
        }
      }
    )
  );

  app.use( function (req, res, next) {
    req.logger = new WrapperWinston( app.loggerWinston, req );
    next();
  });

}

class WrapperWinston {

  constructor( loggerWinston, req ) {
    this.logger = loggerWinston;
    this.req    = req;
  }

  log( level, message, meta ) {
    this.logger.log( level, this._getMessage( message ), meta );
  }
  debug( message, meta ) {
    this.logger.debug( this._getMessage( message ), meta );
  }
  info( message, meta ) {
    this.logger.info( this._getMessage( message ), meta );
  }
  error( message, meta ) {
    this.logger.error( this._getMessage( message ), meta );
  }

  browser( message, meta ) {
      this.logger.log(
      {
        label: 'browser',
        level: 'info',
        message: this._getMessage( message ),
        metadata: meta
      }
    );
  }

  _getMessage( message ) {
    return message + ' ' + requestInfo.getIP( this.req ) + ' ' + requestInfo.getUserAgent( this.req );
  }

  /**
   * @todo implement it
   * @private
   */
  _getSessionID() {}

}