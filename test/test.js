
var basename = require('path').basename
var bufferConcat = require('../lib/compat').bufferConcat
var depd = require('..')
var mylib = require('./fixtures/my-lib')
var path = require('path')
var script = path.join(__dirname, 'fixtures', 'script.js')
var should = require('should')
var spawn = require('child_process').spawn

describe('depd(namespace)', function () {
  it('creates deprecated function', function () {
    depd('test').should.be.a.function
  })

  it('requires namespace', function () {
    depd.bind().should.throw(/namespace.*required/)
  })
})

describe('deprecate(message)', function () {
  it('should log namespace', function () {
    function callold() { mylib.old() }
    captureStderr(callold).should.containEql('my-lib')
  })

  it('should log deprecation', function () {
    function callold() { mylib.old() }
    captureStderr(callold).should.containEql('deprecate')
  })

  it('should log message', function () {
    function callold() { mylib.old() }
    captureStderr(callold).should.containEql('old')
  })

  it('should log call site', function () {
    function callold() { mylib.old() }
    var stderr = captureStderr(callold)
    stderr.should.containEql(basename(__filename))
    stderr.should.match(/\.js:[0-9]+:[0-9]+/)
  })

  it('should log call site regardless of Error.stackTraceLimit', function () {
    function callold() { mylib.old() }
    var limit = Error.stackTraceLimit
    try {
      Error.stackTraceLimit = 1
      var stderr = captureStderr(callold)
      stderr.should.containEql(basename(__filename))
      stderr.should.match(/\.js:[0-9]+:[0-9]+/)
    } finally {
      Error.stackTraceLimit = limit
    }
  })

  it('should log call site within eval', function () {
    function callold() { eval('mylib.old()') }
    var stderr = captureStderr(callold)
    stderr.should.containEql(basename(__filename))
    stderr.should.containEql('<anonymous>:1:')
    stderr.should.match(/\.js:[0-9]+:[0-9]+/)
  })

  it('should only warn once per call site', function () {
    function callold() {
      for (var i = 0; i < 5; i++) {
        mylib.old() // single call site
        process.stderr.write('invoke ' + i + '\n')
      }
    }

    var stderr = captureStderr(callold)
    stderr.split('deprecated').should.have.length(2)
    stderr.split('invoke').should.have.length(6)
  })

  it('should warn for different fns on same call site', function () {
    var prop

    function callold() {
      mylib[prop]() // call from same site
    }

    prop = 'old'
    captureStderr(callold).should.containEql(basename(__filename))

    prop = 'old2'
    captureStderr(callold).should.containEql(basename(__filename))
  })

  it('should warn for different calls on same line', function () {
    function callold() {
      mylib.old(), mylib.old()
    }

    var stderr = captureStderr(callold)
    var fileline = stderr.match(/\.js:[0-9]+:/)
    stderr.should.containEql(basename(__filename))
    stderr.split('deprecated').should.have.length(3)
    stderr.split(fileline[0]).should.have.length(3)
  })

  describe('when message omitted', function () {
    it('should generate message for method call on named function', function () {
      function callold() { mylib.automsgnamed() }
      var stderr = captureStderr(callold)
      stderr.should.containEql(basename(__filename))
      stderr.should.containEql('deprecated')
      stderr.should.containEql(' Object.automsgnamed ')
    })

    it('should generate message for function call on named function', function () {
      function callold() {
        var fn = mylib.automsgnamed
        fn()
      }
      var stderr = captureStderr(callold)
      stderr.should.containEql(basename(__filename))
      stderr.should.containEql('deprecated')
      stderr.should.containEql(' automsgnamed ')
    })

    it('should generate message for method call on unnamed function', function () {
      function callold() { mylib.automsg() }
      var stderr = captureStderr(callold)
      stderr.should.containEql(basename(__filename))
      stderr.should.containEql('deprecated')
      stderr.should.containEql(' Object.exports.automsg ')
    })

    it('should generate message for function call on unnamed function', function () {
      function callold() {
        var fn = mylib.automsg
        fn()
      }
      var stderr = captureStderr(callold)
      stderr.should.containEql(basename(__filename))
      stderr.should.containEql('deprecated')
      stderr.should.containEql(' exports.automsg ')
    })

    it('should generate message for function call on anonymous function', function () {
      function callold() { mylib.automsganon() }
      var stderr = captureStderr(callold)
      stderr.should.containEql(basename(__filename))
      stderr.should.containEql('deprecated')
      stderr.should.match(/ exports\.automsganon | <anonymous@[^:]+:[0-9]+:[0-9]+> /)
    })
  })

  describe('when output supports colors', function () {
    var stderr
    before(function () {
      function callold() { mylib.old() }
      stderr = captureStderr(callold, true)
    })

    it('should log in color', function () {
      stderr.should.not.be.empty
      stderr.should.containEql('\x1b[')
    })

    it('should log namespace', function () {
      stderr.should.containEql('my-lib')
    })

    it('should log deprecation', function () {
      stderr.should.containEql('deprecate')
    })

    it('should log message', function () {
      stderr.should.containEql('old')
    })

    it('should log call site', function () {
      stderr.should.containEql(basename(__filename))
      stderr.should.match(/\.js:[0-9]+:[0-9]+/)
    })
  })

  describe('when output does not support colors', function () {
    var stderr
    before(function () {
      function callold() { mylib.old() }
      stderr = captureStderr(callold, false)
    })

    it('should not log in color', function () {
      stderr.should.not.be.empty
      stderr.should.not.containEql('\x1b[')
    })

    it('should log namespace', function () {
      stderr.should.containEql('my-lib')
    })

    it('should log timestamp', function () {
      stderr.should.match(/\w+, \d+ \w+ \d{4} \d{2}:\d{2}:\d{2} \w{3}/)
    })

    it('should log deprecation', function () {
      stderr.should.containEql('deprecate')
    })

    it('should log message', function () {
      stderr.should.containEql('old')
    })

    it('should log call site', function () {
      stderr.should.containEql(basename(__filename))
      stderr.should.match(/\.js:[0-9]+:[0-9]+/)
    })
  })
})

