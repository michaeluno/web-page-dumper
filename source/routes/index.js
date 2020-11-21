var express = require('express');
var router  = express.Router();

router.get('/', function(req, res) {
  _handleRequest( req, res );
});
/* POST */
router.post('/', function(req, res){
   _handleRequest( req, res );
});

module.exports = router;

function _handleRequest( req, res ) {

  var url = 'undefined' !== typeof req.query.url && req.query.url
    ? decodeURI( req.query.url )
    : '';
  if ( ! url ) {
    res.render('index', req.app.get( 'config' ));
    return;
  }

  // Display the fetched contents
  console.log( url );
  res.json( { foo: 'bar' } );
  return;

}
