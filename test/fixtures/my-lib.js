
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

exports.propa = 'thingie'
exports.propauto = 'thingie'

Object.defineProperty(exports, 'propget', {
  configurable: true,
  value: 'thingie',
  writable: false
})

Object.defineProperty(exports, 'propdyn', {
  configurable: true,
  get: function () { return 'thingie' },
  set: function () {}
})

Object.defineProperty(exports, 'propgetter', {
  configurable: true,
  get: function () { return 'thingie' }
})

Object.defineProperty(exports, 'propsetter', {
  configurable: true,
  set: function () {}
})

deprecate.property(exports, 'propa', 'propa gone')
deprecate.property(exports, 'propauto')
deprecate.property(exports, 'propdyn')
deprecate.property(exports, 'propget')
deprecate.property(exports, 'propgetter')
deprecate.property(exports, 'propsetter')

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