describe('deprecate.function(fn, message)', function () {
  it('should thrown when not given function', function () {
    var deprecate = depd('test')
    deprecate.function.bind(deprecate, 2).should.throw(/fn.*function/)
  })

  it('should log on call to function', function () {
    function callold() { mylib.oldfn() }
    captureStderr(callold).should.containEql(' oldfn ')
  })

  it('should have same arity', function () {
    mylib.oldfn.should.have.length(2)
  })

  it('should pass arguments', function () {
    var ret
    function callold() { ret = mylib.oldfn(1, 2) }
    captureStderr(callold).should.containEql(' oldfn ')
    ret.should.equal(2)
  })

  it('should show call site outside scope', function () {
    function callold() { mylib.layerfn() }
    var stderr = captureStderr(callold)
    stderr.should.containEql(' oldfn ')
    stderr.should.match(/test.js:[0-9]+:[0-9]+/)
  })

  it('should only warn once per call site', function () {
    function callold() {
      for (var i = 0; i < 5; i++) {
        mylib.oldfn() // single call site
        process.stderr.write('invoke ' + i + '\n')
      }
    }

    var stderr = captureStderr(callold)
    stderr.split('deprecated').should.have.length(2)
    stderr.split('invoke').should.have.length(6)
  })

  it('should handle rapid calling of deprecated thing', function () {
    function callold() {
      for (var i = 0; i < 10000; i++) {
        mylib.oldfn()
      }
    }

    var stderr = captureStderr(callold)
    stderr.split('deprecated').should.have.length(2)
  })

  it('should warn for different calls on same line', function () {
    function callold() {
      mylib.oldfn(), mylib.oldfn()
    }

    var stderr = captureStderr(callold)
    var fileline = stderr.match(/\.js:[0-9]+:/)
    stderr.should.containEql(basename(__filename))
    stderr.split('deprecated').should.have.length(3)
    stderr.split(fileline[0]).should.have.length(3)
  })

  describe('when message omitted', function () {
    it('should generate message for method call on named function', function () {
      function callold() { mylib.oldfnauto() }
      var stderr = captureStderr(callold)
      stderr.should.containEql(basename(__filename))
      stderr.should.containEql('deprecated')
      stderr.should.containEql(' Object.fn ')
      stderr.should.match(/ at [^:]+test\.js:/)
    })

    it('should generate message for method call on anonymous function', function () {
      function callold() { mylib.oldfnautoanon() }
      var stderr = captureStderr(callold)
      stderr.should.containEql(basename(__filename))
      stderr.should.containEql('deprecated')
      stderr.should.match(/ <anonymous@[^:]+my-lib\.js:[0-9]+:[0-9]+> /)
      stderr.should.match(/ at [^:]+test\.js:/)
    })
  })
})

