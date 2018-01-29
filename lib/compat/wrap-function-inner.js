function detectCanUseDefinePropertyOnFunctionLength() {
  function detectfn () {}  

  try {
    // Node.js 3.3+.
    Object.defineProperty(detectfn, 'length', {
      configurable: true,
      enumerable: false,
      value: 1,  
      writable: false
    })
  } catch (err) {
    // Likely Node.js 2.5 or older.
  }

  return detectfn.length === 1
}

// Perform the detection only once.
var canUseDefinePropertyOnFunctionLength =
    detectCanUseDefinePropertyOnFunctionLength()

/**
 * Create arguments string to keep arity.
 */

function createArgumentsString (arity) {
  var str = ''

  for (var i = 0; i < arity; i++) {
    str += ', arg' + i
  }

  return str.substr(2)
}

function wrapFunctionInner (fn, log, deprecate, message, site) {
  var deprecatedfn

  if (canUseDefinePropertyOnFunctionLength) {
    // Preserve fn's arity without eval().
    deprecatedfn = function () {
      log.call(deprecate, message, site)
      return fn.apply(this, arguments)
    }

    Object.defineProperty(deprecatedfn, 'length', {
      configurable: true,
      enumerable: false,
      value: fn.length,
      writable: false
    })
  } else {
    // If unsupported, use eval to manually construct a function with the
    // correct arity.
    var args = createArgumentsString(fn.length)
    // eslint-disable-next-line no-new-func
    deprecatedfn = new Function('fn', 'log', 'deprecate', 'message', 'site',
      '"use strict"\n' +
      'return function (' + args + ') {' +
      'log.call(deprecate, message, site)\n' +
      'return fn.apply(this, arguments)\n' +
      '}')(fn, log, deprecate, message, site)
  }

  return deprecatedfn
}

module.exports = wrapFunctionInner
