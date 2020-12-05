var express = require('express');
var router = express.Router();

router.all('*', function(req, res, next ) {
  res.locals.title = req.app.get( 'config' ).project.name;
  res.locals.homeURL = req.protocol+"://"+req.headers.host;
  next();
});
module.exports = router;
