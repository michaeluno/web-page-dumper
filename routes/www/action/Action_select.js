const Action_Base = require( './Action_Base.js' );

/**
 * Does nothing.
 *
 * Each action handles selector selection.
 *
 * @type {Action_select}
 */
module.exports = class Action_select extends Action_Base {
  type = 'select';
}