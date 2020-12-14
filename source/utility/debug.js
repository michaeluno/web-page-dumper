const util = require('util');

module.exports = class Debug {
  entries = [];
  log( ...args ) {
    args.unshift( new Date().toLocaleTimeString( [], { hour12: false } ) );
    console.log.apply(null, args );
    this.entries.push( util.format.apply( null, args ) );
  }
}