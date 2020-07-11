
var assert = require('assert')
var basename = require('path').basename
var captureStderr = require('./support/capture-stderr')
var depd = require('..')
var libs = require('./fixtures/libs')
var mylib = libs.my
var path = require('path')
var script = path.join(__dirname, 'fixtures', 'script.js')
var spawn = require('child_process').spawn
var strictlib = libs.strict

describe('depd(namespace)', function () {
  it('creates deprecated function', function () {
    assert.strictEqual(typeof depd('test'), 'function')
  })

  it('requires namespace', function () {
    assert.throws(depd.bind(null), /namespace.*required/)
  })
})

describe('deprecate(message)', function () {
  it('should log namespace', function () {
    function callold () { mylib.old() }
    assert.ok(captureStderr(callold).indexOf('my-lib') !== -1)
  })

  it('should log deprecation', function () {
    function callold () { mylib.old() }
    assert.ok(captureStderr(callold).indexOf('deprecate') !== -1)
  })

  it('should log message', function () {
    function callold () { mylib.old() }
    assert.ok(captureStderr(callold).indexOf('old') !== -1)
  })

  it('should log call site', function () {
    function callold () { mylib.old() }
    var stderr = captureStderr(callold)
    assert.ok(stderr.indexOf(basename(__filename)) !== -1)
    assert.ok(/\.js:[0-9]+:[0-9]+/.test(stderr))
  })

  it('should log call site from strict lib', function () {
    function callold () { strictlib.old() }
    var stderr = captureStderr(callold)
    assert.ok(stderr.indexOf(basename(__filename)) !== -1)
    assert.ok(/\.js:[0-9]+:[0-9]+/.test(stderr))
  })

  it('should log call site regardless of Error.stackTraceLimit', function () {
    function callold () { mylib.old() }
    var limit = Error.stackTraceLimit
    try {
      Error.stackTraceLimit = 1
      var stderr = captureStderr(callold)
      assert.ok(stderr.indexOf(basename(__filename)) !== -1)
      assert.ok(/\.js:[0-9]+:[0-9]+/.test(stderr))
    } finally {
      Error.stackTraceLimit = limit
    }
  })

  it('should log call site within eval', function () {
    function callold () { eval('mylib.old()') } // eslint-disable-line no-eval
    var stderr = captureStderr(callold)
    assert.ok(stderr.indexOf(basename(__filename)) !== -1)
    assert.ok(stderr.indexOf('<anonymous>:1:') !== -1)
    assert.ok(/\.js:[0-9]+:[0-9]+/.test(stderr))
  })

  it('should log call site within strict', function () {
    function callold () { 'use strict'; mylib.old() }
    var stderr = captureStderr(callold)
    assert.ok(stderr.indexOf(basename(__filename)) !== -1)
    assert.ok(/\.js:[0-9]+:[0-9]+/.test(stderr))
  })

  it('should only warn once per call site', function () {
    function callold () {
      for (var i = 0; i < 5; i++) {
        mylib.old() // single call site
        process.stderr.write('invoke ' + i + '\n')
      }
    }

    var stderr = captureStderr(callold)
    assert.strictEqual(stderr.split('deprecated').length, 2)
    assert.strictEqual(stderr.split('invoke').length, 6)
  })

  it('should warn for different fns on same call site', function () {
    var prop

    function callold () {
      mylib[prop]() // call from same site
    }

    prop = 'old'
    assert.ok(captureStderr(callold).indexOf(basename(__filename)) !== -1)

    prop = 'old2'
    assert.ok(captureStderr(callold).indexOf(basename(__filename)) !== -1)
  })

  it('should warn for different calls on same line', function () {
    function callold () {
      mylib.old(); mylib.old()
    }

    var stderr = captureStderr(callold)
    var fileline = stderr.match(/\.js:[0-9]+:/)
    assert.ok(stderr.indexOf(basename(__filename)) !== -1)
    assert.strictEqual(stderr.split('deprecated').length, 3)
    assert.strictEqual(stderr.split(fileline[0]).length, 3)
  })

  describe('when message omitted', function () {
    it('should generate message for method call on named function', function () {
      function callold () { mylib.automsgnamed() }
      var stderr = captureStderr(callold)
      assert.ok(stderr.indexOf(basename(__filename)) !== -1)
      assert.ok(stderr.indexOf('deprecated') !== -1)
      assert.ok(stderr.indexOf(' automsgnamed ') !== -1)
    })

    it('should generate message for function call on named function', function () {
      function callold () {
        var fn = mylib.automsgnamed
        fn()
      }
      var stderr = captureStderr(callold)
      assert.ok(stderr.indexOf(basename(__filename)) !== -1)
      assert.ok(stderr.indexOf('deprecated') !== -1)
      assert.ok(stderr.indexOf(' automsgnamed ') !== -1)
    })

    it('should generate message for method call on unnamed function', function () {
      function callold () { mylib.automsg() }
      var stderr = captureStderr(callold)
      assert.ok(stderr.indexOf(basename(__filename)) !== -1)
      assert.ok(stderr.indexOf('deprecated') !== -1)
      assert.ok(stderr.indexOf(' exports.automsg ') !== -1)
    })

    it('should generate message for function call on unnamed function', function () {
      function callold () {
        var fn = mylib.automsg
        fn()
      }
      var stderr = captureStderr(callold)
      assert.ok(stderr.indexOf(basename(__filename)) !== -1)
      assert.ok(stderr.indexOf('deprecated') !== -1)
      assert.ok(stderr.indexOf(' exports.automsg ') !== -1)
    })

    it('should generate message for function call on anonymous function', function () {
      function callold () { mylib.automsganon() }
      var stderr = captureStderr(callold)
      assert.ok(stderr.indexOf(basename(__filename)) !== -1)
      assert.ok(stderr.indexOf('deprecated') !== -1)
      assert.ok(/ exports\.automsganon | <anonymous@[^\\/]+[^:]+:[0-9]+:[0-9]+> /.test(stderr))
    })

    describe('in strict mode library', function () {
      it('should generate message for method call on named function', function () {
        function callold () { strictlib.automsgnamed() }
        var stderr = captureStderr(callold)
        assert.ok(stderr.indexOf(basename(__filename)) !== -1)
        assert.ok(stderr.indexOf('deprecated') !== -1)
        assert.ok(stderr.indexOf(' automsgnamed ') !== -1)
      })

      it('should generate message for function call on named function', function () {
        function callold () {
          var fn = strictlib.automsgnamed
          fn()
        }
        var stderr = captureStderr(callold)
        assert.ok(stderr.indexOf(basename(__filename)) !== -1)
        assert.ok(stderr.indexOf('deprecated') !== -1)
        assert.ok(stderr.indexOf(' automsgnamed ') !== -1)
      })

      it('should generate message for method call on unnamed function', function () {
        function callold () { strictlib.automsg() }
        var stderr = captureStderr(callold)
        assert.ok(stderr.indexOf(basename(__filename)) !== -1)
        assert.ok(stderr.indexOf('deprecated') !== -1)
        assert.ok(stderr.indexOf(' exports.automsg ') !== -1)
      })

      it('should generate message for function call on unnamed function', function () {
        function callold () {
          var fn = strictlib.automsg
          fn()
        }
        var stderr = captureStderr(callold)
        assert.ok(stderr.indexOf(basename(__filename)) !== -1)
        assert.ok(stderr.indexOf('deprecated') !== -1)
        assert.ok(stderr.indexOf(' exports.automsg ') !== -1)
      })

      it('should generate message for function call on anonymous function', function () {
        function callold () { strictlib.automsganon() }
        var stderr = captureStderr(callold)
        assert.ok(stderr.indexOf(basename(__filename)) !== -1)
        assert.ok(stderr.indexOf('deprecated') !== -1)
        assert.ok(/ exports\.automsganon | <anonymous@[^\\/]+[^:]+:[0-9]+:[0-9]+> /.test(stderr))
      })
    })
  })

  describe('when output supports colors', function () {
    var stderr
    before(function () {
      function callold () { mylib.old() }
      stderr = captureStderr(callold, true)
    })

    it('should log in color', function () {
      assert.notStrictEqual(stderr, '')
      assert.ok(stderr.indexOf('\x1b[') !== -1)
    })

    it('should log namespace', function () {
      assert.ok(stderr.indexOf('my-lib') !== -1)
    })

    it('should log deprecation', function () {
      assert.ok(stderr.indexOf('deprecate') !== -1)
    })

    it('should log message', function () {
      assert.ok(stderr.indexOf('old') !== -1)
    })

    it('should log call site', function () {
      assert.ok(stderr.indexOf(basename(__filename)) !== -1)
      assert.ok(/\.js:[0-9]+:[0-9]+/.test(stderr))
    })
  })

  describe('when output does not support colors', function () {
    var stderr
    before(function () {
      function callold () { mylib.old() }
      stderr = captureStderr(callold, false)
    })

    it('should not log in color', function () {
      assert.notStrictEqual(stderr, '')
      assert.ok(stderr.indexOf('\x1b[') === -1)
    })

    it('should log namespace', function () {
      assert.ok(stderr.indexOf('my-lib') !== -1)
    })

    it('should log timestamp', function () {
      assert.ok(/\w+, \d+ \w+ \d{4} \d{2}:\d{2}:\d{2} \w{3}/.test(stderr))
    })

    it('should log deprecation', function () {
      assert.ok(stderr.indexOf('deprecate') !== -1)
    })

    it('should log message', function () {
      assert.ok(stderr.indexOf('old') !== -1)
    })

    it('should log call site', function () {
      assert.ok(stderr.indexOf(basename(__filename)) !== -1)
      assert.ok(/\.js:[0-9]+:[0-9]+/.test(stderr))
    })
  })
})

