
/**
 * Module dependencies.
 */

var benchmark = require('benchmark')
var benchmarks = require('beautify-benchmark')

/**
 * Globals for benchmark.js
 */

process.env.NO_DEPRECATION = 'my-lib'
global.mylib = require('../test/fixtures/my-lib')

var suite = new benchmark.Suite

suite.add({
  name: 'function',
  minSamples: 100,
  fn: 'mylib.fn()'
})

suite.add({
  name: 'wrapped',
  minSamples: 100,
  fn: 'mylib.oldfn()'
})

suite.add({
  name: 'call log',
  minSamples: 100,
  fn: 'mylib.old()'
})

suite.on('cycle', function onCycle(event) {
  benchmarks.add(event.target);
})

suite.on('complete', function onComplete() {
  benchmarks.log();
})

suite.run({async: false})
