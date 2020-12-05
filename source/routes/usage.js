var express = require('express');
var router = express.Router();
const MarkdownIt = require( 'markdown-it' );
const fs         = require( 'fs' )
const path       = require( 'path' )
const cheerio    = require('cheerio')

router.get('/', function(req, res, next ) {

  let _markdownContent = fs.readFileSync( path.resolve( __dirname, '../../README.md' ), 'utf8' ) ;
  let _md      = new MarkdownIt();
  var _html    = _md.render( _markdownContent );
  let $        = cheerio.load( _html );

  // Remove elements
  let _h1s     = $( 'h1' );
  _h1s.next( 'p' ).remove();
  _h1s.remove();
  $( 'li > p' ).each( function(){
    $( this ).replaceWith( $( this ).html() );
  } );

  // Add classes
  $( 'h2, h3, h4, h5, h6' ).addClass( 'title' );
  $( 'h2' ).addClass( 'is-3' );
  $( 'h3' ).addClass( 'is-4' );
  $( 'h4' ).addClass( 'is-5' );
  $( 'h5' ).addClass( 'is-6' );
  $( 'h6' ).addClass( 'is-7' );
  $( 'p, pre' ).addClass( 'mb-5' );

  res.locals.content = $.html();
  res.render( 'usage', req.app.get( 'config' ) );
});
module.exports = router;
