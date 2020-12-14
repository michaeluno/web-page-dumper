/**
 * @see https://stackoverflow.com/a/23593099
 * @param date
 * @returns {string}
 */
module.exports = function getDate(date) {
  let d = 'undefined' === typeof date ? new Date() : new Date(date);
  let month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();
  if (month.length < 2) {
    month = '0' + month;
  }
  if (day.length < 2) {
    day = '0' + day;
  }
  return [year, month, day].join('-');
}