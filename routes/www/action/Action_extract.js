const Action_Base = require( './Action_Base.js' );

module.exports = class Action_extract extends Action_Base {

  type = 'extract';

  async _doForXPath() {

    let _innerHTMLs = await this.page.evaluate( ( selector ) => {
      const nodesSnapshot = document.evaluate(selector, document.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
      let innerHTMLs = '';
      for ( let i=0 ; i < nodesSnapshot.snapshotLength; i++ ) {
        let _node = nodesSnapshot.snapshotItem(i);
        innerHTMLs += _node.innerHTML;
      }
      return innerHTMLs;
    }, this.selector );
    await this._replaceBodyWith( _innerHTMLs );

  }

  async _do() {

    let _innerHTMLs = await page.$$eval( this.selector, elements => {
      let _innerHTMLs = '';
      for ( let _i=0; _i < elements.length; _i++ ) {
        _innerHTMLs += elements[ _i ].innerHTML;
      }
      return _innerHTMLs;
    });
    await this._replaceBodyWith( _innerHTMLs );

  }

    /**
     * Replaces the body innerHTML with the given potion of HTML
     * @param replacement
     * @returns {Promise<void>}
     * @private
     */
    async _replaceBodyWith( replacement ) {
      await this.page.evaluate( ( selector, replacement ) => {
        let subject = document.evaluate(
            selector,
            document.documentElement,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null);
        subject.singleNodeValue.innerHTML = replacement;
      }, '//body', replacement );
    }

}