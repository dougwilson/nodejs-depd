
var deprecate = require('../..')('my-lib')

exports.old = function () {
  deprecate('old')
}
