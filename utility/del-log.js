var winston = require('winston');
require('winston-daily-rotate-file');
// const env = process.env.NODE_ENV;
const fs = require('fs');

var path = require('path');
const tempDirectory = require( 'temp-dir' );
const tempDirPath   = tempDirectory + path.sep + 'web-page-dumper';
const logDirPath    = tempDirPath + path.sep + 'logs';
if ( ! fs.existsSync( logDirPath ) ){
    fs.mkdirSync( logDirPath, { recursive: true } );
}


var logger = winston.createLogger({
  // format: winston.format.combine(
  //     winston.format.timestamp(),
  //     winston.format.json()
  // ),
  // format: winston.format.combine(
  //   winston.format.timestamp({
  //     format: 'YYYY-MM-DD HH:mm:ss'
  //   }),
  //   winston.format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`+(info.splat!==undefined?`${info.splat}`:" "))
  // ),
  transports: [
    new (winston.transports.Console)({'timestamp':true}),
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

module.exports = logger;
module.exports.stream = {
  write: function(message, encoding) {
    logger.info(message);
    console.log('message=', message);
  }
};