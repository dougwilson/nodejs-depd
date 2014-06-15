/*!
 * depd
 * Copyright(c) 2014 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var relative = require('path').relative
var supportsColor = require('supports-color')

/**
 * Module exports.
 */

module.exports = depd

/**
 * Get the path to base files on.
 */

var basePath = process.cwd()

/**
 * Create deprecate for namespace in caller.
 */

function depd(namespace) {
  if (!namespace) {
    throw new TypeError('argument namespace is required')
  }

  var stack = getStack()
  var site = callSiteLocation(stack[1])
  var file = site[0]

  function deprecate(message) {
    // call to self as log
    log.call(deprecate, message)
  }

  deprecate._file = file
  deprecate._namespace = namespace
  deprecate._warned = Object.create(null)

  return deprecate
}

/**
 * Display deprecation message.
 */

function log(message) {
  var caller
  var seen = false
  var stack = getStack()
  var site = callSiteLocation(stack[1])
  var file = this._file

  // get caller of deprecated thing in relation to file
  for (var i = 1; i < stack.length; i++) {
    caller = callSiteLocation(stack[i])

    if (caller[0] === file) {
      seen = true
    } else if (seen) {
      break
    }
  }

  var key = caller
    ? site.join(':') + '__' + caller.join(':')
    : undefined

  if (key !== undefined && key in this._warned) {
    // already warned
    return
  }

  this._warned[key] = true

  // format and write message
  var format = supportsColor && process.stderr.isTTY
    ? formatColor
    : formatPlain
  var msg = format.call(this, message, caller)
  process.stderr.write(msg + '\n', 'utf8')

  return
}

/**
 * Get call site location as array.
 */

function callSiteLocation(callSite) {
  var file = callSite.getFileName() || '<anonymous>'
  var line = callSite.getLineNumber()
  var colm = callSite.getColumnNumber()

  if (callSite.isEval()) {
    file = callSite.getEvalOrigin() + ', ' + file
  }

  return [file, line, colm]
}

/**
 * Format deprecation message without color.
 */

function formatPlain(msg, caller) {
  var timestamp = new Date().toUTCString()

  var formatted = timestamp
    + ' ' + this._namespace
    + ' deprecated ' + msg

  if (caller) {
    formatted += ' at ' + formatLocation(caller)
  }

  return formatted
}

/**
 * Format deprecation message with color.
 */

function formatColor(msg, caller) {
  var formatted = '\x1b[36;1m' + this._namespace + '\x1b[22;39m' // bold cyan
    + ' \x1b[33;1mdeprecated\x1b[22;39m' // bold yellow
    + ' \x1b[90m' + msg + '\x1b[39m' // grey

  if (caller) {
    formatted += ' \x1b[36m' + formatLocation(caller) + '\x1b[39m' // cyan
  }

  return formatted
}

/**
 * Format call site location.
 */

function formatLocation(callSite) {
  return relative(basePath, callSite[0])
    + ':' + callSite[1]
    + ':' + callSite[2]
}

/**
 * Get the stack as array of call sites.
 */

function getStack() {
  var obj = {}
  var prep = Error.prepareStackTrace

  Error.prepareStackTrace = prepareObjectStackTrace
  Error.captureStackTrace(obj, getStack)

  var stack = obj.stack

  Error.prepareStackTrace = prep

  return stack
}

/**
 * Capture call site stack from v8.
 */

function prepareObjectStackTrace(obj, stack) {
  return stack
}
