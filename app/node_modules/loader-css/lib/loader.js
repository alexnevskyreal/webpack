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

