
var deprecate = require('../../..')('thing-lib')

exports.old = function () {
  deprecate('old')
}
