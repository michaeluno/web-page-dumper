var express = require('express');
var router = express.Router();
const fs = require('fs');

router.get('/:type/:date', function(req, res, next ) {

  let _pathLogDir  = req.app.get( 'pathDirTempLogs' ) + '/' + req.params.type;
  let _pathLogFile = _pathLogDir + '/' + req.params.date + '.log';
  if ( ! fs.existsSync( _pathLogFile ) ) {
    res.send( 'No log file.' );
    return;
  }
  res.send( "<pre>" + fs.readFileSync( _pathLogFile, 'utf8' ) + "</pre>" );

});
module.exports = router;
