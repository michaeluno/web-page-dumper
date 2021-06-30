const Action_Base = require( './Action_Base.js' );

module.exports = class Action_click extends Action_Base {

  type = 'click';

  async _doForXPath() {

    let elementHandleList = await this.page.$x( this.selector );
    await elementHandleList[0].click();

  }

  async _do() {

    let elementHandleList = await this.page.$$( this.selector );
    await elementHandleList[ 0 ].click();

  }


}