describe('deprecate.function(fn, message)', function () {
  it('should throw when not given function', function () {
    var deprecate = depd('test')
    assert.throws(deprecate.function.bind(deprecate, 2), /fn.*function/)
  })

  it('should log on call to function', function () {
    function callold () { mylib.oldfn() }
    assert.ok(captureStderr(callold).indexOf(' oldfn ') !== -1)
  })

  it('should have same arity', function () {
    assert.strictEqual(mylib.oldfn.length, 2)
  })

  it('should pass arguments', function () {
    var ret
    function callold () { ret = mylib.oldfn(1, 2) }
    assert.ok(captureStderr(callold).indexOf(' oldfn ') !== -1)
    assert.strictEqual(ret, 2)
  })

  it('should show call site outside scope', function () {
    function callold () { mylib.layerfn() }
    var stderr = captureStderr(callold)
    assert.ok(stderr.indexOf(' oldfn ') !== -1)
    assert.ok(/test.js:[0-9]+:[0-9]+/.test(stderr))
  })

  it('should show call site outside scope from strict lib', function () {
    function callold () { strictlib.layerfn() }
    var stderr = captureStderr(callold)
    assert.ok(stderr.indexOf(' oldfn ') !== -1)
    assert.ok(/test.js:[0-9]+:[0-9]+/.test(stderr))
  })

  it('should only warn once per call site', function () {
    function callold () {
      for (var i = 0; i < 5; i++) {
        mylib.oldfn() // single call site
        process.stderr.write('invoke ' + i + '\n')
      }
    }

    var stderr = captureStderr(callold)
    assert.strictEqual(stderr.split('deprecated').length, 2)
    assert.strictEqual(stderr.split('invoke').length, 6)
  })

  it('should handle rapid calling of deprecated thing', function () {
    this.timeout(5000)

    function callold () {
      for (var i = 0; i < 10000; i++) {
        mylib.oldfn()
      }
    }

    var stderr = captureStderr(callold)
    assert.strictEqual(stderr.split('deprecated').length, 2)
  })

  it('should warn for different calls on same line', function () {
    function callold () {
      mylib.oldfn(); mylib.oldfn()
    }

    var stderr = captureStderr(callold)
    var fileline = stderr.match(/\.js:[0-9]+:/)
    assert.ok(stderr.indexOf(basename(__filename)) !== -1)
    assert.strictEqual(stderr.split('deprecated').length, 3)
    assert.strictEqual(stderr.split(fileline[0]).length, 3)
  })

  describe('when message omitted', function () {
    it('should generate message for method call on named function', function () {
      function callold () { mylib.oldfnauto() }
      var stderr = captureStderr(callold)
      assert.ok(stderr.indexOf(basename(__filename)) !== -1)
      assert.ok(stderr.indexOf('deprecated') !== -1)
      assert.ok(stderr.indexOf(' fn ') !== -1)
      assert.ok(/ at [^\\/]+[^:]+test\.js:/.test(stderr))
    })

    it('should generate message for method call on anonymous function', function () {
      function callold () { mylib.oldfnautoanon() }
      var stderr = captureStderr(callold)
      assert.ok(stderr.indexOf(basename(__filename)) !== -1)
      assert.ok(stderr.indexOf('deprecated') !== -1)
      assert.ok(/ <anonymous@[^\\/]+[^:]+my\.js:[0-9]+:[0-9]+> /.test(stderr))
      assert.ok(/ at [^\\/]+[^:]+test\.js:/.test(stderr))
    })

    describe('in strict mode library', function () {
      it('should generate message for method call on named function', function () {
        function callold () { strictlib.oldfnauto() }
        var stderr = captureStderr(callold)
        assert.ok(stderr.indexOf(basename(__filename)) !== -1)
        assert.ok(stderr.indexOf('deprecated') !== -1)
        assert.ok(stderr.indexOf(' fn ') !== -1)
        assert.ok(/ at [^\\/]+[^:]+test\.js:/.test(stderr))
      })

      it('should generate message for method call on anonymous function', function () {
        function callold () { strictlib.oldfnautoanon() }
        var stderr = captureStderr(callold)
        assert.ok(stderr.indexOf(basename(__filename)) !== -1)
        assert.ok(stderr.indexOf('deprecated') !== -1)
        assert.ok(/ <anonymous@[^\\/]+[^:]+strict\.js:[0-9]+:[0-9]+> /.test(stderr))
        assert.ok(/ at [^\\/]+[^:]+test\.js:/.test(stderr))
      })
    })
  })
})

