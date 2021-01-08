var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  // here we cause an error in the pipeline so we see express-winston in action.
  return next( new Error( "This is a test error and it should be logged to the console" ) );
});

module.exports = router;
