
var deprecate = require('../../..')('New-Lib')

exports.old = function () {
  deprecate('old')
}
