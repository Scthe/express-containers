// import Stream from 'stream';
// import util from 'util';
const Stream = require('stream');
const util = require('util');

var Response = (module.exports = function Response(res) {
  // console.log('Response()', res);
  this.offset = 0;
  this.readable = true;
  this._headers = {};
  this.data = '';
});

util.inherits(Response, Stream.Stream);

var capable = {
  streaming: true,
  status2: true,
};

function parseHeaders(res) {
  var lines = res.getAllResponseHeaders().split(/\r?\n/);
  var headers = {};
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line === '') continue;

    var m = line.match(/^([^:]+):\s*(.*)/);
    if (m) {
      var key = m[1].toLowerCase(),
        value = m[2];

      if (headers[key] !== undefined) {
        if (isArray(headers[key])) {
          headers[key].push(value);
        } else {
          headers[key] = [headers[key], value];
        }
      } else {
        headers[key] = value;
      }
    } else {
      headers[line] = true;
    }
  }
  return headers;
}

Response.prototype.getResponse = function (xhr) {
  var respType = String(xhr.responseType).toLowerCase();
  if (respType === 'blob') return xhr.responseBlob || xhr.response;
  if (respType === 'arraybuffer') return xhr.response;
  return xhr.responseText;
};

Response.prototype.setHeader = function (key, value) {
  this._headers[key.toLowerCase()] = value;
};

Response.prototype.getHeader = function (key) {
  return this._headers[key.toLowerCase()];
};

Response.prototype.removeHeader = function (key) {
  delete this._headers[key.toLowerCase()];
};

Response.prototype.handle = function (res) {
  if (res.readyState === 2 && capable.status2) {
    try {
      this.statusCode = res.status;
      this.headers = parseHeaders(res);
    } catch (err) {
      capable.status2 = false;
    }

    if (capable.status2) {
      this.emit('ready');
    }
  } else if (capable.streaming && res.readyState === 3) {
    try {
      if (!this.statusCode) {
        this.statusCode = res.status;
        this.headers = parseHeaders(res);
        this.emit('ready');
      }
    } catch (err) {}

    try {
      this._emitData(res);
    } catch (err) {
      capable.streaming = false;
    }
  } else if (res.readyState === 4) {
    if (!this.statusCode) {
      this.statusCode = res.status;
      this.emit('ready');
    }
    this._emitData(res);

    if (res.error) {
      this.emit('error', this.getResponse(res));
    } else this.emit('end');

    this.emit('close');
  }
};

Response.prototype._emitData = function (res) {
  var respBody = this.getResponse(res);
  if (respBody.toString().match(/ArrayBuffer/)) {
    this.emit('data', new Uint8Array(respBody, this.offset));
    this.offset = respBody.byteLength;
    return;
  }
  if (respBody.length > this.offset) {
    this.emit('data', respBody.slice(this.offset));
    this.offset = respBody.length;
  }
};

// https://nodejs.org/api/stream.html#writableendchunk-encoding-callback
Response.prototype.end = function (chunk, encoding, callback) {
  // console.log('Response.prototype.end', chunk);
  this.data += chunk;
};

var isArray =
  Array.isArray ||
  function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
  };
