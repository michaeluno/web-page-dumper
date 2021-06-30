const Action_Base = require( './Action_Base.js' );

module.exports = class Action_type extends Action_Base {

  type = 'type';

  async _doForXPath() {
    await this.page.$x( this.selector ).then( async txt => {
      await txt[ 0 ].type( this.value );
    });
  }

  async _do() {
    await this.page.type( this.selector, this.value );
  }

  static takesSelector() {
    return false;
  }

}