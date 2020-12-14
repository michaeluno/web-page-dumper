/**
 * ### Usage
 * ```
 * const obj = await MyClass.instantiate( 'bar', 'foo' );
 * ```
 * @type {Request_Base}
 */
module.exports = class Request_Base {

  type = '';

  urlRequest = '';
  page;
  req;
  res;
  responseHTTP;

  constructor( urlRequest, page, req, res, responseHTTP ) {
    this.urlRequest = urlRequest;
    this.page = page;
    this.req = req;
    this.res = res;
    this.responseHTTP = responseHTTP;
  }

  static async instantiate( urlRequest, page, req, res, responseHTTP ) {
     const o = new this( urlRequest, page, req, res, responseHTTP );
     await o._initialize();
     return o;
  }

  async _initialize() {}

  async do() {}

}