describe('deprecate.property(obj, prop, message)', function () {
  it('should throw when given primitive', function () {
    var deprecate = depd('test')
    assert.throws(deprecate.property.bind(deprecate, 2), /obj.*object/)
  })

  it('should throw when given missing property', function () {
    var deprecate = depd('test')
    var obj = {}
    assert.throws(deprecate.property.bind(deprecate, obj, 'blargh'), /property.*owner/)
  })

  it('should throw when given non-configurable property', function () {
    var deprecate = depd('test')
    var obj = {}
    Object.defineProperty(obj, 'thing', { value: 'thingie' })
    assert.throws(deprecate.property.bind(deprecate, obj, 'thing'), /property.*configurable/)
  })

  it('should log on access to property', function () {
    function callprop () { return mylib.propa }
    var stderr = captureStderr(callprop)
    assert.ok(stderr.indexOf(' deprecated ') !== -1)
    assert.ok(stderr.indexOf(' propa gone ') !== -1)
  })

  it('should log on setting property', function () {
    var val
    function callprop () { val = mylib.propa }
    function setprop () { mylib.propa = 'newval' }
    var stderr = captureStderr(setprop)
    assert.ok(stderr.indexOf(' deprecated ') !== -1)
    assert.ok(stderr.indexOf(' propa gone ') !== -1)
    assert.ok(captureStderr(callprop).indexOf(' deprecated ') !== -1)
    assert.strictEqual(val, 'newval')
  })

  it('should only warn once per call site', function () {
    function callold () {
      for (var i = 0; i < 5; i++) {
        var v = mylib.propa || v // single call site
        process.stderr.write('access ' + i + '\n')
      }
    }

    var stderr = captureStderr(callold)
    assert.strictEqual(stderr.split('deprecated').length, 2)
    assert.strictEqual(stderr.split('access').length, 6)
  })

  it('should warn for different accesses on same line', function () {
    function callold () {
      mylib.old(); mylib.old()
    }

    var stderr = captureStderr(callold)
    var fileline = stderr.match(/\.js:[0-9]+:/)
    assert.ok(stderr.indexOf(basename(__filename)) !== -1)
    assert.strictEqual(stderr.split('deprecated').length, 3)
    assert.strictEqual(stderr.split(fileline[0]).length, 3)
  })

  it('should show call site outside scope', function () {
    function callold () { mylib.layerprop() }
    var stderr = captureStderr(callold)
    assert.ok(stderr.indexOf(' propa ') !== -1)
    assert.ok(/test.js:[0-9]+:[0-9]+/.test(stderr))
  })

  it('should show call site outside scope from strict lib', function () {
    function callold () { strictlib.layerprop() }
    var stderr = captureStderr(callold)
    assert.ok(stderr.indexOf(' propa ') !== -1)
    assert.ok(/test.js:[0-9]+:[0-9]+/.test(stderr))
  })

  describe('when obj is a function', function () {
    it('should log on access to property on function', function () {
      function callprop () { return mylib.fnprop.propa }
      var stderr = captureStderr(callprop)
      assert.ok(stderr.indexOf(' deprecated ') !== -1)
      assert.ok(stderr.indexOf(' fn propa gone ') !== -1)
    })

    it('should generate message on named function', function () {
      function callprop () { return mylib.fnprop.propautomsg }
      var stderr = captureStderr(callprop)
      assert.ok(stderr.indexOf(' deprecated ') !== -1)
      assert.ok(stderr.indexOf(' thefn.propautomsg ') !== -1)
    })

    describe('in strict mode library', function () {
      it('should log on access to property on function', function () {
        function callprop () { return strictlib.fnprop.propa }
        var stderr = captureStderr(callprop)
        assert.ok(stderr.indexOf(' deprecated ') !== -1)
        assert.ok(stderr.indexOf(' fn propa gone ') !== -1)
      })

      it('should generate message on named function', function () {
        function callprop () { return strictlib.fnprop.propautomsg }
        var stderr = captureStderr(callprop)
        assert.ok(stderr.indexOf(' deprecated ') !== -1)
        assert.ok(stderr.indexOf(' thefn.propautomsg ') !== -1)
      })
    })
  })

  describe('when value descriptor', function () {
    it('should log on access and set', function () {
      function callold () { return mylib.propa }
      function setold () { mylib.propa = 'val' }
      assert.ok(captureStderr(callold).indexOf(' deprecated ') !== -1)
      assert.ok(captureStderr(setold).indexOf(' deprecated ') !== -1)
    })

    it('should not log on set to non-writable', function () {
      function callold () { return mylib.propget }
      function setold () { mylib.propget = 'val' }
      assert.ok(captureStderr(callold).indexOf(' deprecated ') !== -1)
      assert.strictEqual(captureStderr(setold), '')
    })
  })

  describe('when accessor descriptor', function () {
    it('should log on access and set', function () {
      function callold () { return mylib.propdyn }
      function setold () { mylib.propdyn = 'val' }
      assert.ok(captureStderr(callold).indexOf(' deprecated ') !== -1)
      assert.ok(captureStderr(setold).indexOf(' deprecated ') !== -1)
    })

    it('should not log on access when no accessor', function () {
      function callold () { return mylib.propsetter }
      assert.strictEqual(captureStderr(callold), '')
    })

    it('should not log on set when no setter', function () {
      function callold () { mylib.propgetter = 'val' }
      assert.strictEqual(captureStderr(callold), '')
    })
  })

  describe('when message omitted', function () {
    it('should generate message for method call on named function', function () {
      function callold () { return mylib.propauto }
      var stderr = captureStderr(callold)
      assert.ok(stderr.indexOf(basename(__filename)) !== -1)
      assert.ok(stderr.indexOf('deprecated') !== -1)
      assert.ok(stderr.indexOf(' propauto ') !== -1)
      assert.ok(/ at [^\\/]+[^:]+test\.js:/.test(stderr))
    })

    describe('in strict mode library', function () {
      it('should generate message for method call on named function', function () {
        function callold () { return strictlib.propauto }
        var stderr = captureStderr(callold)
        assert.ok(stderr.indexOf(basename(__filename)) !== -1)
        assert.ok(stderr.indexOf('deprecated') !== -1)
        assert.ok(stderr.indexOf(' propauto ') !== -1)
        assert.ok(/ at [^\\/]+[^:]+test\.js:/.test(stderr))
      })
    })
  })
})

