var express = require('express');
var router = express.Router();

router.all('*', function(req, res, next ) {
  res.locals.title = req.app.get( 'config' ).project.name;
  res.locals.urlHome  = "//" + req.headers.host;
  res.locals.urlUsage = "//" + req.headers.host + '/usage';
  next();
});
module.exports = router;
