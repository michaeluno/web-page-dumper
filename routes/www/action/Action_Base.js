/**
 * ### Usage
 * ```
 * const obj = await MyClass.instantiate( 'bar', 'foo' );
 * ```
 * @type {Action_Base}
 */
module.exports = class Action_Base {

  type = '_default';

  page;
  selector;
  value;
  req;
  res;

  isXPath = false;

  constructor( page, selector, value, req, res ) {
    this.page     = page;
    this.selector = selector;
    this.value    = value;
    this.req      = req;
    this.res      = res;
    this.isXPath  = ( '//' === ( this.selector.slice( 0, 2 ) ) || '/html/' === ( this.selector.slice( 0, 6 ) ) );
  }

  static async instantiate( page, selector, value, req, res ) {
     const o = new this( page, selector, value, req, res );
     await o._initialize();
     return o;
  }

  async _initialize() {}

  async do() {

    try {
      if ( this.isXPath ) {
        await this.page.waitForXPath( this.selector, { timeout: 1000 } );
      } else {
        await this.page.waitForSelector( this.selector, { timeout: 1000 } );
      }
    } catch {
      this.req.logger.debug('The element did not appear: ' + this.selector );
      return;
    }

    if ( this.isXPath ) {
      await this._doForXPath();
      return;
    }
    await this._do();

  }

  async _doForXPath() {}

  async _do() {}

  /**
   * Tells whether the value parameter takes a selector.
   * Most action types expects a selector for the value.
   * Some action types expects own type of value. For example, the `type` action expects text to type for a value.
   * @returns {boolean}
   */
  static takesSelector() {
    return true;
  }


}