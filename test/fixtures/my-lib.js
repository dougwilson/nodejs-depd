
var deprecate = require('../..')('my-lib')

exports.old = function () {
  deprecate('old')
}

exports.old2 = function () {
  deprecate('old2')
}

exports.automsg = function () {
  deprecate()
}

exports.automsgnamed = function automsgnamed() {
  deprecate()
}

exports.automsganon = function () {
  (function () { deprecate() }())
}
