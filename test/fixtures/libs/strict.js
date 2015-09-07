
'use strict'

var deprecate = require('../../..')('strict-lib')

exports.old = function () {
  deprecate('old')
}

exports.oldfn = deprecate.function(fn, 'oldfn')

exports.oldfnauto = deprecate.function(fn)

exports.oldfnautoanon = deprecate.function(function () {})

exports.propa = 'thingie'
exports.propauto = 'thingie'

deprecate.property(exports, 'propa', 'propa gone')
deprecate.property(exports, 'propauto')

exports.automsg = function () {
  deprecate()
}

exports.automsgnamed = function automsgnamed() {
  deprecate()
}

exports.automsganon = function () {
  (function () { deprecate() }())
}

exports.fnprop = function thefn() {}
exports.fnprop.propa = 'thingie'
exports.fnprop.propautomsg = 'thingie'

deprecate.property(exports.fnprop, 'propa', 'fn propa gone')
deprecate.property(exports.fnprop, 'propautomsg')

exports.layerfn = function () {
  exports.oldfn()
}

exports.layerprop = function () {
  exports.propa
}

function fn(a1, a2) {
  return a2
}
