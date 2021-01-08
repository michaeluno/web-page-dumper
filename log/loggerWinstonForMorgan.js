var winston = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');
var loggerMorgan = require('morgan');


const ignoreStaticAssets = winston.format((info, opts) => {
  let _ignoreString = [ 'GET /fontawsome5/', 'GET /stylesheets/', 'GET /javascripts/', 'GET /images/' ];
  if ( _ignoreString.some( info.message.includes.bind( info.message ) ) ) {
      return false;
  }
  return info;
});

module.exports = function( app, pathDirTemp ) {

  const logDirPath  = pathDirTemp + path.sep + 'logs' + path.sep + 'request';
  if ( ! fs.existsSync( logDirPath ) ){
      fs.mkdirSync( logDirPath, { recursive: true } );
  }
  const loggerWinston = winston.createLogger({
    format: winston.format.combine(
      winston.format.colorize(),
      ignoreStaticAssets(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
          }),
          winston.format.printf(
            ( info) => {
              return `${info.message}`;
            }
          ),
        )
      }),
      new winston.transports.DailyRotateFile({
          timestamp: true,
          datePattern: 'YYYY-MM-DD',
          zippedArchive: false,
          maxSize: '200k',
          maxFiles: '14d',
          filename: `${logDirPath}/%DATE%.log`,
          prepend: true,
          json: false,
          level: 'info'
      })
    ],
    exitOnError: false
  });

  // app.use(logger('dev')); // the default express Morgan logger
  app.use( loggerMorgan( 'combined', { stream: { write: message => loggerWinston.info( message.trim() ) }} ) );
}