describe('process.on(\'deprecation\', fn)', function () {
  var error
  var stderr
  before(function () {
    process.on('deprecation', ondeprecation)
    function callold () { mylib.old() }
    stderr = captureStderr(callold)
  })
  after(function () {
    process.removeListener('deprecation', ondeprecation)
  })

  function ondeprecation (err) { error = err }

  it('should not write when listener exists', function () {
    assert.strictEqual(stderr, '')
  })

  it('should emit error', function () {
    assert.ok(error)
  })

  it('should emit DeprecationError', function () {
    assert.strictEqual(error.name, 'DeprecationError')
  })

  it('should emit error with message', function () {
    assert.strictEqual(error.message, 'old')
  })

  it('should emit error with namespace', function () {
    assert.strictEqual(error.namespace, 'my-lib')
  })

  it('should emit error with proper [[Class]]', function () {
    assert.strictEqual(Object.prototype.toString.call(error), '[object Error]')
  })

  it('should be instanceof Error', function () {
    assert.ok(error instanceof Error)
  })

  it('should emit error with proper stack', function () {
    var stack = error.stack.split('\n')
    assert.strictEqual(stack[0], 'DeprecationError: my-lib deprecated old')
    assert.ok(/ {4}at callold \(.+test\.js:[0-9]+:[0-9]+\)/.test(stack[1]))
  })

  it('should have writable properties', function () {
    error.name = 'bname'
    assert.strictEqual(error.name, 'bname')
    error.message = 'bmessage'
    assert.strictEqual(error.message, 'bmessage')
    error.stack = 'bstack'
    assert.strictEqual(error.stack, 'bstack')
  })
})

