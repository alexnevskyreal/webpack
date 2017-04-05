# loader-css
异步加载CSS。
基于[`loader-core`]。

## 浏览器使用方法
将dist目录下的[loader.js](dist/loader.js)或[loader.min.js](dist/loader.min.js)嵌入页面后，
可以页面中使用`window.Loader`

```js
Loader.load('https://s0.meituan.net/bs/cssm/?f=fewww:/www/css/common.css,/www/css/base.css').then(function () {
  // styles are ready now
})

```

## 自定义
`loader-css`只定义了[`loader-core`]的`loader`，
所以默认情况下，多次

将多个CSS合并下载：

```js
function bsResolver(requests) {
  var prefix = 'https://s0.meituan.net/bs/css/?f=fewww:'
  var sources = {
    common: '/www/css/common.css',
    base: '/www/css/base.css',
  }
  return prefix + [].concat(requests).map(function (request) {
    return sources[request]
  }).join(',')
}

var loader = Loader.create('css', { resolve: bsResolver })

loader.load('common').then(function () {
  // common and base are both ready now
})
loader.load('base').then(function () {
  // common and base are both ready now
})

```

## TODO

* `Promise`的polyfill

[`loader-core`]: https://github.com/loaderjs/loader-core

