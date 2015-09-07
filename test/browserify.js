
var assert = require('assert')
var basename = require('path').basename
var browserify = tryRequire('browserify')
var bufferConcat = require('../lib/compat').bufferConcat
var depd = null
var mylib = null
var path = require('path')
var run = browserify ? describe : describe.skip

run('when browserified', function () {
  before(function (done) {
    var b = browserify()

    // require depd
    b.require(path.join(__dirname, '..'), {
      expose: 'depd'
    })

    // require libs
    b.require(path.join(__dirname, 'fixtures', 'libs'), {
      expose: 'libs'
    })

    b.bundle(function (err, buf) {
      var require = eval(buf.toString())
      depd = require('depd')
      mylib = require('libs').my
      done()
    })
  })

  describe('depd(namespace)', function () {
    it('creates deprecated function', function () {
      assert.equal(typeof depd('test'), 'function')
    })

    it('requires namespace', function () {
      assert.throws(depd.bind(null), /namespace.*required/)
    })
  })

  describe('deprecate(message)', function () {
    it('should not log message', function () {
      function callold() { mylib.old() }
      assert.equal(captureStderr(callold), '')
    })

    describe('when message omitted', function () {
      it('should not log message', function () {
        function callold() { mylib.automsgnamed() }
        assert.equal(captureStderr(callold), '')
      })
    })
  })

  describe('deprecate.function(fn, message)', function () {
    it('should throw when not given function', function () {
      var deprecate = depd('test')
      assert.throws(deprecate.function.bind(deprecate, 2), /fn.*function/)
    })

    it('should not log on call to function', function () {
      function callold() { mylib.oldfn() }
      assert.equal(captureStderr(callold), '')
    })

    it('should have same arity', function () {
      assert.equal(mylib.oldfn.length, 2)
    })

    it('should pass arguments', function () {
      var ret
      function callold() { ret = mylib.oldfn(1, 2) }
      assert.equal(captureStderr(callold), '')
      assert.equal(ret, 2)
    })

    describe('when message omitted', function () {
      it('should not log message', function () {
        function callold() { mylib.oldfnauto() }
        assert.equal(captureStderr(callold), '')
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
      Object.defineProperty(obj, 'thing', {value: 'thingie'})
      assert.throws(deprecate.property.bind(deprecate, obj, 'thing'), /property.*configurable/)
    })

    it('should not log on access to property', function () {
      function callprop() { mylib.propa }
      assert.equal(captureStderr(callprop), '')
    })

    it('should not log on setting property', function () {
      var val
      function callprop() { val = mylib.propa }
      function setprop() { mylib.propa = 'newval' }
      assert.equal(captureStderr(setprop), '')
      assert.equal(captureStderr(callprop), '')
      assert.equal(val, 'newval')
    })

    describe('when obj is a function', function () {
      it('should not log on access to property on function', function () {
        function callprop() { mylib.fnprop.propa }
        assert.equal(captureStderr(callprop), '')
      })

      it('should not generate message on named function', function () {
        function callprop() { mylib.fnprop.propautomsg }
        assert.equal(captureStderr(callprop), '')
      })
    })

    describe('when value descriptor', function () {
      it('should not log on access and set', function () {
        function callold() { mylib.propa }
        function setold() { mylib.propa = 'val' }
        assert.equal(captureStderr(callold), '')
        assert.equal(captureStderr(setold), '')
      })

      it('should not log on set to non-writable', function () {
        function callold() { mylib.propget }
        function setold() { mylib.propget = 'val' }
        assert.equal(captureStderr(callold), '')
        assert.equal(captureStderr(setold), '')
      })
    })

    describe('when accessor descriptor', function () {
      it('should log on access and set', function () {
        function callold() { mylib.propdyn }
        function setold() { mylib.propdyn = 'val' }
        assert.equal(captureStderr(callold), '')
        assert.equal(captureStderr(setold), '')
      })

      it('should not log on access when no accessor', function () {
        function callold() { mylib.propsetter }
        assert.equal(captureStderr(callold), '')
      })

      it('should not log on set when no setter', function () {
        function callold() { mylib.propgetter = 'val' }
        assert.equal(captureStderr(callold), '')
      })
    })

    describe('when message omitted', function () {
      it('should not generate message for method call on named function', function () {
        function callold() { mylib.propauto }
        assert.equal(captureStderr(callold), '')
      })
    })
  })
})

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

function tryRequire(name) {
  try {
    return require(name)
  } catch (e) {
    return undefined
  }
}
