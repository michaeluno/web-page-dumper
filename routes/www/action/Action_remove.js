const Action_Base = require( './Action_Base.js' );

module.exports = class Action_remove extends Action_Base {

  type = 'remove';

  async _doForXPath() {

    await this.page.evaluate( ( selector ) => {
      const nodesSnapshot = document.evaluate(selector, document.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
      for ( let i=0 ; i < nodesSnapshot.snapshotLength; i++ ) {
        let _node = nodesSnapshot.snapshotItem(i);
        _node.parentNode.removeChild( _node );
      }
    }, this.selector );

  }

  async _do() {
    await this.page.evaluate((sel) => {
        let elements = document.querySelectorAll(sel);
        for(let i=0; i< elements.length; i++){
            elements[i].parentNode.removeChild(elements[i]);
        }
    }, this.selector )
  }

}