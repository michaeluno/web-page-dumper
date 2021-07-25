const Request_Base = require( './Request_Base.js' );
module.exports = class Request_json extends Request_Base {

  type = 'json';

  async do() {
    
    await this._setHeader( this.res );
    await this._setCookies( this.res );
    this.res.setHeader( 'Content-Type', 'application/json' );
    let _json = {
      'url': await this.responseHTTP.url(),
      'query': this.req.query,
      'resourceType': await this.responseHTTP.request().resourceType(),
      'contentType': this.responseHTTP.contentType ? this.responseHTTP.contentType : await this.responseHTTP.headers()[ 'content-type' ], // same as headers[ 'Content-Type' ];
      'status': await this.responseHTTP.status(),
      'headers': await this.responseHTTP.headers(),
      'body': await this.responseHTTP.text(),
    };

    // [1.7.0+] Omit user specified keys
    this._deleteElements( _json, this.req.query.omit, [] );

    // Final output
    this.res.json( _json );
  }

  _deleteElements( object, omitKeys, dimensions ) {
    for ( let _key in omitKeys ) {
      if ( ! omitKeys.hasOwnProperty( _key ) ) {
        continue;
      }
      // Cancel if non true value is given. For example, `omit[body]=0` will not delete the element, but should be `omit[body]=1`
      if ( ! omitKeys[ _key ] || '0' === omitKeys[ _key ] ) {
        continue;
      }
      let _dimensions = [ ...dimensions ];
      _dimensions.push( _key );
      if ( ! this.isObject( omitKeys[ _key ] ) ) {
        this.deleteElementByDimension( object, _dimensions );
        continue;
      }
      this._deleteElements( object, omitKeys[ _key ], _dimensions );
    }
  }
  /**
   * Deletes object property by passed dimensions.
   * For example,
   * ```
   * let _o = {
   *  foo: 'bar',
   *  a: {
   *    'b': 'boo',
   *    'c': 'cool',
   *   }
   * };
   * let _d = [ 'a', 'c' ];
   * deleteElementByDimension( _o, _d );
   * console.log( _o );
   * ```
   * will output by deleting `_o[ 'a' ][ 'c' ]`.
   * ```
   * { foo: 'bar', a: { b: 'boo' } }
   * ```
   * @param object
   * @param dimensions
   */
  deleteElementByDimension( object, dimensions ) {
    if ( 1 === dimensions.length ) {
      delete object[ dimensions[ 0 ] ];
      return;
    }
    let _firstItem = dimensions.shift();
    this.deleteElementByDimension( object[ _firstItem ], dimensions )
  }

  /**
   *
   * @param a
   * @returns {boolean}
   */
  isObject = function(a) {
      return (!!a) && (a.constructor === Object);
  }

}