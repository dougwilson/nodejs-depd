/*!
 * depd
 * Copyright(c) 2017 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 * @private
 */

var bufferConcat = require('./buffer-concat')

/**
 * Module exports.
 * @public
 */

module.exports = captureStderr

/**
 * Capture STDERR output during a function invokation.
 * @public
 */

function captureStderr (fn, color) {
  var chunks = []
  var isTTY = process.stderr.isTTY
  var write = process.stderr.write

  process.stderr.isTTY = Boolean(color)
  process.stderr.write = function write (chunk, encoding) {
    chunks.push(new Buffer(chunk, encoding))
  }

  try {
    fn()
  } finally {
    process.stderr.isTTY = isTTY
    process.stderr.write = write
  }

  return bufferConcat(chunks).toString('utf8')
}
