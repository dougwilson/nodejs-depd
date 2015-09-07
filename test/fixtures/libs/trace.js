
var deprecate1 = require('../../..')('trace-lib')
var deprecate2 = require('../../..')('trace-lib-other')

exports.old = function () {
  deprecate1('old')
}

exports.old2 = function () {
  deprecate2('old2')
}
