
var deprecate1 = require('../..')('old-lib')
var deprecate2 = require('../..')('old-lib-other')

exports.old = function () {
  deprecate1('old')
}

exports.old2 = function () {
  deprecate2('old2')
}
