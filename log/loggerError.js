var winston = require('winston');
require('winston-daily-rotate-file');
var expressWinston = require('express-winston');
const fs = require( 'fs' );

module.exports = function( app, pathDirTemp ) {

  let _pathDirLog = pathDirTemp + '/logs/error';
  
  if ( ! fs.existsSync( _pathDirLog ) ){
      fs.mkdirSync( _pathDirLog, { recursive: true } );
  }

  let loggerErrorWinston = expressWinston.errorLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
          }),
          //winston.format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`+(info.splat!==undefined?`${info.splat}`:" "))
          winston.format.printf(info => {
            let _splat = undefined === info.splat ? ' ' : info.splat + ' ';
            let _label = undefined === info.label ? ' ' : info.label + ': ';
            let _stack  = undefined === info.meta.stack
              ? ''
              : info.meta.stack;
            return `[${info.timestamp}]${_label}${info.level}: ${info.message}${_splat}\n${_stack}`;
          })
        )
      }),
      new winston.transports.DailyRotateFile({
          timestamp: true,
          datePattern: 'YYYY-MM-DD',
          zippedArchive: false,
          maxSize: '200k',
          maxFiles: '14d',
          filename: `${_pathDirLog}/%DATE%.log`,
          prepend: true,
          json: false,
          level: 'info'
      })
    ],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.json()
    ),
    meta: false, // optional: control whether you want to log the meta data about the request (default to true)
    msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
    ignoreRoute: function (req, res) { return false; } // optional: allows to skip some log messages based on request and/or response
  });

  app.use( loggerErrorWinston );
  //   app.use(expressWinston.errorLogger({
  //     transports: [
  //       new winston.transports.Console()
  //     ],
  //     format: winston.format.combine(
  //       winston.format.colorize(),
  //       winston.format.json()
  //     )
  //   }));

};