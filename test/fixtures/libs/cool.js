
var deprecate1 = require('../../..')('cool-lib')
var deprecate2 = require('../../..')('neat-lib')

exports.cool = function () {
  deprecate1('cool')
}

exports.neat = function () {
  deprecate2('neat')
}
