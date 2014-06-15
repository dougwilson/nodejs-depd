
var deprecate = require('../..')('my-lib')

exports.old = function () {
  deprecate('old')
}

exports.old2 = function () {
  deprecate('old2')
}
