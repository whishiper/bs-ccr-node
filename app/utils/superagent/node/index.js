'use strict';

function _typeof(obj) {
  if (typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol') {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj &&
        typeof Symbol === 'function' &&
        obj.constructor === Symbol &&
        obj !== Symbol.prototype
        ? 'symbol'
        : typeof obj;
    };
  }
  return _typeof(obj);
}

/**
 * Module dependencies.
 */
// eslint-disable-next-line node/no-deprecated-api
const _require = require('url'),
  parse = _require.parse,
  format = _require.format,
  resolve = _require.resolve;

const Stream = require('stream');

const https = require('https');

const http = require('http');

const fs = require('fs');

const zlib = require('zlib');

const util = require('util');

const qs = require('qs');

const mime = require('mime');

let methods = require('methods');

const FormData = require('form-data');

const formidable = require('formidable');

const debug = require('debug')('superagent');

const CookieJar = require('cookiejar');

const semver = require('semver');

const safeStringify = require('fast-safe-stringify');

const utils = require('../utils');

const RequestBase = require('../request-base');

const _require2 = require('./unzip'),
  unzip = _require2.unzip;

const Response = require('./response');

let http2;
if (semver.gte(process.version, 'v10.10.0')) http2 = require('./http2wrapper');

function request(method, url) {
  // callback
  if (typeof url === 'function') {
    return new exports.Request('GET', method).end(url);
  } // url first

  if (arguments.length === 1) {
    return new exports.Request('GET', method);
  }

  return new exports.Request(method, url);
}

module.exports = request;
exports = module.exports;
/**
 * Expose `Request`.
 */

exports.Request = Request;
/**
 * Expose the agent function
 */

exports.agent = require('./agent');
/**
 * Noop.
 */

function noop() {}
/**
 * Expose `Response`.
 */

exports.Response = Response;
/**
 * Define "form" mime type.
 */

mime.define(
  {
    'application/x-www-form-urlencoded': [ 'form', 'urlencoded', 'form-data' ],
  },
  true
);
/**
 * Protocol map.
 */

exports.protocols = {
  'http:': http,
  'https:': https,
  'http2:': http2,
};
/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

exports.serialize = {
  'application/x-www-form-urlencoded': qs.stringify,
  'application/json': safeStringify,
};
/**
 * Default parsers.
 *
 *     superagent.parse['application/xml'] = function(res, fn){
 *       fn(null, res);
 *     };
 *
 */

exports.parse = require('./parsers');
/**
 * Default buffering map. Can be used to set certain
 * response types to buffer/not buffer.
 *
 *     superagent.buffer['application/xml'] = true;
 */

exports.buffer = {};
/**
 * Initialize internal header tracking properties on a request instance.
 *
 * @param {Object} req the instance
 * @api private
 */

function _initHeaders(req) {
  req._header = {
    // coerces header names to lowercase
  };
  req.header = {
    // preserves header name case
  };
}
/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String|Object} url
 * @api public
 */

function Request(method, url) {
  Stream.call(this);
  if (typeof url !== 'string') url = format(url);
  this._enableHttp2 = Boolean(process.env.HTTP2_TEST); // internal only

  this._agent = false;
  this._formData = null;
  this.method = method;
  this.url = url;

  _initHeaders(this);

  this.writable = true;
  this._redirects = 0;
  this.redirects(method === 'HEAD' ? 0 : 5);
  this.cookies = '';
  this.qs = {};
  this._query = [];
  this.qsRaw = this._query; // Unused, for backwards compatibility only

  this._redirectList = [];
  this._streamRequest = false;
  this.once('end', this.clearTimeout.bind(this));
}
/**
 * Inherit from `Stream` (which inherits from `EventEmitter`).
 * Mixin `RequestBase`.
 */

util.inherits(Request, Stream); // eslint-disable-next-line new-cap

RequestBase(Request.prototype);
/**
 * Enable or Disable http2.
 *
 * Enable http2.
 *
 * ``` js
 * request.get('http://localhost/')
 *   .http2()
 *   .end(callback);
 *
 * request.get('http://localhost/')
 *   .http2(true)
 *   .end(callback);
 * ```
 *
 * Disable http2.
 *
 * ``` js
 * request = request.http2();
 * request.get('http://localhost/')
 *   .http2(false)
 *   .end(callback);
 * ```
 *
 * @param {Boolean} enable
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.http2 = function(bool) {
  if (exports.protocols['http2:'] === undefined) {
    throw new Error(
      'superagent: this version of Node.js does not support http2'
    );
  }

  this._enableHttp2 = bool === undefined ? true : bool;
  return this;
};
/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `options` (or filename).
 *
 * ``` js
 * request.post('http://localhost/upload')
 *   .attach('field', Buffer.from('<b>Hello world</b>'), 'hello.html')
 *   .end(callback);
 * ```
 *
 * A filename may also be used:
 *
 * ``` js
 * request.post('http://localhost/upload')
 *   .attach('files', 'image.jpg')
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {String|fs.ReadStream|Buffer} file
 * @param {String|Object} options
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.attach = function(field, file, options) {
  if (file) {
    if (this._data) {
      throw new Error("superagent can't mix .send() and .attach()");
    }

    let o = options || {};

    if (typeof options === 'string') {
      o = {
        filename: options,
      };
    }

    if (typeof file === 'string') {
      if (!o.filename) o.filename = file;
      debug('creating `fs.ReadStream` instance for file: %s', file);
      file = fs.createReadStream(file);
    } else if (!o.filename && file.path) {
      o.filename = file.path;
    }

    this._getFormData().append(field, file, o);
  }

  return this;
};

Request.prototype._getFormData = function() {
  const _this = this;

  if (!this._formData) {
    this._formData = new FormData();

    this._formData.on('error', function(err) {
      debug('FormData error', err);

      if (_this.called) {
        // The request has already finished and the callback was called.
        // Silently ignore the error.
        return;
      }

      _this.callback(err);

      _this.abort();
    });
  }

  return this._formData;
};
/**
 * Gets/sets the `Agent` to use for this HTTP request. The default (if this
 * function is not called) is to opt out of connection pooling (`agent: false`).
 *
 * @param {http.Agent} agent
 * @return {http.Agent}
 * @api public
 */

Request.prototype.agent = function(agent) {
  if (arguments.length === 0) return this._agent;
  this._agent = agent;
  return this;
};
/**
 * Set _Content-Type_ response header passed through `mime.getType()`.
 *
 * Examples:
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('json')
 *        .send(jsonstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/json')
 *        .send(jsonstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type) {
  return this.set(
    'Content-Type',
    type.includes('/') ? type : mime.getType(type)
  );
};
/**
 * Set _Accept_ response header passed through `mime.getType()`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function(type) {
  return this.set('Accept', type.includes('/') ? type : mime.getType(type));
};
/**
 * Add query-string `val`.
 *
 * Examples:
 *
 *   request.get('/shoes')
 *     .query('size=10')
 *     .query({ color: 'blue' })
 *
 * @param {Object|String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.query = function(val) {
  if (typeof val === 'string') {
    this._query.push(val);
  } else {
    Object.assign(this.qs, val);
  }

  return this;
};
/**
 * Write raw `data` / `encoding` to the socket.
 *
 * @param {Buffer|String} data
 * @param {String} encoding
 * @return {Boolean}
 * @api public
 */

Request.prototype.write = function(data, encoding) {
  const req = this.request();

  if (!this._streamRequest) {
    this._streamRequest = true;
  }

  return req.write(data, encoding);
};
/**
 * Pipe the request body to `stream`.
 *
 * @param {Stream} stream
 * @param {Object} options
 * @return {Stream}
 * @api public
 */

Request.prototype.pipe = function(stream, options) {
  this.piped = true; // HACK...

  this.buffer(false);
  this.end();
  return this._pipeContinue(stream, options);
};

Request.prototype._pipeContinue = function(stream, options) {
  const _this2 = this;

  this.req.once('response', function(res) {
    // redirect
    if (
      isRedirect(res.statusCode) &&
      _this2._redirects++ !== _this2._maxRedirects
    ) {
      return _this2._redirect(res) === _this2
        ? _this2._pipeContinue(stream, options)
        : undefined;
    }

    _this2.res = res;

    _this2._emitResponse();

    if (_this2._aborted) return;

    if (_this2._shouldUnzip(res)) {
      const unzipObj = zlib.createUnzip();
      unzipObj.on('error', function(err) {
        if (err && err.code === 'Z_BUF_ERROR') {
          // unexpected end of file is ignored by browsers and curl
          stream.emit('end');
          return;
        }

        stream.emit('error', err);
      });
      res.pipe(unzipObj).pipe(stream, options);
    } else {
      res.pipe(stream, options);
    }

    res.once('end', function() {
      _this2.emit('end');
    });
  });
  return stream;
};
/**
 * Enable / disable buffering.
 *
 * @return {Boolean} [val]
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.buffer = function(val) {
  this._buffer = val !== false;
  return this;
};
/**
 * Redirect to `url
 *
 * @param {IncomingMessage} res
 * @return {Request} for chaining
 * @api private
 */

Request.prototype._redirect = function(res) {
  let url = res.headers.location;

  if (!url) {
    return this.callback(new Error('No location header for redirect'), res);
  }

  debug('redirect %s -> %s', this.url, url); // location

  url = resolve(this.url, url); // ensure the response is being consumed
  // this is required for Node v0.10+

  res.resume();
  let headers = this.req.getHeaders ? this.req.getHeaders() : this.req._headers;
  const changesOrigin = parse(url).host !== parse(this.url).host; // implementation of 302 following defacto standard

  if (res.statusCode === 301 || res.statusCode === 302) {
    // strip Content-* related fields
    // in case of POST etc
    headers = utils.cleanHeader(headers, changesOrigin); // force GET

    this.method = this.method === 'HEAD' ? 'HEAD' : 'GET'; // clear data

    this._data = null;
  } // 303 is always GET

  if (res.statusCode === 303) {
    // strip Content-* related fields
    // in case of POST etc
    headers = utils.cleanHeader(headers, changesOrigin); // force method

    this.method = 'GET'; // clear data

    this._data = null;
  } // 307 preserves method
  // 308 preserves method

  delete headers.host;
  delete this.req;
  delete this._formData; // remove all add header except User-Agent

  _initHeaders(this); // redirect

  this._endCalled = false;
  this.url = url;
  this.qs = {};
  this._query.length = 0;
  this.set(headers);
  this.emit('redirect', res);

  this._redirectList.push(this.url);

  this.end(this._callback);
  return this;
};
/**
 * Set Authorization field value with `user` and `pass`.
 *
 * Examples:
 *
 *   .auth('tobi', 'learnboost')
 *   .auth('tobi:learnboost')
 *   .auth('tobi')
 *   .auth(accessToken, { type: 'bearer' })
 *
 * @param {String} user
 * @param {String} [pass]
 * @param {Object} [options] options with authorization type 'basic' or 'bearer' ('basic' is default)
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass, options) {
  if (arguments.length === 1) pass = '';

  if (_typeof(pass) === 'object' && pass !== null) {
    // pass is optional and can be replaced with options
    options = pass;
    pass = '';
  }

  if (!options) {
    options = {
      type: 'basic',
    };
  }

  const encoder = function encoder(string) {
    return Buffer.from(string).toString('base64');
  };

  return this._auth(user, pass, options, encoder);
};
/**
 * Set the certificate authority option for https request.
 *
 * @param {Buffer | Array} cert
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.ca = function(cert) {
  this._ca = cert;
  return this;
};
/**
 * Set the client certificate key option for https request.
 *
 * @param {Buffer | String} cert
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.key = function(cert) {
  this._key = cert;
  return this;
};
/**
 * Set the key, certificate, and CA certs of the client in PFX or PKCS12 format.
 *
 * @param {Buffer | String} cert
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.pfx = function(cert) {
  if (_typeof(cert) === 'object' && !Buffer.isBuffer(cert)) {
    this._pfx = cert.pfx;
    this._passphrase = cert.passphrase;
  } else {
    this._pfx = cert;
  }

  return this;
};
/**
 * Set the client certificate option for https request.
 *
 * @param {Buffer | String} cert
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.cert = function(cert) {
  this._cert = cert;
  return this;
};
/**
 * Do not reject expired or invalid TLS certs.
 * sets `rejectUnauthorized=true`. Be warned that this allows MITM attacks.
 *
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.disableTLSCerts = function() {
  this._disableTLSCerts = true;
  return this;
};
/**
 * Return an http[s] request.
 *
 * @return {OutgoingMessage}
 * @api private
 */
// eslint-disable-next-line complexity

