/*!
 * depd
 * Copyright(c) 2014-2018 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

function canUseDefinePropertyOnFunctionLength () {
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

function wrapFunctionWithDefineProperty (fn, log, deprecate, message, site) {
  var deprecatedfn = function () {
    log.call(deprecate, message, site)
    return fn.apply(this, arguments)
  }

  // Preserve fn's arity.
  Object.defineProperty(deprecatedfn, 'length', {
    configurable: true,
    enumerable: false,
    value: fn.length,
    writable: false
  })

  return deprecatedfn
}

function wrapFunctionWithEval (fn, log, deprecate, message, site) {
  // Preserve fn's arity by manually constructing an arguments string and
  // eval'ing it into a new function.
  var args = createArgumentsString(fn.length)
  // eslint-disable-next-line no-new-func
  return new Function('fn', 'log', 'deprecate', 'message', 'site',
    '"use strict"\n' +
    'return function (' + args + ') {' +
    'log.call(deprecate, message, site)\n' +
    'return fn.apply(this, arguments)\n' +
    '}')(fn, log, deprecate, message, site)
}

module.exports = canUseDefinePropertyOnFunctionLength()
    ? wrapFunctionWithDefineProperty : wrapFunctionWithEval
