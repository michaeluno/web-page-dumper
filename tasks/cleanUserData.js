const fs = require('fs');
const path = require('path');
const getDate = require( '../utility/getDate' );
const fsExtra = require( 'fs-extra' );

function _cleanUserData( pathUserData ) {
  fs.readdir( pathUserData, { withFileTypes: true }, (err, files) => {

    if (err) {
      console.log(err);
      return;
    }

    files.forEach( _dirent => {
      if ( ! _dirent.isDirectory() ) {
        return;
      }
      let _pathThisDir = path.resolve( pathUserData, _dirent.name );
      if ( _dirent.name === getDate() ) {
        return;
      }
      fsExtra.removeSync( _pathThisDir );

    } );
  });
}

/**
 * Deletes user data directories that is not today's.
 */
module.exports = function cleanUserData( pathUserData, interval=86400 ) {
  setInterval( function(){
    _cleanUserData( pathUserData );
  }, interval ); // one day
}