describe('process.env.NO_DEPRECATION', function () {
  var error
  function ondeprecation (err) { error = err }

  beforeEach(function () {
    error = null
  })

  afterEach(function () {
    process.removeListener('deprecation', ondeprecation)
  })

  after(function () {
    process.env.NO_DEPRECATION = ''
  })

  it('should suppress given namespace', function () {
    process.env.NO_DEPRECATION = 'old-lib'
    var oldlib = libs.old
    assert.strictEqual(captureStderr(oldlib.old), '')
    assert.notStrictEqual(captureStderr(oldlib.old2), '')
  })

  it('should suppress multiple namespaces', function () {
    process.env.NO_DEPRECATION = 'cool-lib,neat-lib'
    var coollib = libs.cool
    assert.strictEqual(captureStderr(coollib.cool), '')
    assert.strictEqual(captureStderr(coollib.neat), '')
  })

  it('should be case-insensitive', function () {
    process.env.NO_DEPRECATION = 'NEW-LIB'
    var newlib = libs.new
    assert.strictEqual(captureStderr(newlib.old), '')
  })

  it('should emit "deprecation" events anyway', function () {
    process.env.NO_DEPRECATION = 'thing-lib'
    var thinglib = libs.thing
    process.on('deprecation', ondeprecation)
    assert.strictEqual(captureStderr(thinglib.old), '')
    assert.strictEqual(error.namespace, 'thing-lib')
  })

  describe('when *', function () {
    it('should suppress any namespace', function () {
      process.env.NO_DEPRECATION = '*'
      var multilib = libs.multi
      assert.strictEqual(captureStderr(multilib.old), '')
      assert.strictEqual(captureStderr(multilib.old2), '')
    })
  })
})

