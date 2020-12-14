var express      = require('express');
var router       = express.Router();
// const nodeinfo   = require( 'nodejs-info' );
const nodejsinfo = require( '../utility/nodejsinfo' );
const cheerio    = require('cheerio')

router.get('/', function(req, res, next ) {

  let _config = req.app.get( 'config' );
  let _html   = nodejsinfo(req, { style: '' });
  let $       = cheerio.load( _html );
  $( 'table' ).addClass( 'table is-striped is-bordered is-hoverable is-fullwidth' );
  $( 'h1' ).addClass( 'title' );
  $( 'h2' ).addClass( 'subtitle' );
  res.locals.title     = 'Node.js Info - ' + res.locals.title;
  res.locals.nodeinfo  = $.html();
  res.render( 'nodejsinfo', _config );

});


module.exports = router;
