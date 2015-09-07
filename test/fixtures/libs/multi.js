
var deprecate1 = require('../../..')('multi-lib')
var deprecate2 = require('../../..')('multi-lib-other')

exports.old = function () {
  deprecate1('old')
}

exports.old2 = function () {
  deprecate2('old2')
}
