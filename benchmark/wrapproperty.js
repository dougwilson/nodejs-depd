
/**
 * Module dependencies.
 */

var benchmark = require('benchmark')
var benchmarks = require('beautify-benchmark')

/**
 * Globals for benchmark.js
 */

process.env.NO_DEPRECATION = 'my-lib'
global.mylib = require('../test/fixtures/libs/my')

var suite = new benchmark.Suite()

suite.add({
  name: 'property',
  minSamples: 100,
  fn: 'mylib.prop = mylib.prop'
})

suite.add({
  name: 'wrapped',
  minSamples: 100,
  fn: 'mylib.propa = mylib.propa'
})

suite.on('cycle', function onCycle (event) {
  benchmarks.add(event.target)
})

suite.on('complete', function onComplete () {
  benchmarks.log()
})

suite.run({ async: false })
