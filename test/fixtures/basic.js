
var deprecate = require('../..')('basic')

var object = { foo: 'bar' }
deprecate.property(object, 'foo')

function fn () {}
deprecate.function(fn)
