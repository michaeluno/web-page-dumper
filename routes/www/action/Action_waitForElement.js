const Action_Base = require( './Action_Base.js' );

module.exports = class Action_waitForElement extends Action_Base {

  type = 'waitForElement';

  async _doForXPath() {
    await this.page.waitForXPath( this.selector );
  }

  async _do() {
    await this.page.waitForSelector( this.selector );
  }

}