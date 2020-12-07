const Request_Image = require( './Request_Image.js' );
module.exports = class Request_jpg extends Request_Image {

  /**
   * @remark Not `jpg` as required in `Content-Type: jpeg`.
   * @type {string}
   */
  type = 'jpeg';

}