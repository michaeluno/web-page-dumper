const Action_extract = require( './Action_extract.js' );

module.exports = class Action_extractHard extends Action_extract {

  type = 'extractHard';

  /**
   * Replaces the body innerHTML with the given potion of HTML
   * @param replacement
   * @returns {Promise<void>}
   * @private
   */
  async _replaceBodyWith( replacement ) {
    await this.page.evaluate( ( selector, replacement ) => {
      document.documentElement.innerHTML = replacement; // this removes the head elements as well
    }, '//body', replacement );
  }

}