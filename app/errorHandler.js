const createError = require('http-errors');

module.exports = function( app, pathDirTemp ) {

  // Error log
  require( '../log/loggerError.js' )( app, pathDirTemp );

  // Catch 404 and forward to error handler
  app.use(function(req, res, next) {
    next( createError( 404 ) );
  });

  // Error Handler
  app.use(function(err, req, res, next) {

    // set locals, only providing error in development
    res.locals.status  = err.status || 500;
    res.locals.message = 500 === res.locals.status
      ? 'Internal Server Error'
      : err.message;
    res.locals.error   = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status( res.locals.status );
    res.render( 'error', req.app.get( 'config' ) );

  });

}