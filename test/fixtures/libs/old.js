
var deprecate1 = require('../../..')('old-lib')
var deprecate2 = require('../../..')('old-lib-other')
var deprecate3 = require('../../..')('my-cool-module')

exports.old = function () {
  deprecate1('old')
}

exports.old2 = function () {
  deprecate2('old2')
}

exports.oldfunction = function () {
  deprecate3('oldfunction')
}