describe('process.env.TRACE_DEPRECATION', function () {
  before(function () {
    process.env.TRACE_DEPRECATION = 'trace-lib'
  })

  after(function () {
    process.env.TRACE_DEPRECATION = ''
  })

  it('should trace given namespace', function () {
    var tracelib = libs.trace
    function callold () { tracelib.old() }
    assert.ok(captureStderr(callold).indexOf(' trace-lib deprecated old\n    at callold (') !== -1)
  })

  it('should not trace non-given namespace', function () {
    var tracelib = libs.trace
    function callold () { tracelib.old2() }
    assert.ok(captureStderr(callold).indexOf(' trace-lib-other deprecated old2 at ') !== -1)
  })

  describe('when output supports colors', function () {
    var stderr
    before(function () {
      var tracelib = libs.trace
      function callold () { tracelib.old() }
      stderr = captureStderr(callold, true)
    })

    it('should log in color', function () {
      assert.notStrictEqual(stderr, '')
      assert.ok(stderr.indexOf('\x1b[') !== -1)
    })

    it('should log namespace', function () {
      assert.ok(stderr.indexOf('trace-lib') !== -1)
    })

    it('should log call site in color', function () {
      assert.ok(stderr.indexOf(basename(__filename)) !== -1)
      assert.ok(/\x1b\[\d+mat callold \(/.test(stderr)) // eslint-disable-line no-control-regex
    })
  })
})

describe('node script.js', function () {
  it('should display deprecation message', function (done) {
    captureChildStderr(script, [], function (err, stderr) {
      if (err) return done(err)
      var filename = path.relative(process.cwd(), script)
      assert.strictEqual(stderr, '__timestamp__ my-cool-module deprecated oldfunction at ' + filename + ':7:10\n')
      done()
    })
  })
})

;(function () {
  // --*-deprecation switches are 0.8+
  // no good way to feature detect this sync
  var describe = /^v0\.6\./.test(process.version)
    ? global.describe.skip
    : global.describe

  describe('node --no-deprecation script.js', function () {
    it('should suppress deprecation message', function (done) {
      captureChildStderr(script, ['--no-deprecation'], function (err, stderr) {
        if (err) return done(err)
        assert.strictEqual(stderr, '')
        done()
      })
    })
  })

  describe('node --trace-deprecation script.js', function () {
    it('should suppress deprecation message', function (done) {
      captureChildStderr(script, ['--trace-deprecation'], function (err, stderr) {
        if (err) return done(err)
        assert.ok(stderr.indexOf('__timestamp__ my-cool-module deprecated oldfunction\n    at run (' + script + ':7:10)\n    at') === 0)
        done()
      })
    })
  })
}())

function captureChildStderr (script, opts, callback) {
  var chunks = []
  var env = { PATH: process.env.PATH }
  var exec = process.execPath

  var args = opts.concat(script)
  var proc = spawn(exec, args, {
    env: env
  })

  proc.stdout.resume()
  proc.stderr.on('data', function ondata (chunk) {
    chunks.push(chunk)
  })

  proc.on('error', callback)
  proc.on('exit', function () {
    var stderr = Buffer.concat(chunks)
      .toString('utf8')
      .replace(/\w+, \d+ \w+ \d+ \d+:\d+:\d+ \w+/, '__timestamp__')
    callback(null, stderr)
  })
}
