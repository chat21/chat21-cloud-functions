'use strict';

var stream = require('stream');
var util = require('util');

/**
 * Node v0.10+ uses native Transform.
 * Need a polyfill for older versions.
 *
 * @type {Function}
 */

var Transform = stream.Transform || require('readable-stream').Transform;

/**
 * Exit constructor.
 *
 * @param {Object} options
 */

function Exit(options) {
  Transform.call(this, options);
}

/**
 * Inherit from `Transform`.
 */

util.inherits(Exit, Transform);

var exitProto = Exit.prototype;

exitProto._transform = function (c, e, cb) { cb(); };
exitProto._flush = function (cb) {
  cb();
  process.exit(0);
};

module.exports = function () {
  return new Exit({ objectMode: true });
};
