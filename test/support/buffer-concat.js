/*!
 * depd
 * Copyright(c) 2014-2017 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 * @private
 */

var Buffer = require('buffer').Buffer

/**
 * Module exports.
 * @public
 */

module.exports = Buffer.concat || bufferConcat

/**
 * Concatenate an array of Buffers.
 * @public
 */

function bufferConcat (bufs) {
  var i
  var len
  var length = 0

  for (i = 0, len = bufs.length; i < len; i++) {
    length += bufs[i].length
  }

  var buf = new Buffer(length)
  var pos = 0

  for (i = 0, len = bufs.length; i < len; i++) {
    bufs[i].copy(buf, pos)
    pos += bufs[i].length
  }

  return buf
}
