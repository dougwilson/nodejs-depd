
var basename = require('path').basename
var depd = require('..')
var mylib = require('./fixtures/my-lib')
var should = require('should')

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

  return Buffer.concat(chunks).toString('utf8')
}
