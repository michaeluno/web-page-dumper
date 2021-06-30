const Action_Base = require( './Action_Base.js' );

module.exports = class Action_waitForNavigation extends Action_Base {

  type = 'waitForNavigation';

  async _doForXPath() {
    await this._do();
  }

  async _do() {
    await this.page.waitForNavigation();
  }

  static takesSelector() {
    return false;
  }

}