
var deprecate = require('../../..')('new-lib')

exports.old = function () {
  deprecate('old')
}
