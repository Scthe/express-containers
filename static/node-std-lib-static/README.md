# Sources

* buffer: https://github.com/feross/buffer
* events: https://github.com/browserify/events
* http <- http-browserify: https://github.com/browserify/http-browserify
* path <- path-browserify: https://www.npmjs.com/package/path-browserify
* url <- native-url: https://github.com/GoogleChromeLabs/native-url
* stream <- stream-browserify: https://github.com/browserify/stream-browserify/tree/master
* util: https://github.com/browserify/node-util
* zlib <- browserify-zlib: https://www.npmjs.com/package/browserify-zlib


https://github.com/browserify/browserify#usage
https://github.com/oven-sh/bun/blob/main/src/js/node/http.ts#L349

Add 
https://github.com/diachedelic/mock-res/blob/master/index.js ?

"dependencies": {
    "assert": "^2.1.0",
    "buffer": "^6.0.3",
    "crypto": "npm:crypto-browserify@^3.12.1",
    "events": "^3.3.0",
    "express": "^4.21.1",
    "http": "npm:http-browserify@^1.7.0",
    "path": "npm:path-browserify@^1.0.1",
    "querystring": "^0.2.1",
    "stream": "npm:stream-browserify@^3.0.0",
    "url": "npm:native-url@^0.3.4",
    "util": "^0.12.5",
    "zlib": "npm:browserify-zlib@^0.2.0"
  },