const Action_Base = require( './Action_Base.js' );

module.exports = class Action_waitForTimeout extends Action_Base {

  type = 'waitForTimeout';

  async _doForXPath() {
    await this._do();
  }

  async _do() {
    await this.page.waitForTimeout( this.value );
  }

  static takesSelector() {
    return false;
  }

}