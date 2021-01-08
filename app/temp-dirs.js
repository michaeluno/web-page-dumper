var fs = require('fs');
const username = require( 'username' );
var path = require('path');

module.exports = function( app, pathDirTemp ) {

  app.set( 'pathDirTemp', pathDirTemp );

  const pathDirTempCache = pathDirTemp + path.sep + 'caches';
  app.set( 'pathDirTempCache', pathDirTempCache );

  const pathDirTempUserData = pathDirTemp + path.sep + 'user-data' + path.sep + username.sync();
  app.set( 'pathDirTempUserData', pathDirTempUserData );

  const pathDirTempLogs = pathDirTemp + path.sep + 'logs';
  app.set( 'pathDirTempLogs', pathDirTempUserData );
  const pathDirTempLogsRequest = pathDirTempLogs + path.sep + 'request';
  const pathDirTempLogsError = pathDirTempLogs + path.sep + 'error';
  const pathDirTempLogsDebug = pathDirTempLogs + path.sep + 'debug';
  const pathDirTempLogsBrowser = pathDirTempLogs + path.sep + 'browser';

  let _pathDirs = [ pathDirTempCache, pathDirTempUserData, pathDirTempLogsRequest, pathDirTempLogsError, pathDirTempLogsDebug, pathDirTempLogsBrowser ];
  _pathDirs.forEach( function( _pathDir, index, array ) {
    if ( ! fs.existsSync( _pathDir ) ){
        fs.mkdirSync( _pathDir, { recursive: true } );
    }
  });

}