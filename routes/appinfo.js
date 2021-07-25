var express      = require('express');
var router       = express.Router();

router.get('/', function(req, res, next ) {

  let _config = req.app.get( 'config' );
  res.json( {
    version: _config.package.version,
    name: _config.package.name,
  } );

});


module.exports = router;
