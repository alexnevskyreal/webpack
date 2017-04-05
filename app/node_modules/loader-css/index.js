var Loader = require('loader-core')
var loadCSS = require('./lib/loader')

Loader.register('css', function (opts) {
  var loader = new Loader(opts)
  loader.loader = loadCSS
  return loader
})

module.exports = Loader

