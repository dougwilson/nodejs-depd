
exports.my = require('./my')
exports.strict = require('./strict')

lazyRequireProperty(exports, 'cool', './cool')
lazyRequireProperty(exports, 'multi', './multi')
lazyRequireProperty(exports, 'new', './new')
lazyRequireProperty(exports, 'old', './old')
lazyRequireProperty(exports, 'thing', './thing')
lazyRequireProperty(exports, 'trace', './trace')

function lazyRequireProperty(obj, prop, path) {
  function get() {
    var val = require(path)

    Object.defineProperty(obj, prop, {
      configurable: true,
      enumerable: true,
      value: val
    })

    return val
  }

  Object.defineProperty(obj, prop, {
    configurable: true,
    enumerable: true,
    get: get
  })
}