describe('deprecate.property(obj, prop, message)', function () {
  it('should throw when given primitive', function () {
    var deprecate = depd('test')
    deprecate.property.bind(deprecate, 2).should.throw(/obj.*object/)
  })

  it('should throw when given missing property', function () {
    var deprecate = depd('test')
    var obj = {}
    deprecate.property.bind(deprecate, obj, 'blargh').should.throw(/property.*owner/)
  })

  it('should throw when given non-configurable property', function () {
    var deprecate = depd('test')
    var obj = {}
    Object.defineProperty(obj, 'thing', {value: 'thingie'})
    deprecate.property.bind(deprecate, obj, 'thing').should.throw(/property.*configurable/)
  })

  it('should log on access to property', function () {
    function callprop() { mylib.propa }
    var stderr = captureStderr(callprop)
    stderr.should.containEql(' deprecated ')
    stderr.should.containEql(' propa gone ')
  })

  it('should log on setting property', function () {
    var val
    function callprop() { val = mylib.propa }
    function setprop() { mylib.propa = 'newval' }
    var stderr = captureStderr(setprop)
    stderr.should.containEql(' deprecated ')
    stderr.should.containEql(' propa gone ')
    captureStderr(callprop).should.containEql(' deprecated ')
    val.should.equal('newval')
  })

  it('should only warn once per call site', function () {
    function callold() {
      for (var i = 0; i < 5; i++) {
        mylib.propa // single call site
        process.stderr.write('access ' + i + '\n')
      }
    }

    var stderr = captureStderr(callold)
    stderr.split('deprecated').should.have.length(2)
    stderr.split('access').should.have.length(6)
  })

  it('should warn for different accesses on same line', function () {
    function callold() {
      mylib.propa, mylib.propa
    }

    var stderr = captureStderr(callold)
    var fileline = stderr.match(/\.js:[0-9]+:/)
    stderr.should.containEql(basename(__filename))
    stderr.split('deprecated').should.have.length(3)
    stderr.split(fileline[0]).should.have.length(3)
  })

  it('should show call site outside scope', function () {
    function callold() { mylib.layerprop() }
    var stderr = captureStderr(callold)
    stderr.should.containEql(' propa ')
    stderr.should.match(/test.js:[0-9]+:[0-9]+/)
  })

  describe('when obj is a function', function () {
    it('should log on access to property on function', function () {
      function callprop() { mylib.fnprop.propa }
      var stderr = captureStderr(callprop)
      stderr.should.containEql(' deprecated ')
      stderr.should.containEql(' fn propa gone ')
    })

    it('should generate message on named function', function () {
      function callprop() { mylib.fnprop.propautomsg }
      var stderr = captureStderr(callprop)
      stderr.should.containEql(' deprecated ')
      stderr.should.containEql(' thefn.propautomsg ')
    })
  })

  describe('when value descriptor', function () {
    it('should log on access and set', function () {
      function callold() { mylib.propa }
      function setold() { mylib.propa = 'val' }
      captureStderr(callold).should.containEql(' deprecated ')
      captureStderr(setold).should.containEql(' deprecated ')
    })

    it('should not log on set to non-writable', function () {
      function callold() { mylib.propget }
      function setold() { mylib.propget = 'val' }
      captureStderr(callold).should.containEql(' deprecated ')
      captureStderr(setold).should.be.empty
    })
  })

  describe('when accessor descriptor', function () {
    it('should log on access and set', function () {
      function callold() { mylib.propdyn }
      function setold() { mylib.propdyn = 'val' }
      captureStderr(callold).should.containEql(' deprecated ')
      captureStderr(setold).should.containEql(' deprecated ')
    })

    it('should not log on access when no accessor', function () {
      function callold() { mylib.propsetter }
      captureStderr(callold).should.be.empty
    })

    it('should not log on set when no setter', function () {
      function callold() { mylib.propgetter = 'val' }
      captureStderr(callold).should.be.empty
    })
  })

  describe('when message omitted', function () {
    it('should generate message for method call on named function', function () {
      function callold() { mylib.propauto }
      var stderr = captureStderr(callold)
      stderr.should.containEql(basename(__filename))
      stderr.should.containEql('deprecated')
      stderr.should.containEql(' Object.propauto ')
      stderr.should.match(/ at [^:]+test\.js:/)
    })
  })
})

describe('process.on(\'deprecation\', fn)', function () {
  var error
  var stderr
  before(function () {
    process.on('deprecation', ondeprecation)
    function callold() { mylib.old() }
    stderr = captureStderr(callold)
  })
  after(function () {
    process.removeListener('deprecation', ondeprecation)
  })

  function ondeprecation(err) { error = err }

  it('should not write when listener exists', function () {
    stderr.should.be.empty
  })

  it('should emit error', function () {
    error.should.be.ok
  })

  it('should emit DeprecationError', function () {
    error.name.should.equal('DeprecationError')
  })

  it('should emit DeprecationError', function () {
    error.name.should.equal('DeprecationError')
  })

  it('should emit error with message', function () {
    error.message.should.equal('old')
  })

  it('should emit error with namespace', function () {
    error.namespace.should.equal('my-lib')
  })

  it('should emit error with proper [[Class]]', function () {
    Object.prototype.toString.call(error).should.equal('[object Error]')
  })

  it('should be instanceof Error', function () {
    error.should.be.instanceof(Error)
  })

  it('should emit error with proper stack', function () {
    var stack = error.stack.split('\n')
    stack[0].should.equal('DeprecationError: my-lib deprecated old')
    stack[1].should.match(/    at callold \(.+test\.js:[0-9]+:[0-9]+\)/)
  })

  it('should have writable properties', function () {
    error.name = 'bname'
    error.name.should.equal('bname')
    error.message = 'bmessage'
    error.message.should.equal('bmessage')
    error.stack = 'bstack'
    error.stack.should.equal('bstack')
  })
})

