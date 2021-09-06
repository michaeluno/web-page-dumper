var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  let _config = req.app.get( 'config' );
  res.set( 'Access-Control-Allow-Origin', '*' );
  res.send( _config.package.version );
});

module.exports = router;
