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

