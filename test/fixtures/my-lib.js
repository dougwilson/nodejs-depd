
var deprecate = require('../..')('my-lib')

exports.old = function () {
  deprecate('old')
}

exports.old2 = function () {
  deprecate('old2')
}

exports.oldfn = deprecate.function(fn, 'oldfn')

exports.oldfnauto = deprecate.function(fn)

exports.oldfnautoanon = deprecate.function(function () {})

exports.automsg = function () {
  deprecate()
}

exports.automsgnamed = function automsgnamed() {
  deprecate()
}

exports.automsganon = function () {
  (function () { deprecate() }())
}

function fn(a1, a2) {
  return a2
}