describe('process.env.NO_DEPRECATION', function () {
  var error
  function ondeprecation(err) { error = err }

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
    var oldlib = require('./fixtures/old-lib')
    captureStderr(oldlib.old).should.be.empty
    captureStderr(oldlib.old2).should.not.be.empty
  })

  it('should suppress multiple namespaces', function () {
    process.env.NO_DEPRECATION = 'cool-lib,neat-lib'
    var coollib = require('./fixtures/cool-lib')
    captureStderr(coollib.cool).should.be.empty
    captureStderr(coollib.neat).should.be.empty
  })

  it('should be case-insensitive', function () {
    process.env.NO_DEPRECATION = 'NEW-LIB'
    var newlib = require('./fixtures/new-lib')
    captureStderr(newlib.old).should.be.empty
  })

  it('should emit "deprecation" events anyway', function () {
    process.env.NO_DEPRECATION = 'thing-lib'
    var thinglib = require('./fixtures/thing-lib')
    process.on('deprecation', ondeprecation)
    captureStderr(thinglib.old).should.be.empty
    error.namespace.should.equal('thing-lib')
  })

  describe('when *', function () {
    it('should suppress any namespace', function () {
      process.env.NO_DEPRECATION = '*'
      var multilib = require('./fixtures/multi-lib')
      captureStderr(multilib.old).should.be.empty
      captureStderr(multilib.old2).should.be.empty
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
    var tracelib = require('./fixtures/trace-lib')
    function callold() { tracelib.old() }
    captureStderr(callold).should.containEql(' trace-lib deprecated old\n    at callold (')
  })

  it('should not trace non-given namespace', function () {
    var tracelib = require('./fixtures/trace-lib')
    function callold() { tracelib.old2() }
    captureStderr(callold).should.containEql(' trace-lib-other deprecated old2 at ')
  })

  describe('when output supports colors', function () {
    var stderr
    before(function () {
      var tracelib = require('./fixtures/trace-lib')
      function callold() { tracelib.old() }
      stderr = captureStderr(callold, true)
    })

    it('should log in color', function () {
      stderr.should.not.be.empty
      stderr.should.containEql('\x1b[')
    })

    it('should log namespace', function () {
      stderr.should.containEql('trace-lib')
    })

    it('should log call site in color', function () {
      stderr.should.containEql(basename(__filename))
      stderr.should.match(/\x1b\[\d+mat callold \(/)
    })
  })
})

describe('node script.js', function () {
  it('should display deprecation message', function (done) {
    captureChildStderr([script], function (err, stderr) {
      if (err) return done(err)
      var filename = path.relative(process.cwd(), script)
      stderr = stderr.replace(/\w+, \d+ \w+ \d+ \d+:\d+:\d+ \w+/, '__timestamp__')
      stderr.should.equal('__timestamp__ my-cool-module deprecated oldfunction at ' + filename + ':7:10\n')
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
      captureChildStderr(['--no-deprecation', script], function (err, stderr) {
        if (err) return done(err)
        stderr.should.be.empty
        done()
      })
    })
  })

  describe('node --trace-deprecation script.js', function () {
    it('should suppress deprecation message', function (done) {
      captureChildStderr(['--trace-deprecation', script], function (err, stderr) {
        if (err) return done(err)
        stderr = stderr.replace(/\w+, \d+ \w+ \d+ \d+:\d+:\d+ \w+/, '__timestamp__')
        stderr.should.startWith('__timestamp__ my-cool-module deprecated oldfunction\n    at run (' + script + ':7:10)\n    at')
        done()
      })
    })
  })
}())

function captureChildStderr(args, callback) {
  var chunks = []
  var env = {PATH: process.env.PATH}
  var exec = process.argv[0]
  var proc = spawn(exec, args, {
    env: env
  })

  proc.stdout.resume()
  proc.stderr.on('data', function ondata(chunk) {
    chunks.push(chunk)
  })

  proc.on('error', callback)
  proc.on('exit', function () {
    var stderr = bufferConcat(chunks).toString('utf8')
    callback(null, stderr)
  })
}

function captureStderr(fn, color) {
  var chunks = []
  var isTTY = process.stderr.isTTY
  var write = process.stderr.write

  process.stderr.isTTY = Boolean(color)
  process.stderr.write = function write(chunk, encoding) {
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
