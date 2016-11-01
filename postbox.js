(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["Postbox"] = factory();
	else
		root["Postbox"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	'use strict';

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var MESSAGE = 'message';
	var _messageId = 0;

	function resolveOrigin(url) {
	  var a = document.createElement('a');
	  a.href = url;
	  return a.origin || a.protocol + '//' + a.hostname;
	}

	function resolveValue(model, property) {
	  var unwrappedContext = typeof model[property] === 'function' ? model[property]() : model[property];
	  return Promise.resolve(unwrappedContext);
	}

	function messageUID() {
	  return ++_messageId;
	}

	function distrust(e, origin) {
	  if (e.origin !== origin) return false;
	  if (_typeof(e.data) === 'object') return false;
	  if (!('type' in e.data)) return false;
	}

	var ParentAPI = function () {
	  function ParentAPI(info) {
	    var _this = this;

	    _classCallCheck(this, ParentAPI);

	    this.parent = info.parent;
	    this.child = info.child;
	    this.childOrigin = info.childOrigin;
	    this.frame = info.frame;

	    this.events = {};

	    this.listener = function (e) {
	      if (distrust(e, _this.childOrigin)) return;

	      if (e.data.type === 'emit') {
	        var _e$data$value = e.data.value,
	            name = _e$data$value.name,
	            data = _e$data$value.data;

	        if (name in _this.events) {
	          _this.events[name].call(_this, data);
	        }
	      }
	    };

	    this.parent.addEventListener(MESSAGE, this.listener, false);
	  }

	  /**
	   * get iframe model property
	   * @param property
	   * @returns {Promise}
	   */


	  _createClass(ParentAPI, [{
	    key: 'get',
	    value: function get(property) {
	      var _this2 = this;

	      return new Promise(function (resolve, reject) {
	        var uid = messageUID();
	        var transact = function transact(e) {
	          if (e.data.type === 'reply' && e.data.uid === uid) {
	            _this2.parent.removeEventListener(MESSAGE, transact, false);
	            resolve(e.data.value);
	          }
	        };
	        _this2.parent.addEventListener(MESSAGE, transact, false);

	        _this2.child.postMessage({
	          type: 'request',
	          property: property,
	          uid: uid
	        }, _this2.childOrigin);
	      });
	    }

	    /**
	     * invoke iframe model function property
	     * @param property
	     * @param data
	     */

	  }, {
	    key: 'call',
	    value: function call(property, data) {
	      this.child.postMessage({
	        type: 'call',
	        property: property,
	        data: data
	      }, this.childOrigin);
	    }

	    /**
	     * add iframe event handle
	     * @param name
	     * @param callback
	     */

	  }, {
	    key: 'on',
	    value: function on(name, callback) {
	      this.events[name] = callback;
	    }

	    /**
	     * destroy iframe
	     */

	  }, {
	    key: 'destroy',
	    value: function destroy() {
	      this.parent.removeEventListener(MESSAGE, this.listener, false);
	      this.frame.parentNode.removeChild(this.frame);
	    }
	  }]);

	  return ParentAPI;
	}();

	var ChildAPI = function () {
	  function ChildAPI(info) {
	    var _this3 = this;

	    _classCallCheck(this, ChildAPI);

	    this.parent = info.parent;
	    this.parentOrigin = info.parentOrigin;
	    this.child = info.child;
	    this.model = info.model;

	    this.child.addEventListener(MESSAGE, function (e) {
	      if (distrust(e, _this3.parentOrigin)) return;

	      var _e$data = e.data,
	          type = _e$data.type,
	          property = _e$data.property,
	          uid = _e$data.uid,
	          data = _e$data.data;

	      if (type === 'call') {
	        if (property in _this3.model && typeof _this3.model[property] === 'function') _this3.model[property].call(_this3, data);
	      } else if (type === 'request') {
	        resolveValue(_this3.model, property).then(function (value) {
	          e.source.postMessage({
	            type: 'reply',
	            value: value,
	            uid: uid
	          }, e.origin);
	        });
	      }
	    }, false);
	  }

	  /**
	   * iframe emit event and data to parent
	   * @param name
	   * @param data
	   */


	  _createClass(ChildAPI, [{
	    key: 'emit',
	    value: function emit(name, data) {
	      this.parent.postMessage({
	        type: 'emit',
	        value: { name: name, data: data }
	      }, this.parentOrigin);
	    }
	  }]);

	  return ChildAPI;
	}();

	var Client = function () {
	  /**
	   *
	   * @param model iframe model
	   * @returns {*}
	   */
	  function Client(model) {
	    _classCallCheck(this, Client);

	    this.child = window;
	    this.parent = this.child.parent;
	    this.model = model;
	    return this.sendHandshakeReply();
	  }

	  _createClass(Client, [{
	    key: 'sendHandshakeReply',
	    value: function sendHandshakeReply() {
	      var _this4 = this;

	      return new Promise(function (resolve, reject) {
	        var shake = function shake(e) {
	          if (e.data.type === 'handshake') {
	            _this4.child.removeEventListener(MESSAGE, shake, false);
	            _this4.parentOrigin = e.origin;

	            e.source.postMessage({
	              type: 'handshake-reply'
	            }, e.origin);

	            _extends(_this4.model, e.data.model);

	            resolve(new ChildAPI(_this4));
	          } else reject('Handshake reply failed.');
	        };

	        _this4.child.addEventListener(MESSAGE, shake, false);
	      });
	    }
	  }]);

	  return Client;
	}();

	var Postbox = function () {
	  /**
	   *
	   * @param options
	   * @param options.container element to inject iframe into
	   * @param options.url iframe's url
	   * @param options.model model send to iframe
	   * @returns {*}
	   */
	  function Postbox(options) {
	    _classCallCheck(this, Postbox);

	    var container = options.container,
	        url = options.url,
	        model = options.model;


	    this.parent = window;
	    this.frame = document.createElement('iframe');
	    (container || document.body).appendChild(this.frame);
	    this.child = this.frame.contentWindow || this.frame.contentDocument.parentWindow;
	    this.model = model || {};

	    return this.sendHandshake(url);
	  }

	  _createClass(Postbox, [{
	    key: 'sendHandshake',
	    value: function sendHandshake(url) {
	      var _this5 = this;

	      var childOrigin = resolveOrigin(url);
	      return new Promise(function (resolve, reject) {
	        var reply = function reply(e) {

	          // receive handshake reply from iframe
	          if (e.data.type === 'handshake-reply') {
	            _this5.parent.removeEventListener(MESSAGE, reply, false);
	            _this5.childOrigin = e.origin;

	            resolve(new ParentAPI(_this5));
	          } else reject('Handshake failed');
	        };

	        _this5.parent.addEventListener(MESSAGE, reply, false);

	        // send handshake to iframe
	        var loaded = function loaded(e) {
	          _this5.child.postMessage({
	            type: 'handshake',
	            model: _this5.model
	          }, childOrigin);
	        };

	        _this5.frame.onload = loaded;
	        _this5.frame.src = url;
	      });
	    }
	  }]);

	  return Postbox;
	}();

	Postbox.Client = Client;

	module.exports = Postbox;

/***/ }
/******/ ])
});
;