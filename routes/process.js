var express      = require('express');
var router       = express.Router();
const psList     = require('ps-list');
var os = require('os');
var osUtils = require('os-utils');

router.get( '/', function( req, res, next ) {

  (async () => {
      let _psList  = await psList();
      let _chromeProcesses = _psList.filter(obj => {
        return obj.name.includes( 'chrome' );
      })
      let _config  = req.app.get( 'config' );
      let _memory  = process.memoryUsage();
      let _process = {
        pid: process.pid,
        version: process.version,
        title: process.title,
        memory: {
          rss: convertBytes( _memory.rss ),
          heapTotal: convertBytes( _memory.heapTotal ),
          heapUsed: convertBytes( _memory.heapUsed ),
          external: convertBytes( _memory.external ),
        },
        uptime: secondsToHms( process.uptime() ),
      }
      let _cpu  = {
        count: osUtils.cpuCount(),
      }
      res.locals.chrome    = {
        count: _chromeProcesses.length,
      }
      res.locals.title     = 'Process List - ' + res.locals.title;
      res.locals.psList    = _psList;
      res.locals.process   = _process;
      res.locals._system    = {
        uptime: secondsToHms( osUtils.sysUptime() ),
      }
      res.locals.memory    = {
        free: convertBytes( os.freemem() ),
        total: convertBytes( os.totalmem() ),
        freePercentage: Math.round((osUtils.freememPercentage() + Number.EPSILON) * 100) / 100,
      }
      res.locals.cpu       = _cpu;
      res.render( 'process', _config );
  })();



});

function convertBytes(bytes) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]

  if (bytes == 0) {
    return "n/a"
  }

  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))

  if (i == 0) {
    return bytes + " " + sizes[i]
  }

  return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i]
}
function secondsToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    var hDisplay = pad( h, 2 ) + ":";
    var mDisplay = pad( m, 2 ) + ":";
    var sDisplay = pad( s, 2 );
    return hDisplay + mDisplay + sDisplay;
}
function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
module.exports = router;