Request.prototype.request = function() {
  const _this3 = this;

  if (this.req) return this.req;
  const options = {};

  try {
    const query = qs.stringify(this.qs, {
      indices: false,
      strictNullHandling: true,
    });

    if (query) {
      this.qs = {};

      this._query.push(query);
    }

    this._finalizeQueryString();
  } catch (err) {
    return this.emit('error', err);
  }

  let url = this.url;
  const retries = this._retries; // Capture backticks as-is from the final query string built above.
  // Note: this'll only find backticks entered in req.query(String)
  // calls, because qs.stringify unconditionally encodes backticks.

  let queryStringBackticks;

  if (url.includes('`')) {
    const queryStartIndex = url.indexOf('?');

    if (queryStartIndex !== -1) {
      const queryString = url.slice(queryStartIndex + 1);
      queryStringBackticks = queryString.match(/`|%60/g);
    }
  } // default to http://

  if (url.indexOf('http') !== 0) url = 'http://'.concat(url);
  url = parse(url); // See https://github.com/visionmedia/superagent/issues/1367

  if (queryStringBackticks) {
    let i = 0;
    url.query = url.query.replace(/%60/g, function() {
      return queryStringBackticks[i++];
    });
    url.search = '?'.concat(url.query);
    url.path = url.pathname + url.search;
  } // support unix sockets

  if (/^https?\+unix:/.test(url.protocol) === true) {
    // get the protocol
    url.protocol = ''.concat(url.protocol.split('+')[0], ':'); // get the socket, path

    const unixParts = url.path.match(/^([^/]+)(.+)$/);
    options.socketPath = unixParts[1].replace(/%2F/g, '/');
    url.path = unixParts[2];
  } // Override IP address of a hostname

  if (this._connectOverride) {
    const _url = url,
      hostname = _url.hostname;
    const match =
      hostname in this._connectOverride
        ? this._connectOverride[hostname]
        : this._connectOverride['*'];

    if (match) {
      // backup the real host
      if (!this._header.host) {
        this.set('host', url.host);
      } // wrap [ipv6]

      url.host = /:/.test(match) ? '['.concat(match, ']') : match;

      if (url.port) {
        url.host += ':'.concat(url.port);
      }

      url.hostname = match;
    }
  } // options

  options.method = this.method;
  options.port = url.port;
  options.path = url.path;
  options.host = url.hostname;
  options.ca = this._ca;
  options.key = this._key;
  options.pfx = this._pfx;
  options.cert = this._cert;
  options.passphrase = this._passphrase;
  options.agent = this._agent;
  options.rejectUnauthorized =
    typeof this._disableTLSCerts === 'boolean'
      ? !this._disableTLSCerts
      : process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0'; // Allows request.get('https://1.2.3.4/').set('Host', 'example.com')

  if (this._header.host) {
    options.servername = this._header.host.replace(/:\d+$/, '');
  }

  if (
    this._trustLocalhost &&
    /^(?:localhost|127\.0\.0\.\d+|(0*:)+:0*1)$/.test(url.hostname)
  ) {
    options.rejectUnauthorized = false;
  } // initiate request

  const mod = this._enableHttp2
    ? exports.protocols['http2:'].setProtocol(url.protocol)
    : exports.protocols[url.protocol]; // request

  this.req = mod.request(options);
  const req = this.req; // set tcp no delay

  req.setNoDelay(true);

  if (options.method !== 'HEAD') {
    req.setHeader('Accept-Encoding', 'gzip, deflate');
  }

  this.protocol = url.protocol;
  this.host = url.host; // expose events

  req.once('drain', function() {
    _this3.emit('drain');
  });
  req.on('error', function(err) {
    // flag abortion here for out timeouts
    // because node will emit a faux-error "socket hang up"
    // when request is aborted before a connection is made
    if (_this3._aborted) return; // if not the same, we are in the **old** (cancelled) request,
    // so need to continue (same as for above)

    if (_this3._retries !== retries) return; // if we've received a response then we don't want to let
    // an error in the request blow up the response

    if (_this3.response) return;

    _this3.callback(err);
  }); // auth

  if (url.auth) {
    const auth = url.auth.split(':');
    this.auth(auth[0], auth[1]);
  }

  if (this.username && this.password) {
    this.auth(this.username, this.password);
  }

  for (const key in this.header) {
    if (Object.prototype.hasOwnProperty.call(this.header, key)) {
      req.setHeader(key, this.header[key]);
    }
  } // add cookies

  if (this.cookies) {
    if (Object.prototype.hasOwnProperty.call(this._header, 'cookie')) {
      // merge
      const tmpJar = new CookieJar.CookieJar();
      tmpJar.setCookies(this._header.cookie.split(';'));
      tmpJar.setCookies(this.cookies.split(';'));
      req.setHeader(
        'Cookie',
        tmpJar.getCookies(CookieJar.CookieAccessInfo.All).toValueString()
      );
    } else {
      req.setHeader('Cookie', this.cookies);
    }
  }

  return req;
};
/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res) {
  if (this._shouldRetry(err, res)) {
    return this._retry();
  } // Avoid the error which is emitted from 'socket hang up' to cause the fn undefined error on JS runtime.

  const fn = this._callback || noop;
  this.clearTimeout();
  if (this.called) throw new Error('superagent: double callback bug');
  this.called = true;

  if (!err) {
    try {
      if (!this._isResponseOK(res)) {
        let msg = 'Unsuccessful HTTP response';

        if (res) {
          msg = http.STATUS_CODES[res.status] || msg;
        }

        err = new Error(msg);
        err.status = res ? res.status : undefined;
      }
    } catch (err_) {
      err = err_;
    }
  } // It's important that the callback is called outside try/catch
  // to avoid double callback

  if (!err) {
    return fn(null, res);
  }

  err.response = res;
  if (this._maxRetries) err.retries = this._retries - 1; // only emit error event if there is a listener
  // otherwise we assume the callback to `.end()` will get the error

  if (err && this.listeners('error').length > 0) {
    this.emit('error', err);
  }

  fn(err, res);
};
/**
 * Check if `obj` is a host object,
 *
 * @param {Object} obj host object
 * @return {Boolean} is a host object
 * @api private
 */

Request.prototype._isHost = function(obj) {
  return (
    Buffer.isBuffer(obj) || obj instanceof Stream || obj instanceof FormData
  );
};
/**
 * Initiate request, invoking callback `fn(err, res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype._emitResponse = function(body, files) {
  const response = new Response(this);
  this.response = response;
  response.redirects = this._redirectList;

  if (undefined !== body) {
    response.body = body;
  }

  response.files = files;

  if (this._endCalled) {
    response.pipe = function() {
      throw new Error(
        "end() has already been called, so it's too late to start piping"
      );
    };
  }

  this.emit('response', response);
  return response;
};

Request.prototype.end = function(fn) {
  this.request();
  debug('%s %s', this.method, this.url);

  if (this._endCalled) {
    throw new Error(
      '.end() was called twice. This is not supported in superagent'
    );
  }

  this._endCalled = true; // store callback

  this._callback = fn || noop;

  this._end();
};

Request.prototype._end = function() {
  const _this4 = this;

  if (this._aborted) {
    return this.callback(
      new Error('The request has been aborted even before .end() was called')
    );
  }
  let data = this._data;
  const req = this.req;
  const method = this.method;

  this._setTimeouts(); // body

  if (method !== 'HEAD' && !req._headerSent) {
    // serialize stuff
    if (typeof data !== 'string') {
      let contentType = req.getHeader('Content-Type'); // Parse out just the content type from the header (ignore the charset)

      if (contentType) contentType = contentType.split(';')[0];
      let serialize = this._serializer || exports.serialize[contentType];

      if (!serialize && isJSON(contentType)) {
        serialize = exports.serialize['application/json'];
      }

      if (serialize) data = serialize(data);
    } // content-length

    if (data && !req.getHeader('Content-Length')) {
      req.setHeader(
        'Content-Length',
        Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data)
      );
    }
  } // response
  // eslint-disable-next-line complexity

  req.once('response', function(res) {
    debug('%s %s -> %s', _this4.method, _this4.url, res.statusCode);

    if (_this4._responseTimeoutTimer) {
      clearTimeout(_this4._responseTimeoutTimer);
    }

    if (_this4.piped) {
      return;
    }

    const max = _this4._maxRedirects;
    const mime = utils.type(res.headers['content-type'] || '') || 'text/plain';
    const type = mime.split('/')[0];
    const multipart = type === 'multipart';
    const redirect = isRedirect(res.statusCode);
    const responseType = _this4._responseType;
    _this4.res = res; // redirect

    if (redirect && _this4._redirects++ !== max) {
      return _this4._redirect(res);
    }

    if (_this4.method === 'HEAD') {
      _this4.emit('end');

      _this4.callback(null, _this4._emitResponse());

      return;
    } // zlib support

    if (_this4._shouldUnzip(res)) {
      unzip(req, res);
    }

    let buffer = _this4._buffer;

    if (buffer === undefined && mime in exports.buffer) {
      buffer = Boolean(exports.buffer[mime]);
    }

    let parser = _this4._parser;

    if (undefined === buffer) {
      if (parser) {
        console.warn(
          "A custom superagent parser has been set, but buffering strategy for the parser hasn't been configured. Call `req.buffer(true or false)` or set `superagent.buffer[mime] = true or false`"
        );
        buffer = true;
      }
    }

    if (!parser) {
      if (responseType) {
        parser = exports.parse.image; // It's actually a generic Buffer

        buffer = true;
      } else if (multipart) {
        const form = new formidable.IncomingForm();
        parser = form.parse.bind(form);
        buffer = true;
      } else if (isImageOrVideo(mime)) {
        parser = exports.parse.image;
        buffer = true; // For backwards-compatibility buffering default is ad-hoc MIME-dependent
      } else if (exports.parse[mime]) {
        parser = exports.parse[mime];
      } else if (type === 'text') {
        parser = exports.parse.text;
        buffer = buffer !== false; // everyone wants their own white-labeled json
      } else if (isJSON(mime)) {
        parser = exports.parse['application/json'];
        buffer = buffer !== false;
      } else if (buffer) {
        parser = exports.parse.text;
      } else if (undefined === buffer) {
        parser = exports.parse.image; // It's actually a generic Buffer

        buffer = true;
      }
    } // by default only buffer text/*, json and messed up thing from hell

    if ((undefined === buffer && isText(mime)) || isJSON(mime)) {
      buffer = true;
    }

    _this4._resBuffered = buffer;
    let parserHandlesEnd = false;

    if (buffer) {
      // Protectiona against zip bombs and other nuisance
      let responseBytesLeft = _this4._maxResponseSize || 200000000;
      res.on('data', function(buf) {
        responseBytesLeft -= buf.byteLength || buf.length;

        if (responseBytesLeft < 0) {
          // This will propagate through error event
          const err = new Error('Maximum response size reached');
          err.code = 'ETOOLARGE'; // Parsers aren't required to observe error event,
          // so would incorrectly report success

          parserHandlesEnd = false; // Will emit error event

          res.destroy(err);
        }
      });
    }

    if (parser) {
      try {
        // Unbuffered parsers are supposed to emit response early,
        // which is weird BTW, because response.body won't be there.
        parserHandlesEnd = buffer;
        parser(res, function(err, obj, files) {
          if (_this4.timedout) {
            // Timeout has already handled all callbacks
            return;
          } // Intentional (non-timeout) abort is supposed to preserve partial response,
          // even if it doesn't parse.

          if (err && !_this4._aborted) {
            return _this4.callback(err);
          }

          if (parserHandlesEnd) {
            _this4.emit('end');

            _this4.callback(null, _this4._emitResponse(obj, files));
          }
        });
      } catch (err) {
        _this4.callback(err);

        return;
      }
    }

    _this4.res = res; // unbuffered

    if (!buffer) {
      debug('unbuffered %s %s', _this4.method, _this4.url);

      _this4.callback(null, _this4._emitResponse());

      if (multipart) return; // allow multipart to handle end event

      res.once('end', function() {
        debug('end %s %s', _this4.method, _this4.url);

        _this4.emit('end');
      });
      return;
    } // terminating events

    res.once('error', function(err) {
      parserHandlesEnd = false;

      _this4.callback(err, null);
    });
    if (!parserHandlesEnd) {
      res.once('end', function() {
        debug('end %s %s', _this4.method, _this4.url); // TODO: unless buffering emit earlier to stream

        _this4.emit('end');

        _this4.callback(null, _this4._emitResponse());
      });
    }
  });
  this.emit('request', this);

  const getProgressMonitor = function getProgressMonitor() {
    const lengthComputable = true;
    const total = req.getHeader('Content-Length');
    let loaded = 0;
    const progress = new Stream.Transform();

    progress._transform = function(chunk, encoding, cb) {
      loaded += chunk.length;

      _this4.emit('progress', {
        direction: 'upload',
        lengthComputable,
        loaded,
        total,
      });

      cb(null, chunk);
    };

    return progress;
  };

  const bufferToChunks = function bufferToChunks(buffer) {
    const chunkSize = 16 * 1024; // default highWaterMark value

    const chunking = new Stream.Readable();
    const totalLength = buffer.length;
    const remainder = totalLength % chunkSize;
    const cutoff = totalLength - remainder;

    for (let i = 0; i < cutoff; i += chunkSize) {
      const chunk = buffer.slice(i, i + chunkSize);
      chunking.push(chunk);
    }

    if (remainder > 0) {
      const remainderBuffer = buffer.slice(-remainder);
      chunking.push(remainderBuffer);
    }

    chunking.push(null); // no more data

    return chunking;
  }; // if a FormData instance got created, then we send that as the request body

  const formData = this._formData;

  if (formData) {
    // set headers
    const headers = formData.getHeaders();

    for (const i in headers) {
      if (Object.prototype.hasOwnProperty.call(headers, i)) {
        debug('setting FormData header: "%s: %s"', i, headers[i]);
        req.setHeader(i, headers[i]);
      }
    } // attempt to get "Content-Length" header
    // eslint-disable-next-line handle-callback-err

    formData.getLength(function(err, length) {
      // TODO: Add chunked encoding when no length (if err)
      debug('got FormData Content-Length: %s', length);

      if (typeof length === 'number') {
        req.setHeader('Content-Length', length);
      }

      formData.pipe(getProgressMonitor()).pipe(req);
    });
  } else if (Buffer.isBuffer(data)) {
    bufferToChunks(data)
      .pipe(getProgressMonitor())
      .pipe(req);
  } else {
    req.end(data);
  }
}; // Check whether response has a non-0-sized gzip-encoded body

Request.prototype._shouldUnzip = function(res) {
  if (res.statusCode === 204 || res.statusCode === 304) {
    // These aren't supposed to have any body
    return false;
  } // header content is a string, and distinction between 0 and no information is crucial

  if (res.headers['content-length'] === '0') {
    // We know that the body is empty (unfortunately, this check does not cover chunked encoding)
    return false;
  } // console.log(res);

  return /^\s*(?:deflate|gzip)\s*$/.test(res.headers['content-encoding']);
};
/**
 * Overrides DNS for selected hostnames. Takes object mapping hostnames to IP addresses.
 *
 * When making a request to a URL with a hostname exactly matching a key in the object,
 * use the given IP address to connect, instead of using DNS to resolve the hostname.
 *
 * A special host `*` matches every hostname (keep redirects in mind!)
 *
 *      request.connect({
 *        'test.example.com': '127.0.0.1',
 *        'ipv6.example.com': '::1',
 *      })
 */

Request.prototype.connect = function(connectOverride) {
  if (typeof connectOverride === 'string') {
    this._connectOverride = {
      '*': connectOverride,
    };
  } else if (_typeof(connectOverride) === 'object') {
    this._connectOverride = connectOverride;
  } else {
    this._connectOverride = undefined;
  }

  return this;
};

Request.prototype.trustLocalhost = function(toggle) {
  this._trustLocalhost = toggle === undefined ? true : toggle;
  return this;
}; // generate HTTP verb methods

if (!methods.includes('del')) {
  // create a copy so we don't cause conflicts with
  // other packages using the methods package and
  // npm 3.x
  methods = methods.slice(0);
  methods.push('del');
}

methods.forEach(function(method) {
  const name = method;
  method = method === 'del' ? 'delete' : method;
  method = method.toUpperCase();

  request[name] = function(url, data, fn) {
    const req = request(method, url);

    if (typeof data === 'function') {
      fn = data;
      data = null;
    }

    if (data) {
      if (method === 'GET' || method === 'HEAD') {
        req.query(data);
      } else {
        req.send(data);
      }
    }

    if (fn) req.end(fn);
    return req;
  };
});
/**
 * Check if `mime` is text and should be buffered.
 *
 * @param {String} mime
 * @return {Boolean}
 * @api public
 */

function isText(mime) {
  const parts = mime.split('/');
  const type = parts[0];
  const subtype = parts[1];
  return type === 'text' || subtype === 'x-www-form-urlencoded';
}

function isImageOrVideo(mime) {
  const type = mime.split('/')[0];
  return type === 'image' || type === 'video';
}
/**
 * Check if `mime` is json or has +json structured syntax suffix.
 *
 * @param {String} mime
 * @return {Boolean}
 * @api private
 */

function isJSON(mime) {
  // should match /json or +json
  // but not /json-seq
  return /[/+]json($|[^-\w])/.test(mime);
}
/**
 * Check if we should follow the redirect `code`.
 *
 * @param {Number} code
 * @return {Boolean}
 * @api private
 */

function isRedirect(code) {
  return [ 301, 302, 303, 305, 307, 308 ].includes(code);
}
// # sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ub2RlL2luZGV4LmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJwYXJzZSIsImZvcm1hdCIsInJlc29sdmUiLCJTdHJlYW0iLCJodHRwcyIsImh0dHAiLCJmcyIsInpsaWIiLCJ1dGlsIiwicXMiLCJtaW1lIiwibWV0aG9kcyIsIkZvcm1EYXRhIiwiZm9ybWlkYWJsZSIsImRlYnVnIiwiQ29va2llSmFyIiwic2VtdmVyIiwic2FmZVN0cmluZ2lmeSIsInV0aWxzIiwiUmVxdWVzdEJhc2UiLCJ1bnppcCIsIlJlc3BvbnNlIiwiaHR0cDIiLCJndGUiLCJwcm9jZXNzIiwidmVyc2lvbiIsInJlcXVlc3QiLCJtZXRob2QiLCJ1cmwiLCJleHBvcnRzIiwiUmVxdWVzdCIsImVuZCIsImFyZ3VtZW50cyIsImxlbmd0aCIsIm1vZHVsZSIsImFnZW50Iiwibm9vcCIsImRlZmluZSIsInByb3RvY29scyIsInNlcmlhbGl6ZSIsInN0cmluZ2lmeSIsImJ1ZmZlciIsIl9pbml0SGVhZGVycyIsInJlcSIsIl9oZWFkZXIiLCJoZWFkZXIiLCJjYWxsIiwiX2VuYWJsZUh0dHAyIiwiQm9vbGVhbiIsImVudiIsIkhUVFAyX1RFU1QiLCJfYWdlbnQiLCJfZm9ybURhdGEiLCJ3cml0YWJsZSIsIl9yZWRpcmVjdHMiLCJyZWRpcmVjdHMiLCJjb29raWVzIiwiX3F1ZXJ5IiwicXNSYXciLCJfcmVkaXJlY3RMaXN0IiwiX3N0cmVhbVJlcXVlc3QiLCJvbmNlIiwiY2xlYXJUaW1lb3V0IiwiYmluZCIsImluaGVyaXRzIiwicHJvdG90eXBlIiwiYm9vbCIsInVuZGVmaW5lZCIsIkVycm9yIiwiYXR0YWNoIiwiZmllbGQiLCJmaWxlIiwib3B0aW9ucyIsIl9kYXRhIiwibyIsImZpbGVuYW1lIiwiY3JlYXRlUmVhZFN0cmVhbSIsInBhdGgiLCJfZ2V0Rm9ybURhdGEiLCJhcHBlbmQiLCJvbiIsImVyciIsImNhbGxlZCIsImNhbGxiYWNrIiwiYWJvcnQiLCJ0eXBlIiwic2V0IiwiaW5jbHVkZXMiLCJnZXRUeXBlIiwiYWNjZXB0IiwicXVlcnkiLCJ2YWwiLCJwdXNoIiwiT2JqZWN0IiwiYXNzaWduIiwid3JpdGUiLCJkYXRhIiwiZW5jb2RpbmciLCJwaXBlIiwic3RyZWFtIiwicGlwZWQiLCJfcGlwZUNvbnRpbnVlIiwicmVzIiwiaXNSZWRpcmVjdCIsInN0YXR1c0NvZGUiLCJfbWF4UmVkaXJlY3RzIiwiX3JlZGlyZWN0IiwiX2VtaXRSZXNwb25zZSIsIl9hYm9ydGVkIiwiX3Nob3VsZFVuemlwIiwidW56aXBPYmoiLCJjcmVhdGVVbnppcCIsImNvZGUiLCJlbWl0IiwiX2J1ZmZlciIsImhlYWRlcnMiLCJsb2NhdGlvbiIsInJlc3VtZSIsImdldEhlYWRlcnMiLCJfaGVhZGVycyIsImNoYW5nZXNPcmlnaW4iLCJob3N0IiwiY2xlYW5IZWFkZXIiLCJfZW5kQ2FsbGVkIiwiX2NhbGxiYWNrIiwiYXV0aCIsInVzZXIiLCJwYXNzIiwiZW5jb2RlciIsInN0cmluZyIsIkJ1ZmZlciIsImZyb20iLCJ0b1N0cmluZyIsIl9hdXRoIiwiY2EiLCJjZXJ0IiwiX2NhIiwia2V5IiwiX2tleSIsInBmeCIsImlzQnVmZmVyIiwiX3BmeCIsIl9wYXNzcGhyYXNlIiwicGFzc3BocmFzZSIsIl9jZXJ0IiwiZGlzYWJsZVRMU0NlcnRzIiwiX2Rpc2FibGVUTFNDZXJ0cyIsImluZGljZXMiLCJzdHJpY3ROdWxsSGFuZGxpbmciLCJfZmluYWxpemVRdWVyeVN0cmluZyIsInJldHJpZXMiLCJfcmV0cmllcyIsInF1ZXJ5U3RyaW5nQmFja3RpY2tzIiwicXVlcnlTdGFydEluZGV4IiwiaW5kZXhPZiIsInF1ZXJ5U3RyaW5nIiwic2xpY2UiLCJtYXRjaCIsImkiLCJyZXBsYWNlIiwic2VhcmNoIiwicGF0aG5hbWUiLCJ0ZXN0IiwicHJvdG9jb2wiLCJzcGxpdCIsInVuaXhQYXJ0cyIsInNvY2tldFBhdGgiLCJfY29ubmVjdE92ZXJyaWRlIiwiaG9zdG5hbWUiLCJwb3J0IiwicmVqZWN0VW5hdXRob3JpemVkIiwiTk9ERV9UTFNfUkVKRUNUX1VOQVVUSE9SSVpFRCIsInNlcnZlcm5hbWUiLCJfdHJ1c3RMb2NhbGhvc3QiLCJtb2QiLCJzZXRQcm90b2NvbCIsInNldE5vRGVsYXkiLCJzZXRIZWFkZXIiLCJyZXNwb25zZSIsInVzZXJuYW1lIiwicGFzc3dvcmQiLCJoYXNPd25Qcm9wZXJ0eSIsInRtcEphciIsInNldENvb2tpZXMiLCJjb29raWUiLCJnZXRDb29raWVzIiwiQ29va2llQWNjZXNzSW5mbyIsIkFsbCIsInRvVmFsdWVTdHJpbmciLCJfc2hvdWxkUmV0cnkiLCJfcmV0cnkiLCJmbiIsImNvbnNvbGUiLCJ3YXJuIiwiX2lzUmVzcG9uc2VPSyIsIm1zZyIsIlNUQVRVU19DT0RFUyIsInN0YXR1cyIsImVycl8iLCJfbWF4UmV0cmllcyIsImxpc3RlbmVycyIsIl9pc0hvc3QiLCJvYmoiLCJib2R5IiwiZmlsZXMiLCJfZW5kIiwiX3NldFRpbWVvdXRzIiwiX2hlYWRlclNlbnQiLCJjb250ZW50VHlwZSIsImdldEhlYWRlciIsIl9zZXJpYWxpemVyIiwiaXNKU09OIiwiYnl0ZUxlbmd0aCIsIl9yZXNwb25zZVRpbWVvdXRUaW1lciIsIm1heCIsIm11bHRpcGFydCIsInJlZGlyZWN0IiwicmVzcG9uc2VUeXBlIiwiX3Jlc3BvbnNlVHlwZSIsInBhcnNlciIsIl9wYXJzZXIiLCJpbWFnZSIsImZvcm0iLCJJbmNvbWluZ0Zvcm0iLCJpc0ltYWdlT3JWaWRlbyIsInRleHQiLCJpc1RleHQiLCJfcmVzQnVmZmVyZWQiLCJwYXJzZXJIYW5kbGVzRW5kIiwicmVzcG9uc2VCeXRlc0xlZnQiLCJfbWF4UmVzcG9uc2VTaXplIiwiYnVmIiwiZGVzdHJveSIsInRpbWVkb3V0IiwiZ2V0UHJvZ3Jlc3NNb25pdG9yIiwibGVuZ3RoQ29tcHV0YWJsZSIsInRvdGFsIiwibG9hZGVkIiwicHJvZ3Jlc3MiLCJUcmFuc2Zvcm0iLCJfdHJhbnNmb3JtIiwiY2h1bmsiLCJjYiIsImRpcmVjdGlvbiIsImJ1ZmZlclRvQ2h1bmtzIiwiY2h1bmtTaXplIiwiY2h1bmtpbmciLCJSZWFkYWJsZSIsInRvdGFsTGVuZ3RoIiwicmVtYWluZGVyIiwiY3V0b2ZmIiwicmVtYWluZGVyQnVmZmVyIiwiZm9ybURhdGEiLCJnZXRMZW5ndGgiLCJjb25uZWN0IiwiY29ubmVjdE92ZXJyaWRlIiwidHJ1c3RMb2NhbGhvc3QiLCJ0b2dnbGUiLCJmb3JFYWNoIiwibmFtZSIsInRvVXBwZXJDYXNlIiwic2VuZCIsInBhcnRzIiwic3VidHlwZSJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBOzs7QUFJQTtlQUNtQ0EsT0FBTyxDQUFDLEtBQUQsQztJQUFsQ0MsSyxZQUFBQSxLO0lBQU9DLE0sWUFBQUEsTTtJQUFRQyxPLFlBQUFBLE87O0FBQ3ZCLElBQU1DLE1BQU0sR0FBR0osT0FBTyxDQUFDLFFBQUQsQ0FBdEI7O0FBQ0EsSUFBTUssS0FBSyxHQUFHTCxPQUFPLENBQUMsT0FBRCxDQUFyQjs7QUFDQSxJQUFNTSxJQUFJLEdBQUdOLE9BQU8sQ0FBQyxNQUFELENBQXBCOztBQUNBLElBQU1PLEVBQUUsR0FBR1AsT0FBTyxDQUFDLElBQUQsQ0FBbEI7O0FBQ0EsSUFBTVEsSUFBSSxHQUFHUixPQUFPLENBQUMsTUFBRCxDQUFwQjs7QUFDQSxJQUFNUyxJQUFJLEdBQUdULE9BQU8sQ0FBQyxNQUFELENBQXBCOztBQUNBLElBQU1VLEVBQUUsR0FBR1YsT0FBTyxDQUFDLElBQUQsQ0FBbEI7O0FBQ0EsSUFBTVcsSUFBSSxHQUFHWCxPQUFPLENBQUMsTUFBRCxDQUFwQjs7QUFDQSxJQUFJWSxPQUFPLEdBQUdaLE9BQU8sQ0FBQyxTQUFELENBQXJCOztBQUNBLElBQU1hLFFBQVEsR0FBR2IsT0FBTyxDQUFDLFdBQUQsQ0FBeEI7O0FBQ0EsSUFBTWMsVUFBVSxHQUFHZCxPQUFPLENBQUMsWUFBRCxDQUExQjs7QUFDQSxJQUFNZSxLQUFLLEdBQUdmLE9BQU8sQ0FBQyxPQUFELENBQVAsQ0FBaUIsWUFBakIsQ0FBZDs7QUFDQSxJQUFNZ0IsU0FBUyxHQUFHaEIsT0FBTyxD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R0FBMUIsRUFBK0J6QixRQUEvQixDQUF3Q3lCLElBQXhDLENBQVA7QUFDRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm9kZS9uby1kZXByZWNhdGVkLWFwaVxuY29uc3QgeyBwYXJzZSwgZm9ybWF0LCByZXNvbHZlIH0gPSByZXF1aXJlKCd1cmwnKTtcbmNvbnN0IFN0cmVhbSA9IHJlcXVpcmUoJ3N0cmVhbScpO1xuY29uc3QgaHR0cHMgPSByZXF1aXJlKCdodHRwcycpO1xuY29uc3QgaHR0cCA9IHJlcXVpcmUoJ2h0dHAnKTtcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcbmNvbnN0IHpsaWIgPSByZXF1aXJlKCd6bGliJyk7XG5jb25zdCB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuY29uc3QgcXMgPSByZXF1aXJlKCdxcycpO1xuY29uc3QgbWltZSA9IHJlcXVpcmUoJ21pbWUnKTtcbmxldCBtZXRob2RzID0gcmVxdWlyZSgnbWV0aG9kcycpO1xuY29uc3QgRm9ybURhdGEgPSByZXF1aXJlKCdmb3JtLWRhdGEnKTtcbmNvbnN0IGZvcm1pZGFibGUgPSByZXF1aXJlKCdmb3JtaWRhYmxlJyk7XG5jb25zdCBkZWJ1ZyA9IHJlcXVpcmUoJ2RlYnVnJykoJ3N1cGVyYWdlbnQnKTtcbmNvbnN0IENvb2tpZUphciA9IHJlcXVpcmUoJ2Nvb2tpZWphcicpO1xuY29uc3Qgc2VtdmVyID0gcmVxdWlyZSgnc2VtdmVyJyk7XG5jb25zdCBzYWZlU3RyaW5naWZ5ID0gcmVxdWlyZSgnZmFzdC1zYWZlLXN0cmluZ2lmeScpO1xuXG5jb25zdCB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5jb25zdCBSZXF1ZXN0QmFzZSA9IHJlcXVpcmUoJy4uL3JlcXVlc3QtYmFzZScpO1xuY29uc3QgeyB1bnppcCB9ID0gcmVxdWlyZSgnLi91bnppcCcpO1xuY29uc3QgUmVzcG9uc2UgPSByZXF1aXJlKCcuL3Jlc3BvbnNlJyk7XG5cbmxldCBodHRwMjtcblxuaWYgKHNlbXZlci5ndGUocHJvY2Vzcy52ZXJzaW9uLCAndjEwLjEwLjAnKSkgaHR0cDIgPSByZXF1aXJlKCcuL2h0dHAyd3JhcHBlcicpO1xuXG5mdW5jdGlvbiByZXF1ZXN0KG1ldGhvZCwgdXJsKSB7XG4gIC8vIGNhbGxiYWNrXG4gIGlmICh0eXBlb2YgdXJsID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIG5ldyBleHBvcnRzLlJlcXVlc3QoJ0dFVCcsIG1ldGhvZCkuZW5kKHVybCk7XG4gIH1cblxuICAvLyB1cmwgZmlyc3RcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICByZXR1cm4gbmV3IGV4cG9ydHMuUmVxdWVzdCgnR0VUJywgbWV0aG9kKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgZXhwb3J0cy5SZXF1ZXN0KG1ldGhvZCwgdXJsKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSByZXF1ZXN0O1xuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzO1xuXG4vKipcbiAqIEV4cG9zZSBgUmVxdWVzdGAuXG4gKi9cblxuZXhwb3J0cy5SZXF1ZXN0ID0gUmVxdWVzdDtcblxuLyoqXG4gKiBFeHBvc2UgdGhlIGFnZW50IGZ1bmN0aW9uXG4gKi9cblxuZXhwb3J0cy5hZ2VudCA9IHJlcXVpcmUoJy4vYWdlbnQnKTtcblxuLyoqXG4gKiBOb29wLlxuICovXG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG4vKipcbiAqIEV4cG9zZSBgUmVzcG9uc2VgLlxuICovXG5cbmV4cG9ydHMuUmVzcG9uc2UgPSBSZXNwb25zZTtcblxuLyoqXG4gKiBEZWZpbmUgXCJmb3JtXCIgbWltZSB0eXBlLlxuICovXG5cbm1pbWUuZGVmaW5lKFxuICB7XG4gICAgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCc6IFsnZm9ybScsICd1cmxlbmNvZGVkJywgJ2Zvcm0tZGF0YSddXG4gIH0sXG4gIHRydWVcbik7XG5cbi8qKlxuICogUHJvdG9jb2wgbWFwLlxuICovXG5cbmV4cG9ydHMucHJvdG9jb2xzID0ge1xuICAnaHR0cDonOiBodHRwLFxuICAnaHR0cHM6JzogaHR0cHMsXG4gICdodHRwMjonOiBodHRwMlxufTtcblxuLyoqXG4gKiBEZWZhdWx0IHNlcmlhbGl6YXRpb24gbWFwLlxuICpcbiAqICAgICBzdXBlcmFnZW50LnNlcmlhbGl6ZVsnYXBwbGljYXRpb24veG1sJ10gPSBmdW5jdGlvbihvYmope1xuICogICAgICAgcmV0dXJuICdnZW5lcmF0ZWQgeG1sIGhlcmUnO1xuICogICAgIH07XG4gKlxuICovXG5cbmV4cG9ydHMuc2VyaWFsaXplID0ge1xuICAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJzogcXMuc3RyaW5naWZ5LFxuICAnYXBwbGljYXRpb24vanNvbic6IHNhZmVTdHJpbmdpZnlcbn07XG5cbi8qKlxuICogRGVmYXVsdCBwYXJzZXJzLlxuICpcbiAqICAgICBzdXBlcmFnZW50LnBhcnNlWydhcHBsaWNhdGlvbi94bWwnXSA9IGZ1bmN0aW9uKHJlcywgZm4pe1xuICogICAgICAgZm4obnVsbCwgcmVzKTtcbiAqICAgICB9O1xuICpcbiAqL1xuXG5leHBvcnRzLnBhcnNlID0gcmVxdWlyZSgnLi9wYXJzZXJzJyk7XG5cbi8qKlxuICogRGVmYXVsdCBidWZmZXJpbmcgbWFwLiBDYW4gYmUgdXNlZCB0byBzZXQgY2VydGFpblxuICogcmVzcG9uc2UgdHlwZXMgdG8gYnVmZmVyL25vdCBidWZmZXIuXG4gKlxuICogICAgIHN1cGVyYWdlbnQuYnVmZmVyWydhcHBsaWNhdGlvbi94bWwnXSA9IHRydWU7XG4gKi9cbmV4cG9ydHMuYnVmZmVyID0ge307XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBpbnRlcm5hbCBoZWFkZXIgdHJhY2tpbmcgcHJvcGVydGllcyBvbiBhIHJlcXVlc3QgaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHJlcSB0aGUgaW5zdGFuY2VcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBfaW5pdEhlYWRlcnMocmVxKSB7XG4gIHJlcS5faGVhZGVyID0ge1xuICAgIC8vIGNvZXJjZXMgaGVhZGVyIG5hbWVzIHRvIGxvd2VyY2FzZVxuICB9O1xuICByZXEuaGVhZGVyID0ge1xuICAgIC8vIHByZXNlcnZlcyBoZWFkZXIgbmFtZSBjYXNlXG4gIH07XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBhIG5ldyBgUmVxdWVzdGAgd2l0aCB0aGUgZ2l2ZW4gYG1ldGhvZGAgYW5kIGB1cmxgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gdXJsXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIFJlcXVlc3QobWV0aG9kLCB1cmwpIHtcbiAgU3RyZWFtLmNhbGwodGhpcyk7XG4gIGlmICh0eXBlb2YgdXJsICE9PSAnc3RyaW5nJykgdXJsID0gZm9ybWF0KHVybCk7XG4gIHRoaXMuX2VuYWJsZUh0dHAyID0gQm9vbGVhbihwcm9jZXNzLmVudi5IVFRQMl9URVNUKTsgLy8gaW50ZXJuYWwgb25seVxuICB0aGlzLl9hZ2VudCA9IGZhbHNlO1xuICB0aGlzLl9mb3JtRGF0YSA9IG51bGw7XG4gIHRoaXMubWV0aG9kID0gbWV0aG9kO1xuICB0aGlzLnVybCA9IHVybDtcbiAgX2luaXRIZWFkZXJzKHRoaXMpO1xuICB0aGlzLndyaXRhYmxlID0gdHJ1ZTtcbiAgdGhpcy5fcmVkaXJlY3RzID0gMDtcbiAgdGhpcy5yZWRpcmVjdHMobWV0aG9kID09PSAnSEVBRCcgPyAwIDogNSk7XG4gIHRoaXMuY29va2llcyA9ICcnO1xuICB0aGlzLnFzID0ge307XG4gIHRoaXMuX3F1ZXJ5ID0gW107XG4gIHRoaXMucXNSYXcgPSB0aGlzLl9xdWVyeTsgLy8gVW51c2VkLCBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkgb25seVxuICB0aGlzLl9yZWRpcmVjdExpc3QgPSBbXTtcbiAgdGhpcy5fc3RyZWFtUmVxdWVzdCA9IGZhbHNlO1xuICB0aGlzLm9uY2UoJ2VuZCcsIHRoaXMuY2xlYXJUaW1lb3V0LmJpbmQodGhpcykpO1xufVxuXG4vKipcbiAqIEluaGVyaXQgZnJvbSBgU3RyZWFtYCAod2hpY2ggaW5oZXJpdHMgZnJvbSBgRXZlbnRFbWl0dGVyYCkuXG4gKiBNaXhpbiBgUmVxdWVzdEJhc2VgLlxuICovXG51dGlsLmluaGVyaXRzKFJlcXVlc3QsIFN0cmVhbSk7XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbmV3LWNhcFxuUmVxdWVzdEJhc2UoUmVxdWVzdC5wcm90b3R5cGUpO1xuXG4vKipcbiAqIEVuYWJsZSBvciBEaXNhYmxlIGh0dHAyLlxuICpcbiAqIEVuYWJsZSBodHRwMi5cbiAqXG4gKiBgYGAganNcbiAqIHJlcXVlc3QuZ2V0KCdodHRwOi8vbG9jYWxob3N0LycpXG4gKiAgIC5odHRwMigpXG4gKiAgIC5lbmQoY2FsbGJhY2spO1xuICpcbiAqIHJlcXVlc3QuZ2V0KCdodHRwOi8vbG9jYWxob3N0LycpXG4gKiAgIC5odHRwMih0cnVlKVxuICogICAuZW5kKGNhbGxiYWNrKTtcbiAqIGBgYFxuICpcbiAqIERpc2FibGUgaHR0cDIuXG4gKlxuICogYGBgIGpzXG4gKiByZXF1ZXN0ID0gcmVxdWVzdC5odHRwMigpO1xuICogcmVxdWVzdC5nZXQoJ2h0dHA6Ly9sb2NhbGhvc3QvJylcbiAqICAgLmh0dHAyKGZhbHNlKVxuICogICAuZW5kKGNhbGxiYWNrKTtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gZW5hYmxlXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuaHR0cDIgPSBmdW5jdGlvbihib29sKSB7XG4gIGlmIChleHBvcnRzLnByb3RvY29sc1snaHR0cDI6J10gPT09IHVuZGVmaW5lZCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICdzdXBlcmFnZW50OiB0aGlzIHZlcnNpb24gb2YgTm9kZS5qcyBkb2VzIG5vdCBzdXBwb3J0IGh0dHAyJ1xuICAgICk7XG4gIH1cblxuICB0aGlzLl9lbmFibGVIdHRwMiA9IGJvb2wgPT09IHVuZGVmaW5lZCA/IHRydWUgOiBib29sO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUXVldWUgdGhlIGdpdmVuIGBmaWxlYCBhcyBhbiBhdHRhY2htZW50IHRvIHRoZSBzcGVjaWZpZWQgYGZpZWxkYCxcbiAqIHdpdGggb3B0aW9uYWwgYG9wdGlvbnNgIChvciBmaWxlbmFtZSkuXG4gKlxuICogYGBgIGpzXG4gKiByZXF1ZXN0LnBvc3QoJ2h0dHA6Ly9sb2NhbGhvc3QvdXBsb2FkJylcbiAqICAgLmF0dGFjaCgnZmllbGQnLCBCdWZmZXIuZnJvbSgnPGI+SGVsbG8gd29ybGQ8L2I+JyksICdoZWxsby5odG1sJylcbiAqICAgLmVuZChjYWxsYmFjayk7XG4gKiBgYGBcbiAqXG4gKiBBIGZpbGVuYW1lIG1heSBhbHNvIGJlIHVzZWQ6XG4gKlxuICogYGBgIGpzXG4gKiByZXF1ZXN0LnBvc3QoJ2h0dHA6Ly9sb2NhbGhvc3QvdXBsb2FkJylcbiAqICAgLmF0dGFjaCgnZmlsZXMnLCAnaW1hZ2UuanBnJylcbiAqICAgLmVuZChjYWxsYmFjayk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZmllbGRcbiAqIEBwYXJhbSB7U3RyaW5nfGZzLlJlYWRTdHJlYW18QnVmZmVyfSBmaWxlXG4gKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5hdHRhY2ggPSBmdW5jdGlvbihmaWVsZCwgZmlsZSwgb3B0aW9ucykge1xuICBpZiAoZmlsZSkge1xuICAgIGlmICh0aGlzLl9kYXRhKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJzdXBlcmFnZW50IGNhbid0IG1peCAuc2VuZCgpIGFuZCAuYXR0YWNoKClcIik7XG4gICAgfVxuXG4gICAgbGV0IG8gPSBvcHRpb25zIHx8IHt9O1xuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIG8gPSB7IGZpbGVuYW1lOiBvcHRpb25zIH07XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBmaWxlID09PSAnc3RyaW5nJykge1xuICAgICAgaWYgKCFvLmZpbGVuYW1lKSBvLmZpbGVuYW1lID0gZmlsZTtcbiAgICAgIGRlYnVnKCdjcmVhdGluZyBgZnMuUmVhZFN0cmVhbWAgaW5zdGFuY2UgZm9yIGZpbGU6ICVzJywgZmlsZSk7XG4gICAgICBmaWxlID0gZnMuY3JlYXRlUmVhZFN0cmVhbShmaWxlKTtcbiAgICB9IGVsc2UgaWYgKCFvLmZpbGVuYW1lICYmIGZpbGUucGF0aCkge1xuICAgICAgby5maWxlbmFtZSA9IGZpbGUucGF0aDtcbiAgICB9XG5cbiAgICB0aGlzLl9nZXRGb3JtRGF0YSgpLmFwcGVuZChmaWVsZCwgZmlsZSwgbyk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cblJlcXVlc3QucHJvdG90eXBlLl9nZXRGb3JtRGF0YSA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIXRoaXMuX2Zvcm1EYXRhKSB7XG4gICAgdGhpcy5fZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcbiAgICB0aGlzLl9mb3JtRGF0YS5vbignZXJyb3InLCBlcnIgPT4ge1xuICAgICAgZGVidWcoJ0Zvcm1EYXRhIGVycm9yJywgZXJyKTtcbiAgICAgIGlmICh0aGlzLmNhbGxlZCkge1xuICAgICAgICAvLyBUaGUgcmVxdWVzdCBoYXMgYWxyZWFkeSBmaW5pc2hlZCBhbmQgdGhlIGNhbGxiYWNrIHdhcyBjYWxsZWQuXG4gICAgICAgIC8vIFNpbGVudGx5IGlnbm9yZSB0aGUgZXJyb3IuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdGhpcy5jYWxsYmFjayhlcnIpO1xuICAgICAgdGhpcy5hYm9ydCgpO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHRoaXMuX2Zvcm1EYXRhO1xufTtcblxuLyoqXG4gKiBHZXRzL3NldHMgdGhlIGBBZ2VudGAgdG8gdXNlIGZvciB0aGlzIEhUVFAgcmVxdWVzdC4gVGhlIGRlZmF1bHQgKGlmIHRoaXNcbiAqIGZ1bmN0aW9uIGlzIG5vdCBjYWxsZWQpIGlzIHRvIG9wdCBvdXQgb2YgY29ubmVjdGlvbiBwb29saW5nIChgYWdlbnQ6IGZhbHNlYCkuXG4gKlxuICogQHBhcmFtIHtodHRwLkFnZW50fSBhZ2VudFxuICogQHJldHVybiB7aHR0cC5BZ2VudH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuYWdlbnQgPSBmdW5jdGlvbihhZ2VudCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHRoaXMuX2FnZW50O1xuICB0aGlzLl9hZ2VudCA9IGFnZW50O1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0IF9Db250ZW50LVR5cGVfIHJlc3BvbnNlIGhlYWRlciBwYXNzZWQgdGhyb3VnaCBgbWltZS5nZXRUeXBlKClgLlxuICpcbiAqIEV4YW1wbGVzOlxuICpcbiAqICAgICAgcmVxdWVzdC5wb3N0KCcvJylcbiAqICAgICAgICAudHlwZSgneG1sJylcbiAqICAgICAgICAuc2VuZCh4bWxzdHJpbmcpXG4gKiAgICAgICAgLmVuZChjYWxsYmFjayk7XG4gKlxuICogICAgICByZXF1ZXN0LnBvc3QoJy8nKVxuICogICAgICAgIC50eXBlKCdqc29uJylcbiAqICAgICAgICAuc2VuZChqc29uc3RyaW5nKVxuICogICAgICAgIC5lbmQoY2FsbGJhY2spO1xuICpcbiAqICAgICAgcmVxdWVzdC5wb3N0KCcvJylcbiAqICAgICAgICAudHlwZSgnYXBwbGljYXRpb24vanNvbicpXG4gKiAgICAgICAgLnNlbmQoanNvbnN0cmluZylcbiAqICAgICAgICAuZW5kKGNhbGxiYWNrKTtcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3QucHJvdG90eXBlLnR5cGUgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHJldHVybiB0aGlzLnNldChcbiAgICAnQ29udGVudC1UeXBlJyxcbiAgICB0eXBlLmluY2x1ZGVzKCcvJykgPyB0eXBlIDogbWltZS5nZXRUeXBlKHR5cGUpXG4gICk7XG59O1xuXG4vKipcbiAqIFNldCBfQWNjZXB0XyByZXNwb25zZSBoZWFkZXIgcGFzc2VkIHRocm91Z2ggYG1pbWUuZ2V0VHlwZSgpYC5cbiAqXG4gKiBFeGFtcGxlczpcbiAqXG4gKiAgICAgIHN1cGVyYWdlbnQudHlwZXMuanNvbiA9ICdhcHBsaWNhdGlvbi9qc29uJztcbiAqXG4gKiAgICAgIHJlcXVlc3QuZ2V0KCcvYWdlbnQnKVxuICogICAgICAgIC5hY2NlcHQoJ2pzb24nKVxuICogICAgICAgIC5lbmQoY2FsbGJhY2spO1xuICpcbiAqICAgICAgcmVxdWVzdC5nZXQoJy9hZ2VudCcpXG4gKiAgICAgICAgLmFjY2VwdCgnYXBwbGljYXRpb24vanNvbicpXG4gKiAgICAgICAgLmVuZChjYWxsYmFjayk7XG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGFjY2VwdFxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3QucHJvdG90eXBlLmFjY2VwdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgcmV0dXJuIHRoaXMuc2V0KCdBY2NlcHQnLCB0eXBlLmluY2x1ZGVzKCcvJykgPyB0eXBlIDogbWltZS5nZXRUeXBlKHR5cGUpKTtcbn07XG5cbi8qKlxuICogQWRkIHF1ZXJ5LXN0cmluZyBgdmFsYC5cbiAqXG4gKiBFeGFtcGxlczpcbiAqXG4gKiAgIHJlcXVlc3QuZ2V0KCcvc2hvZXMnKVxuICogICAgIC5xdWVyeSgnc2l6ZT0xMCcpXG4gKiAgICAgLnF1ZXJ5KHsgY29sb3I6ICdibHVlJyB9KVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fFN0cmluZ30gdmFsXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUucXVlcnkgPSBmdW5jdGlvbih2YWwpIHtcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgdGhpcy5fcXVlcnkucHVzaCh2YWwpO1xuICB9IGVsc2Uge1xuICAgIE9iamVjdC5hc3NpZ24odGhpcy5xcywgdmFsKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBXcml0ZSByYXcgYGRhdGFgIC8gYGVuY29kaW5nYCB0byB0aGUgc29ja2V0LlxuICpcbiAqIEBwYXJhbSB7QnVmZmVyfFN0cmluZ30gZGF0YVxuICogQHBhcmFtIHtTdHJpbmd9IGVuY29kaW5nXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uKGRhdGEsIGVuY29kaW5nKSB7XG4gIGNvbnN0IHJlcSA9IHRoaXMucmVxdWVzdCgpO1xuICBpZiAoIXRoaXMuX3N0cmVhbVJlcXVlc3QpIHtcbiAgICB0aGlzLl9zdHJlYW1SZXF1ZXN0ID0gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiByZXEud3JpdGUoZGF0YSwgZW5jb2RpbmcpO1xufTtcblxuLyoqXG4gKiBQaXBlIHRoZSByZXF1ZXN0IGJvZHkgdG8gYHN0cmVhbWAuXG4gKlxuICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge1N0cmVhbX1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUucGlwZSA9IGZ1bmN0aW9uKHN0cmVhbSwgb3B0aW9ucykge1xuICB0aGlzLnBpcGVkID0gdHJ1ZTsgLy8gSEFDSy4uLlxuICB0aGlzLmJ1ZmZlcihmYWxzZSk7XG4gIHRoaXMuZW5kKCk7XG4gIHJldHVybiB0aGlzLl9waXBlQ29udGludWUoc3RyZWFtLCBvcHRpb25zKTtcbn07XG5cblJlcXVlc3QucHJvdG90eXBlLl9waXBlQ29udGludWUgPSBmdW5jdGlvbihzdHJlYW0sIG9wdGlvbnMpIHtcbiAgdGhpcy5yZXEub25jZSgncmVzcG9uc2UnLCByZXMgPT4ge1xuICAgIC8vIHJlZGlyZWN0XG4gICAgaWYgKFxuICAgICAgaXNSZWRpcmVjdChyZXMuc3RhdHVzQ29kZSkgJiZcbiAgICAgIHRoaXMuX3JlZGlyZWN0cysrICE9PSB0aGlzLl9tYXhSZWRpcmVjdHNcbiAgICApIHtcbiAgICAgIHJldHVybiB0aGlzLl9yZWRpcmVjdChyZXMpID09PSB0aGlzXG4gICAgICAgID8gdGhpcy5fcGlwZUNvbnRpbnVlKHN0cmVhbSwgb3B0aW9ucylcbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgdGhpcy5yZXMgPSByZXM7XG4gICAgdGhpcy5fZW1pdFJlc3BvbnNlKCk7XG4gICAgaWYgKHRoaXMuX2Fib3J0ZWQpIHJldHVybjtcblxuICAgIGlmICh0aGlzLl9zaG91bGRVbnppcChyZXMpKSB7XG4gICAgICBjb25zdCB1bnppcE9iaiA9IHpsaWIuY3JlYXRlVW56aXAoKTtcbiAgICAgIHVuemlwT2JqLm9uKCdlcnJvcicsIGVyciA9PiB7XG4gICAgICAgIGlmIChlcnIgJiYgZXJyLmNvZGUgPT09ICdaX0JVRl9FUlJPUicpIHtcbiAgICAgICAgICAvLyB1bmV4cGVjdGVkIGVuZCBvZiBmaWxlIGlzIGlnbm9yZWQgYnkgYnJvd3NlcnMgYW5kIGN1cmxcbiAgICAgICAgICBzdHJlYW0uZW1pdCgnZW5kJyk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RyZWFtLmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgICAgIH0pO1xuICAgICAgcmVzLnBpcGUodW56aXBPYmopLnBpcGUoc3RyZWFtLCBvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzLnBpcGUoc3RyZWFtLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICByZXMub25jZSgnZW5kJywgKCkgPT4ge1xuICAgICAgdGhpcy5lbWl0KCdlbmQnKTtcbiAgICB9KTtcbiAgfSk7XG4gIHJldHVybiBzdHJlYW07XG59O1xuXG4vKipcbiAqIEVuYWJsZSAvIGRpc2FibGUgYnVmZmVyaW5nLlxuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59IFt2YWxdXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuYnVmZmVyID0gZnVuY3Rpb24odmFsKSB7XG4gIHRoaXMuX2J1ZmZlciA9IHZhbCAhPT0gZmFsc2U7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZWRpcmVjdCB0byBgdXJsXG4gKlxuICogQHBhcmFtIHtJbmNvbWluZ01lc3NhZ2V9IHJlc1xuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5fcmVkaXJlY3QgPSBmdW5jdGlvbihyZXMpIHtcbiAgbGV0IHVybCA9IHJlcy5oZWFkZXJzLmxvY2F0aW9uO1xuICBpZiAoIXVybCkge1xuICAgIHJldHVybiB0aGlzLmNhbGxiYWNrKG5ldyBFcnJvcignTm8gbG9jYXRpb24gaGVhZGVyIGZvciByZWRpcmVjdCcpLCByZXMpO1xuICB9XG5cbiAgZGVidWcoJ3JlZGlyZWN0ICVzIC0+ICVzJywgdGhpcy51cmwsIHVybCk7XG5cbiAgLy8gbG9jYXRpb25cbiAgdXJsID0gcmVzb2x2ZSh0aGlzLnVybCwgdXJsKTtcblxuICAvLyBlbnN1cmUgdGhlIHJlc3BvbnNlIGlzIGJlaW5nIGNvbnN1bWVkXG4gIC8vIHRoaXMgaXMgcmVxdWlyZWQgZm9yIE5vZGUgdjAuMTArXG4gIHJlcy5yZXN1bWUoKTtcblxuICBsZXQgaGVhZGVycyA9IHRoaXMucmVxLmdldEhlYWRlcnMgPyB0aGlzLnJlcS5nZXRIZWFkZXJzKCkgOiB0aGlzLnJlcS5faGVhZGVycztcblxuICBjb25zdCBjaGFuZ2VzT3JpZ2luID0gcGFyc2UodXJsKS5ob3N0ICE9PSBwYXJzZSh0aGlzLnVybCkuaG9zdDtcblxuICAvLyBpbXBsZW1lbnRhdGlvbiBvZiAzMDIgZm9sbG93aW5nIGRlZmFjdG8gc3RhbmRhcmRcbiAgaWYgKHJlcy5zdGF0dXNDb2RlID09PSAzMDEgfHwgcmVzLnN0YXR1c0NvZGUgPT09IDMwMikge1xuICAgIC8vIHN0cmlwIENvbnRlbnQtKiByZWxhdGVkIGZpZWxkc1xuICAgIC8vIGluIGNhc2Ugb2YgUE9TVCBldGNcbiAgICBoZWFkZXJzID0gdXRpbHMuY2xlYW5IZWFkZXIoaGVhZGVycywgY2hhbmdlc09yaWdpbik7XG5cbiAgICAvLyBmb3JjZSBHRVRcbiAgICB0aGlzLm1ldGhvZCA9IHRoaXMubWV0aG9kID09PSAnSEVBRCcgPyAnSEVBRCcgOiAnR0VUJztcblxuICAgIC8vIGNsZWFyIGRhdGFcbiAgICB0aGlzLl9kYXRhID0gbnVsbDtcbiAgfVxuXG4gIC8vIDMwMyBpcyBhbHdheXMgR0VUXG4gIGlmIChyZXMuc3RhdHVzQ29kZSA9PT0gMzAzKSB7XG4gICAgLy8gc3RyaXAgQ29udGVudC0qIHJlbGF0ZWQgZmllbGRzXG4gICAgLy8gaW4gY2FzZSBvZiBQT1NUIGV0Y1xuICAgIGhlYWRlcnMgPSB1dGlscy5jbGVhbkhlYWRlcihoZWFkZXJzLCBjaGFuZ2VzT3JpZ2luKTtcblxuICAgIC8vIGZvcmNlIG1ldGhvZFxuICAgIHRoaXMubWV0aG9kID0gJ0dFVCc7XG5cbiAgICAvLyBjbGVhciBkYXRhXG4gICAgdGhpcy5fZGF0YSA9IG51bGw7XG4gIH1cblxuICAvLyAzMDcgcHJlc2VydmVzIG1ldGhvZFxuICAvLyAzMDggcHJlc2VydmVzIG1ldGhvZFxuICBkZWxldGUgaGVhZGVycy5ob3N0O1xuXG4gIGRlbGV0ZSB0aGlzLnJlcTtcbiAgZGVsZXRlIHRoaXMuX2Zvcm1EYXRhO1xuXG4gIC8vIHJlbW92ZSBhbGwgYWRkIGhlYWRlciBleGNlcHQgVXNlci1BZ2VudFxuICBfaW5pdEhlYWRlcnModGhpcyk7XG5cbiAgLy8gcmVkaXJlY3RcbiAgdGhpcy5fZW5kQ2FsbGVkID0gZmFsc2U7XG4gIHRoaXMudXJsID0gdXJsO1xuICB0aGlzLnFzID0ge307XG4gIHRoaXMuX3F1ZXJ5Lmxlbmd0aCA9IDA7XG4gIHRoaXMuc2V0KGhlYWRlcnMpO1xuICB0aGlzLmVtaXQoJ3JlZGlyZWN0JywgcmVzKTtcbiAgdGhpcy5fcmVkaXJlY3RMaXN0LnB1c2godGhpcy51cmwpO1xuICB0aGlzLmVuZCh0aGlzLl9jYWxsYmFjayk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXQgQXV0aG9yaXphdGlvbiBmaWVsZCB2YWx1ZSB3aXRoIGB1c2VyYCBhbmQgYHBhc3NgLlxuICpcbiAqIEV4YW1wbGVzOlxuICpcbiAqICAgLmF1dGgoJ3RvYmknLCAnbGVhcm5ib29zdCcpXG4gKiAgIC5hdXRoKCd0b2JpOmxlYXJuYm9vc3QnKVxuICogICAuYXV0aCgndG9iaScpXG4gKiAgIC5hdXRoKGFjY2Vzc1Rva2VuLCB7IHR5cGU6ICdiZWFyZXInIH0pXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVzZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSBbcGFzc11cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gb3B0aW9ucyB3aXRoIGF1dGhvcml6YXRpb24gdHlwZSAnYmFzaWMnIG9yICdiZWFyZXInICgnYmFzaWMnIGlzIGRlZmF1bHQpXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuYXV0aCA9IGZ1bmN0aW9uKHVzZXIsIHBhc3MsIG9wdGlvbnMpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHBhc3MgPSAnJztcbiAgaWYgKHR5cGVvZiBwYXNzID09PSAnb2JqZWN0JyAmJiBwYXNzICE9PSBudWxsKSB7XG4gICAgLy8gcGFzcyBpcyBvcHRpb25hbCBhbmQgY2FuIGJlIHJlcGxhY2VkIHdpdGggb3B0aW9uc1xuICAgIG9wdGlvbnMgPSBwYXNzO1xuICAgIHBhc3MgPSAnJztcbiAgfVxuXG4gIGlmICghb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSB7IHR5cGU6ICdiYXNpYycgfTtcbiAgfVxuXG4gIGNvbnN0IGVuY29kZXIgPSBzdHJpbmcgPT4gQnVmZmVyLmZyb20oc3RyaW5nKS50b1N0cmluZygnYmFzZTY0Jyk7XG5cbiAgcmV0dXJuIHRoaXMuX2F1dGgodXNlciwgcGFzcywgb3B0aW9ucywgZW5jb2Rlcik7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgY2VydGlmaWNhdGUgYXV0aG9yaXR5IG9wdGlvbiBmb3IgaHR0cHMgcmVxdWVzdC5cbiAqXG4gKiBAcGFyYW0ge0J1ZmZlciB8IEFycmF5fSBjZXJ0XG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuY2EgPSBmdW5jdGlvbihjZXJ0KSB7XG4gIHRoaXMuX2NhID0gY2VydDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgY2xpZW50IGNlcnRpZmljYXRlIGtleSBvcHRpb24gZm9yIGh0dHBzIHJlcXVlc3QuXG4gKlxuICogQHBhcmFtIHtCdWZmZXIgfCBTdHJpbmd9IGNlcnRcbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5rZXkgPSBmdW5jdGlvbihjZXJ0KSB7XG4gIHRoaXMuX2tleSA9IGNlcnQ7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIGtleSwgY2VydGlmaWNhdGUsIGFuZCBDQSBjZXJ0cyBvZiB0aGUgY2xpZW50IGluIFBGWCBvciBQS0NTMTIgZm9ybWF0LlxuICpcbiAqIEBwYXJhbSB7QnVmZmVyIHwgU3RyaW5nfSBjZXJ0XG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUucGZ4ID0gZnVuY3Rpb24oY2VydCkge1xuICBpZiAodHlwZW9mIGNlcnQgPT09ICdvYmplY3QnICYmICFCdWZmZXIuaXNCdWZmZXIoY2VydCkpIHtcbiAgICB0aGlzLl9wZnggPSBjZXJ0LnBmeDtcbiAgICB0aGlzLl9wYXNzcGhyYXNlID0gY2VydC5wYXNzcGhyYXNlO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuX3BmeCA9IGNlcnQ7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0IHRoZSBjbGllbnQgY2VydGlmaWNhdGUgb3B0aW9uIGZvciBodHRwcyByZXF1ZXN0LlxuICpcbiAqIEBwYXJhbSB7QnVmZmVyIHwgU3RyaW5nfSBjZXJ0XG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuY2VydCA9IGZ1bmN0aW9uKGNlcnQpIHtcbiAgdGhpcy5fY2VydCA9IGNlcnQ7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBEbyBub3QgcmVqZWN0IGV4cGlyZWQgb3IgaW52YWxpZCBUTFMgY2VydHMuXG4gKiBzZXRzIGByZWplY3RVbmF1dGhvcml6ZWQ9dHJ1ZWAuIEJlIHdhcm5lZCB0aGF0IHRoaXMgYWxsb3dzIE1JVE0gYXR0YWNrcy5cbiAqXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuZGlzYWJsZVRMU0NlcnRzID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2Rpc2FibGVUTFNDZXJ0cyA9IHRydWU7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gYW4gaHR0cFtzXSByZXF1ZXN0LlxuICpcbiAqIEByZXR1cm4ge091dGdvaW5nTWVzc2FnZX1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjb21wbGV4aXR5XG5SZXF1ZXN0LnByb3RvdHlwZS5yZXF1ZXN0ID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLnJlcSkgcmV0dXJuIHRoaXMucmVxO1xuXG4gIGNvbnN0IG9wdGlvbnMgPSB7fTtcblxuICB0cnkge1xuICAgIGNvbnN0IHF1ZXJ5ID0gcXMuc3RyaW5naWZ5KHRoaXMucXMsIHtcbiAgICAgIGluZGljZXM6IGZhbHNlLFxuICAgICAgc3RyaWN0TnVsbEhhbmRsaW5nOiB0cnVlXG4gICAgfSk7XG4gICAgaWYgKHF1ZXJ5KSB7XG4gICAgICB0aGlzLnFzID0ge307XG4gICAgICB0aGlzLl9xdWVyeS5wdXNoKHF1ZXJ5KTtcbiAgICB9XG5cbiAgICB0aGlzLl9maW5hbGl6ZVF1ZXJ5U3RyaW5nKCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiB0aGlzLmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgfVxuXG4gIGxldCB7IHVybCB9ID0gdGhpcztcbiAgY29uc3QgcmV0cmllcyA9IHRoaXMuX3JldHJpZXM7XG5cbiAgLy8gQ2FwdHVyZSBiYWNrdGlja3MgYXMtaXMgZnJvbSB0aGUgZmluYWwgcXVlcnkgc3RyaW5nIGJ1aWx0IGFib3ZlLlxuICAvLyBOb3RlOiB0aGlzJ2xsIG9ubHkgZmluZCBiYWNrdGlja3MgZW50ZXJlZCBpbiByZXEucXVlcnkoU3RyaW5nKVxuICAvLyBjYWxscywgYmVjYXVzZSBxcy5zdHJpbmdpZnkgdW5jb25kaXRpb25hbGx5IGVuY29kZXMgYmFja3RpY2tzLlxuICBsZXQgcXVlcnlTdHJpbmdCYWNrdGlja3M7XG4gIGlmICh1cmwuaW5jbHVkZXMoJ2AnKSkge1xuICAgIGNvbnN0IHF1ZXJ5U3RhcnRJbmRleCA9IHVybC5pbmRleE9mKCc/Jyk7XG5cbiAgICBpZiAocXVlcnlTdGFydEluZGV4ICE9PSAtMSkge1xuICAgICAgY29uc3QgcXVlcnlTdHJpbmcgPSB1cmwuc2xpY2UocXVlcnlTdGFydEluZGV4ICsgMSk7XG4gICAgICBxdWVyeVN0cmluZ0JhY2t0aWNrcyA9IHF1ZXJ5U3RyaW5nLm1hdGNoKC9gfCU2MC9nKTtcbiAgICB9XG4gIH1cblxuICAvLyBkZWZhdWx0IHRvIGh0dHA6Ly9cbiAgaWYgKHVybC5pbmRleE9mKCdodHRwJykgIT09IDApIHVybCA9IGBodHRwOi8vJHt1cmx9YDtcbiAgdXJsID0gcGFyc2UodXJsKTtcblxuICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3Zpc2lvbm1lZGlhL3N1cGVyYWdlbnQvaXNzdWVzLzEzNjdcbiAgaWYgKHF1ZXJ5U3RyaW5nQmFja3RpY2tzKSB7XG4gICAgbGV0IGkgPSAwO1xuICAgIHVybC5xdWVyeSA9IHVybC5xdWVyeS5yZXBsYWNlKC8lNjAvZywgKCkgPT4gcXVlcnlTdHJpbmdCYWNrdGlja3NbaSsrXSk7XG4gICAgdXJsLnNlYXJjaCA9IGA/JHt1cmwucXVlcnl9YDtcbiAgICB1cmwucGF0aCA9IHVybC5wYXRobmFtZSArIHVybC5zZWFyY2g7XG4gIH1cblxuICAvLyBzdXBwb3J0IHVuaXggc29ja2V0c1xuICBpZiAoL15odHRwcz9cXCt1bml4Oi8udGVzdCh1cmwucHJvdG9jb2wpID09PSB0cnVlKSB7XG4gICAgLy8gZ2V0IHRoZSBwcm90b2NvbFxuICAgIHVybC5wcm90b2NvbCA9IGAke3VybC5wcm90b2NvbC5zcGxpdCgnKycpWzBdfTpgO1xuXG4gICAgLy8gZ2V0IHRoZSBzb2NrZXQsIHBhdGhcbiAgICBjb25zdCB1bml4UGFydHMgPSB1cmwucGF0aC5tYXRjaCgvXihbXi9dKykoLispJC8pO1xuICAgIG9wdGlvbnMuc29ja2V0UGF0aCA9IHVuaXhQYXJ0c1sxXS5yZXBsYWNlKC8lMkYvZywgJy8nKTtcbiAgICB1cmwucGF0aCA9IHVuaXhQYXJ0c1syXTtcbiAgfVxuXG4gIC8vIE92ZXJyaWRlIElQIGFkZHJlc3Mgb2YgYSBob3N0bmFtZVxuICBpZiAodGhpcy5fY29ubmVjdE92ZXJyaWRlKSB7XG4gICAgY29uc3QgeyBob3N0bmFtZSB9ID0gdXJsO1xuICAgIGNvbnN0IG1hdGNoID1cbiAgICAgIGhvc3RuYW1lIGluIHRoaXMuX2Nvbm5lY3RPdmVycmlkZVxuICAgICAgICA/IHRoaXMuX2Nvbm5lY3RPdmVycmlkZVtob3N0bmFtZV1cbiAgICAgICAgOiB0aGlzLl9jb25uZWN0T3ZlcnJpZGVbJyonXTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgIC8vIGJhY2t1cCB0aGUgcmVhbCBob3N0XG4gICAgICBpZiAoIXRoaXMuX2hlYWRlci5ob3N0KSB7XG4gICAgICAgIHRoaXMuc2V0KCdob3N0JywgdXJsLmhvc3QpO1xuICAgICAgfVxuXG4gICAgICAvLyB3cmFwIFtpcHY2XVxuICAgICAgdXJsLmhvc3QgPSAvOi8udGVzdChtYXRjaCkgPyBgWyR7bWF0Y2h9XWAgOiBtYXRjaDtcbiAgICAgIGlmICh1cmwucG9ydCkge1xuICAgICAgICB1cmwuaG9zdCArPSBgOiR7dXJsLnBvcnR9YDtcbiAgICAgIH1cblxuICAgICAgdXJsLmhvc3RuYW1lID0gbWF0Y2g7XG4gICAgfVxuICB9XG5cbiAgLy8gb3B0aW9uc1xuICBvcHRpb25zLm1ldGhvZCA9IHRoaXMubWV0aG9kO1xuICBvcHRpb25zLnBvcnQgPSB1cmwucG9ydDtcbiAgb3B0aW9ucy5wYXRoID0gdXJsLnBhdGg7XG4gIG9wdGlvbnMuaG9zdCA9IHVybC5ob3N0bmFtZTtcbiAgb3B0aW9ucy5jYSA9IHRoaXMuX2NhO1xuICBvcHRpb25zLmtleSA9IHRoaXMuX2tleTtcbiAgb3B0aW9ucy5wZnggPSB0aGlzLl9wZng7XG4gIG9wdGlvbnMuY2VydCA9IHRoaXMuX2NlcnQ7XG4gIG9wdGlvbnMucGFzc3BocmFzZSA9IHRoaXMuX3Bhc3NwaHJhc2U7XG4gIG9wdGlvbnMuYWdlbnQgPSB0aGlzLl9hZ2VudDtcbiAgb3B0aW9ucy5yZWplY3RVbmF1dGhvcml6ZWQgPVxuICAgIHR5cGVvZiB0aGlzLl9kaXNhYmxlVExTQ2VydHMgPT09ICdib29sZWFuJ1xuICAgICAgPyAhdGhpcy5fZGlzYWJsZVRMU0NlcnRzXG4gICAgICA6IHByb2Nlc3MuZW52Lk5PREVfVExTX1JFSkVDVF9VTkFVVEhPUklaRUQgIT09ICcwJztcblxuICAvLyBBbGxvd3MgcmVxdWVzdC5nZXQoJ2h0dHBzOi8vMS4yLjMuNC8nKS5zZXQoJ0hvc3QnLCAnZXhhbXBsZS5jb20nKVxuICBpZiAodGhpcy5faGVhZGVyLmhvc3QpIHtcbiAgICBvcHRpb25zLnNlcnZlcm5hbWUgPSB0aGlzLl9oZWFkZXIuaG9zdC5yZXBsYWNlKC86XFxkKyQvLCAnJyk7XG4gIH1cblxuICBpZiAoXG4gICAgdGhpcy5fdHJ1c3RMb2NhbGhvc3QgJiZcbiAgICAvXig/OmxvY2FsaG9zdHwxMjdcXC4wXFwuMFxcLlxcZCt8KDAqOikrOjAqMSkkLy50ZXN0KHVybC5ob3N0bmFtZSlcbiAgKSB7XG4gICAgb3B0aW9ucy5yZWplY3RVbmF1dGhvcml6ZWQgPSBmYWxzZTtcbiAgfVxuXG4gIC8vIGluaXRpYXRlIHJlcXVlc3RcbiAgY29uc3QgbW9kID0gdGhpcy5fZW5hYmxlSHR0cDJcbiAgICA/IGV4cG9ydHMucHJvdG9jb2xzWydodHRwMjonXS5zZXRQcm90b2NvbCh1cmwucHJvdG9jb2wpXG4gICAgOiBleHBvcnRzLnByb3RvY29sc1t1cmwucHJvdG9jb2xdO1xuXG4gIC8vIHJlcXVlc3RcbiAgdGhpcy5yZXEgPSBtb2QucmVxdWVzdChvcHRpb25zKTtcbiAgY29uc3QgeyByZXEgfSA9IHRoaXM7XG5cbiAgLy8gc2V0IHRjcCBubyBkZWxheVxuICByZXEuc2V0Tm9EZWxheSh0cnVlKTtcblxuICBpZiAob3B0aW9ucy5tZXRob2QgIT09ICdIRUFEJykge1xuICAgIHJlcS5zZXRIZWFkZXIoJ0FjY2VwdC1FbmNvZGluZycsICdnemlwLCBkZWZsYXRlJyk7XG4gIH1cblxuICB0aGlzLnByb3RvY29sID0gdXJsLnByb3RvY29sO1xuICB0aGlzLmhvc3QgPSB1cmwuaG9zdDtcblxuICAvLyBleHBvc2UgZXZlbnRzXG4gIHJlcS5vbmNlKCdkcmFpbicsICgpID0+IHtcbiAgICB0aGlzLmVtaXQoJ2RyYWluJyk7XG4gIH0pO1xuXG4gIHJlcS5vbignZXJyb3InLCBlcnIgPT4ge1xuICAgIC8vIGZsYWcgYWJvcnRpb24gaGVyZSBmb3Igb3V0IHRpbWVvdXRzXG4gICAgLy8gYmVjYXVzZSBub2RlIHdpbGwgZW1pdCBhIGZhdXgtZXJyb3IgXCJzb2NrZXQgaGFuZyB1cFwiXG4gICAgLy8gd2hlbiByZXF1ZXN0IGlzIGFib3J0ZWQgYmVmb3JlIGEgY29ubmVjdGlvbiBpcyBtYWRlXG4gICAgaWYgKHRoaXMuX2Fib3J0ZWQpIHJldHVybjtcbiAgICAvLyBpZiBub3QgdGhlIHNhbWUsIHdlIGFyZSBpbiB0aGUgKipvbGQqKiAoY2FuY2VsbGVkKSByZXF1ZXN0LFxuICAgIC8vIHNvIG5lZWQgdG8gY29udGludWUgKHNhbWUgYXMgZm9yIGFib3ZlKVxuICAgIGlmICh0aGlzLl9yZXRyaWVzICE9PSByZXRyaWVzKSByZXR1cm47XG4gICAgLy8gaWYgd2UndmUgcmVjZWl2ZWQgYSByZXNwb25zZSB0aGVuIHdlIGRvbid0IHdhbnQgdG8gbGV0XG4gICAgLy8gYW4gZXJyb3IgaW4gdGhlIHJlcXVlc3QgYmxvdyB1cCB0aGUgcmVzcG9uc2VcbiAgICBpZiAodGhpcy5yZXNwb25zZSkgcmV0dXJuO1xuICAgIHRoaXMuY2FsbGJhY2soZXJyKTtcbiAgfSk7XG5cbiAgLy8gYXV0aFxuICBpZiAodXJsLmF1dGgpIHtcbiAgICBjb25zdCBhdXRoID0gdXJsLmF1dGguc3BsaXQoJzonKTtcbiAgICB0aGlzLmF1dGgoYXV0aFswXSwgYXV0aFsxXSk7XG4gIH1cblxuICBpZiAodGhpcy51c2VybmFtZSAmJiB0aGlzLnBhc3N3b3JkKSB7XG4gICAgdGhpcy5hdXRoKHRoaXMudXNlcm5hbWUsIHRoaXMucGFzc3dvcmQpO1xuICB9XG5cbiAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy5oZWFkZXIpIHtcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMuaGVhZGVyLCBrZXkpKVxuICAgICAgcmVxLnNldEhlYWRlcihrZXksIHRoaXMuaGVhZGVyW2tleV0pO1xuICB9XG5cbiAgLy8gYWRkIGNvb2tpZXNcbiAgaWYgKHRoaXMuY29va2llcykge1xuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodGhpcy5faGVhZGVyLCAnY29va2llJykpIHtcbiAgICAgIC8vIG1lcmdlXG4gICAgICBjb25zdCB0bXBKYXIgPSBuZXcgQ29va2llSmFyLkNvb2tpZUphcigpO1xuICAgICAgdG1wSmFyLnNldENvb2tpZXModGhpcy5faGVhZGVyLmNvb2tpZS5zcGxpdCgnOycpKTtcbiAgICAgIHRtcEphci5zZXRDb29raWVzKHRoaXMuY29va2llcy5zcGxpdCgnOycpKTtcbiAgICAgIHJlcS5zZXRIZWFkZXIoXG4gICAgICAgICdDb29raWUnLFxuICAgICAgICB0bXBKYXIuZ2V0Q29va2llcyhDb29raWVKYXIuQ29va2llQWNjZXNzSW5mby5BbGwpLnRvVmFsdWVTdHJpbmcoKVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVxLnNldEhlYWRlcignQ29va2llJywgdGhpcy5jb29raWVzKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVxO1xufTtcblxuLyoqXG4gKiBJbnZva2UgdGhlIGNhbGxiYWNrIHdpdGggYGVycmAgYW5kIGByZXNgXG4gKiBhbmQgaGFuZGxlIGFyaXR5IGNoZWNrLlxuICpcbiAqIEBwYXJhbSB7RXJyb3J9IGVyclxuICogQHBhcmFtIHtSZXNwb25zZX0gcmVzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5jYWxsYmFjayA9IGZ1bmN0aW9uKGVyciwgcmVzKSB7XG4gIGlmICh0aGlzLl9zaG91bGRSZXRyeShlcnIsIHJlcykpIHtcbiAgICByZXR1cm4gdGhpcy5fcmV0cnkoKTtcbiAgfVxuXG4gIC8vIEF2b2lkIHRoZSBlcnJvciB3aGljaCBpcyBlbWl0dGVkIGZyb20gJ3NvY2tldCBoYW5nIHVwJyB0byBjYXVzZSB0aGUgZm4gdW5kZWZpbmVkIGVycm9yIG9uIEpTIHJ1bnRpbWUuXG4gIGNvbnN0IGZuID0gdGhpcy5fY2FsbGJhY2sgfHwgbm9vcDtcbiAgdGhpcy5jbGVhclRpbWVvdXQoKTtcbiAgaWYgKHRoaXMuY2FsbGVkKSByZXR1cm4gY29uc29sZS53YXJuKCdzdXBlcmFnZW50OiBkb3VibGUgY2FsbGJhY2sgYnVnJyk7XG4gIHRoaXMuY2FsbGVkID0gdHJ1ZTtcblxuICBpZiAoIWVycikge1xuICAgIHRyeSB7XG4gICAgICBpZiAoIXRoaXMuX2lzUmVzcG9uc2VPSyhyZXMpKSB7XG4gICAgICAgIGxldCBtc2cgPSAnVW5zdWNjZXNzZnVsIEhUVFAgcmVzcG9uc2UnO1xuICAgICAgICBpZiAocmVzKSB7XG4gICAgICAgICAgbXNnID0gaHR0cC5TVEFUVVNfQ09ERVNbcmVzLnN0YXR1c10gfHwgbXNnO1xuICAgICAgICB9XG5cbiAgICAgICAgZXJyID0gbmV3IEVycm9yKG1zZyk7XG4gICAgICAgIGVyci5zdGF0dXMgPSByZXMgPyByZXMuc3RhdHVzIDogdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycl8pIHtcbiAgICAgIGVyciA9IGVycl87XG4gICAgfVxuICB9XG5cbiAgLy8gSXQncyBpbXBvcnRhbnQgdGhhdCB0aGUgY2FsbGJhY2sgaXMgY2FsbGVkIG91dHNpZGUgdHJ5L2NhdGNoXG4gIC8vIHRvIGF2b2lkIGRvdWJsZSBjYWxsYmFja1xuICBpZiAoIWVycikge1xuICAgIHJldHVybiBmbihudWxsLCByZXMpO1xuICB9XG5cbiAgZXJyLnJlc3BvbnNlID0gcmVzO1xuICBpZiAodGhpcy5fbWF4UmV0cmllcykgZXJyLnJldHJpZXMgPSB0aGlzLl9yZXRyaWVzIC0gMTtcblxuICAvLyBvbmx5IGVtaXQgZXJyb3IgZXZlbnQgaWYgdGhlcmUgaXMgYSBsaXN0ZW5lclxuICAvLyBvdGhlcndpc2Ugd2UgYXNzdW1lIHRoZSBjYWxsYmFjayB0byBgLmVuZCgpYCB3aWxsIGdldCB0aGUgZXJyb3JcbiAgaWYgKGVyciAmJiB0aGlzLmxpc3RlbmVycygnZXJyb3InKS5sZW5ndGggPiAwKSB7XG4gICAgdGhpcy5lbWl0KCdlcnJvcicsIGVycik7XG4gIH1cblxuICBmbihlcnIsIHJlcyk7XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIGBvYmpgIGlzIGEgaG9zdCBvYmplY3QsXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBob3N0IG9iamVjdFxuICogQHJldHVybiB7Qm9vbGVhbn0gaXMgYSBob3N0IG9iamVjdFxuICogQGFwaSBwcml2YXRlXG4gKi9cblJlcXVlc3QucHJvdG90eXBlLl9pc0hvc3QgPSBmdW5jdGlvbihvYmopIHtcbiAgcmV0dXJuIChcbiAgICBCdWZmZXIuaXNCdWZmZXIob2JqKSB8fCBvYmogaW5zdGFuY2VvZiBTdHJlYW0gfHwgb2JqIGluc3RhbmNlb2YgRm9ybURhdGFcbiAgKTtcbn07XG5cbi8qKlxuICogSW5pdGlhdGUgcmVxdWVzdCwgaW52b2tpbmcgY2FsbGJhY2sgYGZuKGVyciwgcmVzKWBcbiAqIHdpdGggYW4gaW5zdGFuY2VvZiBgUmVzcG9uc2VgLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuX2VtaXRSZXNwb25zZSA9IGZ1bmN0aW9uKGJvZHksIGZpbGVzKSB7XG4gIGNvbnN0IHJlc3BvbnNlID0gbmV3IFJlc3BvbnNlKHRoaXMpO1xuICB0aGlzLnJlc3BvbnNlID0gcmVzcG9uc2U7XG4gIHJlc3BvbnNlLnJlZGlyZWN0cyA9IHRoaXMuX3JlZGlyZWN0TGlzdDtcbiAgaWYgKHVuZGVmaW5lZCAhPT0gYm9keSkge1xuICAgIHJlc3BvbnNlLmJvZHkgPSBib2R5O1xuICB9XG5cbiAgcmVzcG9uc2UuZmlsZXMgPSBmaWxlcztcbiAgaWYgKHRoaXMuX2VuZENhbGxlZCkge1xuICAgIHJlc3BvbnNlLnBpcGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJlbmQoKSBoYXMgYWxyZWFkeSBiZWVuIGNhbGxlZCwgc28gaXQncyB0b28gbGF0ZSB0byBzdGFydCBwaXBpbmdcIlxuICAgICAgKTtcbiAgICB9O1xuICB9XG5cbiAgdGhpcy5lbWl0KCdyZXNwb25zZScsIHJlc3BvbnNlKTtcbiAgcmV0dXJuIHJlc3BvbnNlO1xufTtcblxuUmVxdWVzdC5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24oZm4pIHtcbiAgdGhpcy5yZXF1ZXN0KCk7XG4gIGRlYnVnKCclcyAlcycsIHRoaXMubWV0aG9kLCB0aGlzLnVybCk7XG5cbiAgaWYgKHRoaXMuX2VuZENhbGxlZCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICcuZW5kKCkgd2FzIGNhbGxlZCB0d2ljZS4gVGhpcyBpcyBub3Qgc3VwcG9ydGVkIGluIHN1cGVyYWdlbnQnXG4gICAgKTtcbiAgfVxuXG4gIHRoaXMuX2VuZENhbGxlZCA9IHRydWU7XG5cbiAgLy8gc3RvcmUgY2FsbGJhY2tcbiAgdGhpcy5fY2FsbGJhY2sgPSBmbiB8fCBub29wO1xuXG4gIHRoaXMuX2VuZCgpO1xufTtcblxuUmVxdWVzdC5wcm90b3R5cGUuX2VuZCA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5fYWJvcnRlZClcbiAgICByZXR1cm4gdGhpcy5jYWxsYmFjayhcbiAgICAgIG5ldyBFcnJvcignVGhlIHJlcXVlc3QgaGFzIGJlZW4gYWJvcnRlZCBldmVuIGJlZm9yZSAuZW5kKCkgd2FzIGNhbGxlZCcpXG4gICAgKTtcblxuICBsZXQgZGF0YSA9IHRoaXMuX2RhdGE7XG4gIGNvbnN0IHsgcmVxIH0gPSB0aGlzO1xuICBjb25zdCB7IG1ldGhvZCB9ID0gdGhpcztcblxuICB0aGlzLl9zZXRUaW1lb3V0cygpO1xuXG4gIC8vIGJvZHlcbiAgaWYgKG1ldGhvZCAhPT0gJ0hFQUQnICYmICFyZXEuX2hlYWRlclNlbnQpIHtcbiAgICAvLyBzZXJpYWxpemUgc3R1ZmZcbiAgICBpZiAodHlwZW9mIGRhdGEgIT09ICdzdHJpbmcnKSB7XG4gICAgICBsZXQgY29udGVudFR5cGUgPSByZXEuZ2V0SGVhZGVyKCdDb250ZW50LVR5cGUnKTtcbiAgICAgIC8vIFBhcnNlIG91dCBqdXN0IHRoZSBjb250ZW50IHR5cGUgZnJvbSB0aGUgaGVhZGVyIChpZ25vcmUgdGhlIGNoYXJzZXQpXG4gICAgICBpZiAoY29udGVudFR5cGUpIGNvbnRlbnRUeXBlID0gY29udGVudFR5cGUuc3BsaXQoJzsnKVswXTtcbiAgICAgIGxldCBzZXJpYWxpemUgPSB0aGlzLl9zZXJpYWxpemVyIHx8IGV4cG9ydHMuc2VyaWFsaXplW2NvbnRlbnRUeXBlXTtcbiAgICAgIGlmICghc2VyaWFsaXplICYmIGlzSlNPTihjb250ZW50VHlwZSkpIHtcbiAgICAgICAgc2VyaWFsaXplID0gZXhwb3J0cy5zZXJpYWxpemVbJ2FwcGxpY2F0aW9uL2pzb24nXTtcbiAgICAgIH1cblxuICAgICAgaWYgKHNlcmlhbGl6ZSkgZGF0YSA9IHNlcmlhbGl6ZShkYXRhKTtcbiAgICB9XG5cbiAgICAvLyBjb250ZW50LWxlbmd0aFxuICAgIGlmIChkYXRhICYmICFyZXEuZ2V0SGVhZGVyKCdDb250ZW50LUxlbmd0aCcpKSB7XG4gICAgICByZXEuc2V0SGVhZGVyKFxuICAgICAgICAnQ29udGVudC1MZW5ndGgnLFxuICAgICAgICBCdWZmZXIuaXNCdWZmZXIoZGF0YSkgPyBkYXRhLmxlbmd0aCA6IEJ1ZmZlci5ieXRlTGVuZ3RoKGRhdGEpXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8vIHJlc3BvbnNlXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjb21wbGV4aXR5XG4gIHJlcS5vbmNlKCdyZXNwb25zZScsIHJlcyA9PiB7XG4gICAgZGVidWcoJyVzICVzIC0+ICVzJywgdGhpcy5tZXRob2QsIHRoaXMudXJsLCByZXMuc3RhdHVzQ29kZSk7XG5cbiAgICBpZiAodGhpcy5fcmVzcG9uc2VUaW1lb3V0VGltZXIpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9yZXNwb25zZVRpbWVvdXRUaW1lcik7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucGlwZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBtYXggPSB0aGlzLl9tYXhSZWRpcmVjdHM7XG4gICAgY29uc3QgbWltZSA9IHV0aWxzLnR5cGUocmVzLmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddIHx8ICcnKSB8fCAndGV4dC9wbGFpbic7XG4gICAgY29uc3QgdHlwZSA9IG1pbWUuc3BsaXQoJy8nKVswXTtcbiAgICBjb25zdCBtdWx0aXBhcnQgPSB0eXBlID09PSAnbXVsdGlwYXJ0JztcbiAgICBjb25zdCByZWRpcmVjdCA9IGlzUmVkaXJlY3QocmVzLnN0YXR1c0NvZGUpO1xuICAgIGNvbnN0IHJlc3BvbnNlVHlwZSA9IHRoaXMuX3Jlc3BvbnNlVHlwZTtcblxuICAgIHRoaXMucmVzID0gcmVzO1xuXG4gICAgLy8gcmVkaXJlY3RcbiAgICBpZiAocmVkaXJlY3QgJiYgdGhpcy5fcmVkaXJlY3RzKysgIT09IG1heCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3JlZGlyZWN0KHJlcyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubWV0aG9kID09PSAnSEVBRCcpIHtcbiAgICAgIHRoaXMuZW1pdCgnZW5kJyk7XG4gICAgICB0aGlzLmNhbGxiYWNrKG51bGwsIHRoaXMuX2VtaXRSZXNwb25zZSgpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyB6bGliIHN1cHBvcnRcbiAgICBpZiAodGhpcy5fc2hvdWxkVW56aXAocmVzKSkge1xuICAgICAgdW56aXAocmVxLCByZXMpO1xuICAgIH1cblxuICAgIGxldCBidWZmZXIgPSB0aGlzLl9idWZmZXI7XG4gICAgaWYgKGJ1ZmZlciA9PT0gdW5kZWZpbmVkICYmIG1pbWUgaW4gZXhwb3J0cy5idWZmZXIpIHtcbiAgICAgIGJ1ZmZlciA9IEJvb2xlYW4oZXhwb3J0cy5idWZmZXJbbWltZV0pO1xuICAgIH1cblxuICAgIGxldCBwYXJzZXIgPSB0aGlzLl9wYXJzZXI7XG4gICAgaWYgKHVuZGVmaW5lZCA9PT0gYnVmZmVyKSB7XG4gICAgICBpZiAocGFyc2VyKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICBcIkEgY3VzdG9tIHN1cGVyYWdlbnQgcGFyc2VyIGhhcyBiZWVuIHNldCwgYnV0IGJ1ZmZlcmluZyBzdHJhdGVneSBmb3IgdGhlIHBhcnNlciBoYXNuJ3QgYmVlbiBjb25maWd1cmVkLiBDYWxsIGByZXEuYnVmZmVyKHRydWUgb3IgZmFsc2UpYCBvciBzZXQgYHN1cGVyYWdlbnQuYnVmZmVyW21pbWVdID0gdHJ1ZSBvciBmYWxzZWBcIlxuICAgICAgICApO1xuICAgICAgICBidWZmZXIgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghcGFyc2VyKSB7XG4gICAgICBpZiAocmVzcG9uc2VUeXBlKSB7XG4gICAgICAgIHBhcnNlciA9IGV4cG9ydHMucGFyc2UuaW1hZ2U7IC8vIEl0J3MgYWN0dWFsbHkgYSBnZW5lcmljIEJ1ZmZlclxuICAgICAgICBidWZmZXIgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChtdWx0aXBhcnQpIHtcbiAgICAgICAgY29uc3QgZm9ybSA9IG5ldyBmb3JtaWRhYmxlLkluY29taW5nRm9ybSgpO1xuICAgICAgICBwYXJzZXIgPSBmb3JtLnBhcnNlLmJpbmQoZm9ybSk7XG4gICAgICAgIGJ1ZmZlciA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGlzSW1hZ2VPclZpZGVvKG1pbWUpKSB7XG4gICAgICAgIHBhcnNlciA9IGV4cG9ydHMucGFyc2UuaW1hZ2U7XG4gICAgICAgIGJ1ZmZlciA9IHRydWU7IC8vIEZvciBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eSBidWZmZXJpbmcgZGVmYXVsdCBpcyBhZC1ob2MgTUlNRS1kZXBlbmRlbnRcbiAgICAgIH0gZWxzZSBpZiAoZXhwb3J0cy5wYXJzZVttaW1lXSkge1xuICAgICAgICBwYXJzZXIgPSBleHBvcnRzLnBhcnNlW21pbWVdO1xuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAndGV4dCcpIHtcbiAgICAgICAgcGFyc2VyID0gZXhwb3J0cy5wYXJzZS50ZXh0O1xuICAgICAgICBidWZmZXIgPSBidWZmZXIgIT09IGZhbHNlO1xuXG4gICAgICAgIC8vIGV2ZXJ5b25lIHdhbnRzIHRoZWlyIG93biB3aGl0ZS1sYWJlbGVkIGpzb25cbiAgICAgIH0gZWxzZSBpZiAoaXNKU09OKG1pbWUpKSB7XG4gICAgICAgIHBhcnNlciA9IGV4cG9ydHMucGFyc2VbJ2FwcGxpY2F0aW9uL2pzb24nXTtcbiAgICAgICAgYnVmZmVyID0gYnVmZmVyICE9PSBmYWxzZTtcbiAgICAgIH0gZWxzZSBpZiAoYnVmZmVyKSB7XG4gICAgICAgIHBhcnNlciA9IGV4cG9ydHMucGFyc2UudGV4dDtcbiAgICAgIH0gZWxzZSBpZiAodW5kZWZpbmVkID09PSBidWZmZXIpIHtcbiAgICAgICAgcGFyc2VyID0gZXhwb3J0cy5wYXJzZS5pbWFnZTsgLy8gSXQncyBhY3R1YWxseSBhIGdlbmVyaWMgQnVmZmVyXG4gICAgICAgIGJ1ZmZlciA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gYnkgZGVmYXVsdCBvbmx5IGJ1ZmZlciB0ZXh0LyosIGpzb24gYW5kIG1lc3NlZCB1cCB0aGluZyBmcm9tIGhlbGxcbiAgICBpZiAoKHVuZGVmaW5lZCA9PT0gYnVmZmVyICYmIGlzVGV4dChtaW1lKSkgfHwgaXNKU09OKG1pbWUpKSB7XG4gICAgICBidWZmZXIgPSB0cnVlO1xuICAgIH1cblxuICAgIHRoaXMuX3Jlc0J1ZmZlcmVkID0gYnVmZmVyO1xuICAgIGxldCBwYXJzZXJIYW5kbGVzRW5kID0gZmFsc2U7XG4gICAgaWYgKGJ1ZmZlcikge1xuICAgICAgLy8gUHJvdGVjdGlvbmEgYWdhaW5zdCB6aXAgYm9tYnMgYW5kIG90aGVyIG51aXNhbmNlXG4gICAgICBsZXQgcmVzcG9uc2VCeXRlc0xlZnQgPSB0aGlzLl9tYXhSZXNwb25zZVNpemUgfHwgMjAwMDAwMDAwO1xuICAgICAgcmVzLm9uKCdkYXRhJywgYnVmID0+IHtcbiAgICAgICAgcmVzcG9uc2VCeXRlc0xlZnQgLT0gYnVmLmJ5dGVMZW5ndGggfHwgYnVmLmxlbmd0aDtcbiAgICAgICAgaWYgKHJlc3BvbnNlQnl0ZXNMZWZ0IDwgMCkge1xuICAgICAgICAgIC8vIFRoaXMgd2lsbCBwcm9wYWdhdGUgdGhyb3VnaCBlcnJvciBldmVudFxuICAgICAgICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcignTWF4aW11bSByZXNwb25zZSBzaXplIHJlYWNoZWQnKTtcbiAgICAgICAgICBlcnIuY29kZSA9ICdFVE9PTEFSR0UnO1xuICAgICAgICAgIC8vIFBhcnNlcnMgYXJlbid0IHJlcXVpcmVkIHRvIG9ic2VydmUgZXJyb3IgZXZlbnQsXG4gICAgICAgICAgLy8gc28gd291bGQgaW5jb3JyZWN0bHkgcmVwb3J0IHN1Y2Nlc3NcbiAgICAgICAgICBwYXJzZXJIYW5kbGVzRW5kID0gZmFsc2U7XG4gICAgICAgICAgLy8gV2lsbCBlbWl0IGVycm9yIGV2ZW50XG4gICAgICAgICAgcmVzLmRlc3Ryb3koZXJyKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHBhcnNlcikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gVW5idWZmZXJlZCBwYXJzZXJzIGFyZSBzdXBwb3NlZCB0byBlbWl0IHJlc3BvbnNlIGVhcmx5LFxuICAgICAgICAvLyB3aGljaCBpcyB3ZWlyZCBCVFcsIGJlY2F1c2UgcmVzcG9uc2UuYm9keSB3b24ndCBiZSB0aGVyZS5cbiAgICAgICAgcGFyc2VySGFuZGxlc0VuZCA9IGJ1ZmZlcjtcblxuICAgICAgICBwYXJzZXIocmVzLCAoZXJyLCBvYmosIGZpbGVzKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMudGltZWRvdXQpIHtcbiAgICAgICAgICAgIC8vIFRpbWVvdXQgaGFzIGFscmVhZHkgaGFuZGxlZCBhbGwgY2FsbGJhY2tzXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gSW50ZW50aW9uYWwgKG5vbi10aW1lb3V0KSBhYm9ydCBpcyBzdXBwb3NlZCB0byBwcmVzZXJ2ZSBwYXJ0aWFsIHJlc3BvbnNlLFxuICAgICAgICAgIC8vIGV2ZW4gaWYgaXQgZG9lc24ndCBwYXJzZS5cbiAgICAgICAgICBpZiAoZXJyICYmICF0aGlzLl9hYm9ydGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jYWxsYmFjayhlcnIpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChwYXJzZXJIYW5kbGVzRW5kKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2VuZCcpO1xuICAgICAgICAgICAgdGhpcy5jYWxsYmFjayhudWxsLCB0aGlzLl9lbWl0UmVzcG9uc2Uob2JqLCBmaWxlcykpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgdGhpcy5jYWxsYmFjayhlcnIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5yZXMgPSByZXM7XG5cbiAgICAvLyB1bmJ1ZmZlcmVkXG4gICAgaWYgKCFidWZmZXIpIHtcbiAgICAgIGRlYnVnKCd1bmJ1ZmZlcmVkICVzICVzJywgdGhpcy5tZXRob2QsIHRoaXMudXJsKTtcbiAgICAgIHRoaXMuY2FsbGJhY2sobnVsbCwgdGhpcy5fZW1pdFJlc3BvbnNlKCkpO1xuICAgICAgaWYgKG11bHRpcGFydCkgcmV0dXJuOyAvLyBhbGxvdyBtdWx0aXBhcnQgdG8gaGFuZGxlIGVuZCBldmVudFxuICAgICAgcmVzLm9uY2UoJ2VuZCcsICgpID0+IHtcbiAgICAgICAgZGVidWcoJ2VuZCAlcyAlcycsIHRoaXMubWV0aG9kLCB0aGlzLnVybCk7XG4gICAgICAgIHRoaXMuZW1pdCgnZW5kJyk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyB0ZXJtaW5hdGluZyBldmVudHNcbiAgICByZXMub25jZSgnZXJyb3InLCBlcnIgPT4ge1xuICAgICAgcGFyc2VySGFuZGxlc0VuZCA9IGZhbHNlO1xuICAgICAgdGhpcy5jYWxsYmFjayhlcnIsIG51bGwpO1xuICAgIH0pO1xuICAgIGlmICghcGFyc2VySGFuZGxlc0VuZClcbiAgICAgIHJlcy5vbmNlKCdlbmQnLCAoKSA9PiB7XG4gICAgICAgIGRlYnVnKCdlbmQgJXMgJXMnLCB0aGlzLm1ldGhvZCwgdGhpcy51cmwpO1xuICAgICAgICAvLyBUT0RPOiB1bmxlc3MgYnVmZmVyaW5nIGVtaXQgZWFybGllciB0byBzdHJlYW1cbiAgICAgICAgdGhpcy5lbWl0KCdlbmQnKTtcbiAgICAgICAgdGhpcy5jYWxsYmFjayhudWxsLCB0aGlzLl9lbWl0UmVzcG9uc2UoKSk7XG4gICAgICB9KTtcbiAgfSk7XG5cbiAgdGhpcy5lbWl0KCdyZXF1ZXN0JywgdGhpcyk7XG5cbiAgY29uc3QgZ2V0UHJvZ3Jlc3NNb25pdG9yID0gKCkgPT4ge1xuICAgIGNvbnN0IGxlbmd0aENvbXB1dGFibGUgPSB0cnVlO1xuICAgIGNvbnN0IHRvdGFsID0gcmVxLmdldEhlYWRlcignQ29udGVudC1MZW5ndGgnKTtcbiAgICBsZXQgbG9hZGVkID0gMDtcblxuICAgIGNvbnN0IHByb2dyZXNzID0gbmV3IFN0cmVhbS5UcmFuc2Zvcm0oKTtcbiAgICBwcm9ncmVzcy5fdHJhbnNmb3JtID0gKGNodW5rLCBlbmNvZGluZywgY2IpID0+IHtcbiAgICAgIGxvYWRlZCArPSBjaHVuay5sZW5ndGg7XG4gICAgICB0aGlzLmVtaXQoJ3Byb2dyZXNzJywge1xuICAgICAgICBkaXJlY3Rpb246ICd1cGxvYWQnLFxuICAgICAgICBsZW5ndGhDb21wdXRhYmxlLFxuICAgICAgICBsb2FkZWQsXG4gICAgICAgIHRvdGFsXG4gICAgICB9KTtcbiAgICAgIGNiKG51bGwsIGNodW5rKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHByb2dyZXNzO1xuICB9O1xuXG4gIGNvbnN0IGJ1ZmZlclRvQ2h1bmtzID0gYnVmZmVyID0+IHtcbiAgICBjb25zdCBjaHVua1NpemUgPSAxNiAqIDEwMjQ7IC8vIGRlZmF1bHQgaGlnaFdhdGVyTWFyayB2YWx1ZVxuICAgIGNvbnN0IGNodW5raW5nID0gbmV3IFN0cmVhbS5SZWFkYWJsZSgpO1xuICAgIGNvbnN0IHRvdGFsTGVuZ3RoID0gYnVmZmVyLmxlbmd0aDtcbiAgICBjb25zdCByZW1haW5kZXIgPSB0b3RhbExlbmd0aCAlIGNodW5rU2l6ZTtcbiAgICBjb25zdCBjdXRvZmYgPSB0b3RhbExlbmd0aCAtIHJlbWFpbmRlcjtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY3V0b2ZmOyBpICs9IGNodW5rU2l6ZSkge1xuICAgICAgY29uc3QgY2h1bmsgPSBidWZmZXIuc2xpY2UoaSwgaSArIGNodW5rU2l6ZSk7XG4gICAgICBjaHVua2luZy5wdXNoKGNodW5rKTtcbiAgICB9XG5cbiAgICBpZiAocmVtYWluZGVyID4gMCkge1xuICAgICAgY29uc3QgcmVtYWluZGVyQnVmZmVyID0gYnVmZmVyLnNsaWNlKC1yZW1haW5kZXIpO1xuICAgICAgY2h1bmtpbmcucHVzaChyZW1haW5kZXJCdWZmZXIpO1xuICAgIH1cblxuICAgIGNodW5raW5nLnB1c2gobnVsbCk7IC8vIG5vIG1vcmUgZGF0YVxuXG4gICAgcmV0dXJuIGNodW5raW5nO1xuICB9O1xuXG4gIC8vIGlmIGEgRm9ybURhdGEgaW5zdGFuY2UgZ290IGNyZWF0ZWQsIHRoZW4gd2Ugc2VuZCB0aGF0IGFzIHRoZSByZXF1ZXN0IGJvZHlcbiAgY29uc3QgZm9ybURhdGEgPSB0aGlzLl9mb3JtRGF0YTtcbiAgaWYgKGZvcm1EYXRhKSB7XG4gICAgLy8gc2V0IGhlYWRlcnNcbiAgICBjb25zdCBoZWFkZXJzID0gZm9ybURhdGEuZ2V0SGVhZGVycygpO1xuICAgIGZvciAoY29uc3QgaSBpbiBoZWFkZXJzKSB7XG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGhlYWRlcnMsIGkpKSB7XG4gICAgICAgIGRlYnVnKCdzZXR0aW5nIEZvcm1EYXRhIGhlYWRlcjogXCIlczogJXNcIicsIGksIGhlYWRlcnNbaV0pO1xuICAgICAgICByZXEuc2V0SGVhZGVyKGksIGhlYWRlcnNbaV0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGF0dGVtcHQgdG8gZ2V0IFwiQ29udGVudC1MZW5ndGhcIiBoZWFkZXJcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaGFuZGxlLWNhbGxiYWNrLWVyclxuICAgIGZvcm1EYXRhLmdldExlbmd0aCgoZXJyLCBsZW5ndGgpID0+IHtcbiAgICAgIC8vIFRPRE86IEFkZCBjaHVua2VkIGVuY29kaW5nIHdoZW4gbm8gbGVuZ3RoIChpZiBlcnIpXG5cbiAgICAgIGRlYnVnKCdnb3QgRm9ybURhdGEgQ29udGVudC1MZW5ndGg6ICVzJywgbGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgbGVuZ3RoID09PSAnbnVtYmVyJykge1xuICAgICAgICByZXEuc2V0SGVhZGVyKCdDb250ZW50LUxlbmd0aCcsIGxlbmd0aCk7XG4gICAgICB9XG5cbiAgICAgIGZvcm1EYXRhLnBpcGUoZ2V0UHJvZ3Jlc3NNb25pdG9yKCkpLnBpcGUocmVxKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmIChCdWZmZXIuaXNCdWZmZXIoZGF0YSkpIHtcbiAgICBidWZmZXJUb0NodW5rcyhkYXRhKVxuICAgICAgLnBpcGUoZ2V0UHJvZ3Jlc3NNb25pdG9yKCkpXG4gICAgICAucGlwZShyZXEpO1xuICB9IGVsc2Uge1xuICAgIHJlcS5lbmQoZGF0YSk7XG4gIH1cbn07XG5cbi8vIENoZWNrIHdoZXRoZXIgcmVzcG9uc2UgaGFzIGEgbm9uLTAtc2l6ZWQgZ3ppcC1lbmNvZGVkIGJvZHlcblJlcXVlc3QucHJvdG90eXBlLl9zaG91bGRVbnppcCA9IHJlcyA9PiB7XG4gIGlmIChyZXMuc3RhdHVzQ29kZSA9PT0gMjA0IHx8IHJlcy5zdGF0dXNDb2RlID09PSAzMDQpIHtcbiAgICAvLyBUaGVzZSBhcmVuJ3Qgc3VwcG9zZWQgdG8gaGF2ZSBhbnkgYm9keVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIGhlYWRlciBjb250ZW50IGlzIGEgc3RyaW5nLCBhbmQgZGlzdGluY3Rpb24gYmV0d2VlbiAwIGFuZCBubyBpbmZvcm1hdGlvbiBpcyBjcnVjaWFsXG4gIGlmIChyZXMuaGVhZGVyc1snY29udGVudC1sZW5ndGgnXSA9PT0gJzAnKSB7XG4gICAgLy8gV2Uga25vdyB0aGF0IHRoZSBib2R5IGlzIGVtcHR5ICh1bmZvcnR1bmF0ZWx5LCB0aGlzIGNoZWNrIGRvZXMgbm90IGNvdmVyIGNodW5rZWQgZW5jb2RpbmcpXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gY29uc29sZS5sb2cocmVzKTtcbiAgcmV0dXJuIC9eXFxzKig/OmRlZmxhdGV8Z3ppcClcXHMqJC8udGVzdChyZXMuaGVhZGVyc1snY29udGVudC1lbmNvZGluZyddKTtcbn07XG5cbi8qKlxuICogT3ZlcnJpZGVzIEROUyBmb3Igc2VsZWN0ZWQgaG9zdG5hbWVzLiBUYWtlcyBvYmplY3QgbWFwcGluZyBob3N0bmFtZXMgdG8gSVAgYWRkcmVzc2VzLlxuICpcbiAqIFdoZW4gbWFraW5nIGEgcmVxdWVzdCB0byBhIFVSTCB3aXRoIGEgaG9zdG5hbWUgZXhhY3RseSBtYXRjaGluZyBhIGtleSBpbiB0aGUgb2JqZWN0LFxuICogdXNlIHRoZSBnaXZlbiBJUCBhZGRyZXNzIHRvIGNvbm5lY3QsIGluc3RlYWQgb2YgdXNpbmcgRE5TIHRvIHJlc29sdmUgdGhlIGhvc3RuYW1lLlxuICpcbiAqIEEgc3BlY2lhbCBob3N0IGAqYCBtYXRjaGVzIGV2ZXJ5IGhvc3RuYW1lIChrZWVwIHJlZGlyZWN0cyBpbiBtaW5kISlcbiAqXG4gKiAgICAgIHJlcXVlc3QuY29ubmVjdCh7XG4gKiAgICAgICAgJ3Rlc3QuZXhhbXBsZS5jb20nOiAnMTI3LjAuMC4xJyxcbiAqICAgICAgICAnaXB2Ni5leGFtcGxlLmNvbSc6ICc6OjEnLFxuICogICAgICB9KVxuICovXG5SZXF1ZXN0LnByb3RvdHlwZS5jb25uZWN0ID0gZnVuY3Rpb24oY29ubmVjdE92ZXJyaWRlKSB7XG4gIGlmICh0eXBlb2YgY29ubmVjdE92ZXJyaWRlID09PSAnc3RyaW5nJykge1xuICAgIHRoaXMuX2Nvbm5lY3RPdmVycmlkZSA9IHsgJyonOiBjb25uZWN0T3ZlcnJpZGUgfTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgY29ubmVjdE92ZXJyaWRlID09PSAnb2JqZWN0Jykge1xuICAgIHRoaXMuX2Nvbm5lY3RPdmVycmlkZSA9IGNvbm5lY3RPdmVycmlkZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLl9jb25uZWN0T3ZlcnJpZGUgPSB1bmRlZmluZWQ7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cblJlcXVlc3QucHJvdG90eXBlLnRydXN0TG9jYWxob3N0ID0gZnVuY3Rpb24odG9nZ2xlKSB7XG4gIHRoaXMuX3RydXN0TG9jYWxob3N0ID0gdG9nZ2xlID09PSB1bmRlZmluZWQgPyB0cnVlIDogdG9nZ2xlO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGdlbmVyYXRlIEhUVFAgdmVyYiBtZXRob2RzXG5pZiAoIW1ldGhvZHMuaW5jbHVkZXMoJ2RlbCcpKSB7XG4gIC8vIGNyZWF0ZSBhIGNvcHkgc28gd2UgZG9uJ3QgY2F1c2UgY29uZmxpY3RzIHdpdGhcbiAgLy8gb3RoZXIgcGFja2FnZXMgdXNpbmcgdGhlIG1ldGhvZHMgcGFja2FnZSBhbmRcbiAgLy8gbnBtIDMueFxuICBtZXRob2RzID0gbWV0aG9kcy5zbGljZSgwKTtcbiAgbWV0aG9kcy5wdXNoKCdkZWwnKTtcbn1cblxubWV0aG9kcy5mb3JFYWNoKG1ldGhvZCA9PiB7XG4gIGNvbnN0IG5hbWUgPSBtZXRob2Q7XG4gIG1ldGhvZCA9IG1ldGhvZCA9PT0gJ2RlbCcgPyAnZGVsZXRlJyA6IG1ldGhvZDtcblxuICBtZXRob2QgPSBtZXRob2QudG9VcHBlckNhc2UoKTtcbiAgcmVxdWVzdFtuYW1lXSA9ICh1cmwsIGRhdGEsIGZuKSA9PiB7XG4gICAgY29uc3QgcmVxID0gcmVxdWVzdChtZXRob2QsIHVybCk7XG4gICAgaWYgKHR5cGVvZiBkYXRhID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBmbiA9IGRhdGE7XG4gICAgICBkYXRhID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoZGF0YSkge1xuICAgICAgaWYgKG1ldGhvZCA9PT0gJ0dFVCcgfHwgbWV0aG9kID09PSAnSEVBRCcpIHtcbiAgICAgICAgcmVxLnF1ZXJ5KGRhdGEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVxLnNlbmQoZGF0YSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGZuKSByZXEuZW5kKGZuKTtcbiAgICByZXR1cm4gcmVxO1xuICB9O1xufSk7XG5cbi8qKlxuICogQ2hlY2sgaWYgYG1pbWVgIGlzIHRleHQgYW5kIHNob3VsZCBiZSBidWZmZXJlZC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbWltZVxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gaXNUZXh0KG1pbWUpIHtcbiAgY29uc3QgcGFydHMgPSBtaW1lLnNwbGl0KCcvJyk7XG4gIGNvbnN0IHR5cGUgPSBwYXJ0c1swXTtcbiAgY29uc3Qgc3VidHlwZSA9IHBhcnRzWzFdO1xuXG4gIHJldHVybiB0eXBlID09PSAndGV4dCcgfHwgc3VidHlwZSA9PT0gJ3gtd3d3LWZvcm0tdXJsZW5jb2RlZCc7XG59XG5cbmZ1bmN0aW9uIGlzSW1hZ2VPclZpZGVvKG1pbWUpIHtcbiAgY29uc3QgdHlwZSA9IG1pbWUuc3BsaXQoJy8nKVswXTtcblxuICByZXR1cm4gdHlwZSA9PT0gJ2ltYWdlJyB8fCB0eXBlID09PSAndmlkZW8nO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGBtaW1lYCBpcyBqc29uIG9yIGhhcyAranNvbiBzdHJ1Y3R1cmVkIHN5bnRheCBzdWZmaXguXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG1pbWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBpc0pTT04obWltZSkge1xuICAvLyBzaG91bGQgbWF0Y2ggL2pzb24gb3IgK2pzb25cbiAgLy8gYnV0IG5vdCAvanNvbi1zZXFcbiAgcmV0dXJuIC9bLytdanNvbigkfFteLVxcd10pLy50ZXN0KG1pbWUpO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIHdlIHNob3VsZCBmb2xsb3cgdGhlIHJlZGlyZWN0IGBjb2RlYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gY29kZVxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGlzUmVkaXJlY3QoY29kZSkge1xuICByZXR1cm4gWzMwMSwgMzAyLCAzMDMsIDMwNSwgMzA3LCAzMDhdLmluY2x1ZGVzKGNvZGUpO1xufVxuIl19