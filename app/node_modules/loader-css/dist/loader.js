(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Loader = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Loader = require('loader-core')
var loadCSS = require('./lib/loader')

Loader.register('css', function (opts) {
  var loader = new Loader(opts)
  loader.loader = loadCSS
  return loader
})

module.exports = Loader


},{"./lib/loader":2,"loader-core":4}],2:[function(require,module,exports){
var ua = require('./ua')

// http://yuilibrary.com/yui/docs/api/files/get_js_get.js.html#l540
// True if this browser fires an event when a dynamically injected
// link node finishes loading. This is currently true for IE, Opera,
// Firefox 9+, and WebKit 535.24+. Note that IE versions <9 fire the
// DOM 0 "onload" event, but not "load". All versions of IE fire "onload".
// davglass: Seems that Chrome on Android needs this to be false.
var cssLoad = (function () {
  if (ua.chrome && ua.chrome <= 18) {
    return false
  }
  if (!ua.gecko && !ua.webkit) {
    return true
  }
  if (ua.gecko >= 9) {
    return true
  }
  if (ua.compareVersions(ua.webkit, 535.24) >= 0) {
    return true
  }

  return false
})()

// True if this browser fires an event when a dynamically injected
// link node fails to load. This is currently true for Firefox 9+
// and WebKit 535.24+
var cssFail = ua.gecko >= 9 || ua.compareVersions(ua.webkit, 535.24) >= 0

var poll = (function () {
  function checkFirefox(cb) {
    var node
    var cssRules
    for (var i = pendingCSS.length; i >= 0; --i) {
      node = pendingCSS[i]
      // Many thanks to Zach Leatherman for calling my attention to
      // the @import-based cross-domain technique used here, and to
      // Oleg Slobodskoi for an earlier same-domain implementation.
      //
      // See Zach's blog for more details:
      // http://www.zachleat.com/web/2010/07/29/load-css-dynamically/
      try {
        // We don't really need to store this value since we never
        // use it again, but if we don't store it, Closure Compiler
        // assumes the code is useless and removes it.
        cssRules = node.sheet.cssRules
        node.sheet.cssRules = cssRules

        // If we get here, the stylesheet has loaded.
        pendingCSS.splice(i, 1)
        cb(node)
      } catch (ex) {
        // An exception means the stylesheet is still loading.
      }
    }
  }

  function checkWebKit(cb) {
    var j
    var node
    var nodeHref
    // Look for a stylesheet matching the pending URL.
    var sheets = document.styleSheets
    var numSheets = sheets.length
    for (var i = pendingCSS.length; i >= 0; --i) {
      node = pendingCSS[i]
      nodeHref = node.href
      j = numSheets
      while (--j >= 0) {
        if (sheets[j].href === nodeHref) {
          pendingCSS.splice(i, 1)
          cb(node)
          break
        }
      }
    }
  }

  function _poll(cb, done) {
    if (ua.webkit) {
      checkWebKit(cb)
    } else {
      checkFirefox(cb)
    }
    if (pendingCSS.length) {
      setTimeout(_poll, 50, cb, done)
    } else {
      done()
    }
  }

  var pendingCSS = []
  var polling

  return function (node, cb) {
    pendingCSS.push(node)
    if (polling) {
      return
    }
    polling = true

    _poll(cb, function () {
      polling = false
    })
  }
})()

function loadCSS(src) {
  return new Promise(function (resolve, reject) {
    var node
    if (!cssLoad && ua.gecko) {
      // In Firefox <9, we can import the requested URL into a <style>
      // node and poll for the existence of node.sheet.cssRules. This
      // gives us a reliable way to determine CSS load completion that
      // also works for cross-domain stylesheets.
      //
      // Props to Zach Leatherman for calling my attention to this
      // technique.
      node = document.createElement('style')
      node.innerHTML = '@import "' + src + '";'
    } else {
      node = document.createElement('link')
      node.setAttribute('type', 'text/css')
      node.setAttribute('rel', 'stylesheet')
      node.setAttribute('href', src)
    }

    // If this browser doesn't fire an event when CSS fails to load,
    // fail after a timeout to avoid blocking the transaction queue.
    var cssTimeout
    if (!cssFail) {
      cssTimeout = setTimeout(reject, 3000)
    }

    if (!cssLoad) {
      // CSS on Firefox <9 or WebKit.
      poll(node, resolve)
    } else {
      node.onerror = function (err) {
        node.onload = node.onerror = null
        reject(err)
      }
      node.onload = function () {
        node.onload = node.onerror = null
        if (cssTimeout) {
          clearTimeout(cssTimeout)
        }
        resolve()
      }
    }

    var ref = document.getElementsByTagName('script')[0]
    ref.parentNode.insertBefore(node, ref)
  })
}

module.exports = loadCSS


},{"./ua":3}],3:[function(require,module,exports){
function numberify(s) {
  var c = 0
  return parseFloat(s.replace(/\./g, function () {
    return c++ === 1 ? '' : '.'
  }))
}

function parseUA(o, ua) {
  o.webkit = 0
  o.chrome = 0
  o.gecko = 0
  o.ie = 0

  if ((/KHTML/).test(ua)) {
    o.webkit = 1
  }

  // Modern WebKit browsers are at least X-Grade
  var m = ua.match(/AppleWebKit\/([^\s]*)/)
  if (m && m[1]) {
    o.webkit = numberify(m[1])

    m = ua.match(/(Chrome|CrMo|CriOS)\/([^\s]*)/)
    if (m && m[1] && m[2]) {
      // Chrome
      o.chrome = numberify(m[2])
    }
  }

  m = ua.match(/Ubuntu\ (\d+\.\d+)/)
  if (m && m[1]) {
    m = ua.match(/\ WebKit\/([^\s]*)/)
    if (m && m[1]) {
      o.webkit = numberify(m[1])
    }

    m = ua.match(/\ Chromium\/([^\s]*)/)
    if (m && m[1]) {
      o.chrome = numberify(m[1])
    }
  }

  if (!o.webkit) {
    m = ua.match(/MSIE ([^;]*)|Trident.*; rv:([0-9.]+)/)
    if (m && (m[1] || m[2])) {
      o.ie = numberify(m[1] || m[2])
    } else if (!/Opera/.test(ua)) {
      if (ua.match(/Gecko\/([^\s]*)/)) {
        // Gecko detected, look for revision
        o.gecko = 1
        m = ua.match(/rv:([^\s\)]*)/)
        if (m && m[1]) {
          o.gecko = numberify(m[1])
        }
      }
    }
  }
  return o
}

var nav = window.navigator
var ua = nav && nav.userAgent

if (ua) {
  parseUA(exports, ua)
}

exports.compareVersions = function (a, b) {
  if (a === b) {
    return 0
  }

  var aParts = (a + '').split('.')
  var bParts = (b + '').split('.')

  var aPart
  var bPart
  for (var i = 0, len = Math.max(aParts.length, bParts.length); i < len; ++i) {
    aPart = parseInt(aParts[i], 10)
    bPart = parseInt(bParts[i], 10)

    if (isNaN(aPart)) {
      aPart = 0
    }
    if (isNaN(bPart)) {
      bPart = 0
    }

    if (aPart < bPart) {
      return -1
    }

    if (aPart > bPart) {
      return 1
    }
  }

  return 0
}


},{}],4:[function(require,module,exports){
var RESOLVED = Promise.resolve()

function Loader(opts) {
  opts = opts || {}
  this.resolve = opts.resolve || resolveJS
  this.loader = opts.loader || loadJS
  this._state = { requests: [] }
}

Loader.prototype.load = function (requests) {
  requests = [].concat(requests).filter(Boolean)
  if (!requests.length) return RESOLVED

  var self = this
  var state = self._state
  state.requests.push.apply(state.requests, requests)

  if (!state.loaded) {
    // Allow this loader to collect more requests
    // by invoking `this.load` in the same tick
    state.loaded = RESOLVED.then(function () {
      self._state = { requests: [] }
      return self.resolve(state.requests)
    })
    .then(function (rows) {
      return Promise.all(
        [].concat(rows).filter(Boolean).map(function (src) {
          return RESOLVED.then(function () {
            return self.loader(src)
          })
        })
      )
    })
  }

  return state.loaded
}

/* loadJS: load a JS file asynchronously. [c]2014 @scottjehl, Filament Group, Inc.
 * (Based on http://goo.gl/REQGQ by Paul Irish). Licensed MIT */
function loadJS(src) {
  return new Promise(function (resolve, reject) {
    var node = document.createElement('script')
    node.setAttribute('src', src)
    node.async = true
    node.onload = node.onreadystatechange = function () {
      node.onerror = node.onload = node.onreadystatechange = null
      resolve()
    }
    node.onerror = function (err) {
      node.onerror = node.onload = node.onreadystatechange = null
      reject(err)
    }
    var ref = document.getElementsByTagName('script')[0]
    ref.parentNode.insertBefore(node, ref)
  })
}

function resolveJS(r) {
  return r
}

Loader.Loader = Loader

var loaders = Loader._loaders = {}
Loader.register = function (name, ctor) {
  loaders[name] = ctor
}
Loader.create = function (type, opts) {
  return new loaders[type](opts)
}
Loader.register('js', Loader)

var instances = Loader._instances = {}
Loader.load = function (requests, type) {
  type = type || 'js'
  if (!loaders[type]) {
    throw new Error('Loader for `' + type + '` not found.')
  }
  if (!instances[type]) {
    instances[type] = new loaders[type]()
  }
  return instances[type].load(requests)
}

module.exports = Loader


},{}]},{},[1])(1)
});