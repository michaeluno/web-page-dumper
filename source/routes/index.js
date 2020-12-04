var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next ) {
  res.render( 'index', req.app.get( 'config' ) );
});
router.post('/', function(req, res, next ) {
  res.render( 'index', req.app.get( 'config' ) );
});

module.exports = router;
