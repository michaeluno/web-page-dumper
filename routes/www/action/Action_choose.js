const Action_Base = require( './Action_Base.js' );

module.exports = class Action_choose extends Action_Base {

  type = 'choose';

  /**
   * @remark Not supported yet
   * @returns {Promise<void>}
   * @private
   */
  async _doForXPath() {

    // await this.page.waitForXPath( this.selector );

  }

  async _do() {
    await this.page.select( this.selector, this.value );
  }

  static takesSelector() {
    return false;
  }

}