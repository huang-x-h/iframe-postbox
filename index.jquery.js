const MESSAGE = 'message'
let _messageId = 0
const $ = require('jquery')

function resolveOrigin(url) {
  const a = document.createElement('a')
  a.href = url
  return a.origin || `${a.protocol}//${a.hostname}`
}

function resolveValue(model, property) {
  const unwrappedContext = typeof model[property] === 'function'
    ? model[property]() : model[property]
  const defer = $.Deferred()
  defer.resolve(unwrappedContext)
  return defer.promise()
}

function messageUID() {
  return ++_messageId
}

function distrust(e, origin) {
  if (e.origin !== origin) return false
  if (typeof e.data === 'object') return false
  if (!('type' in e.data)) return false
}

class ParentAPI {
  constructor(info) {
    this.parent = info.parent
    this.child = info.child
    this.childOrigin = info.childOrigin
    this.frame = info.frame

    this.events = {}

    this.listener = (e) => {
      if (distrust(e, this.childOrigin)) return

      if (e.data.type === 'emit') {
        const {name, data} = e.data.value
        if (name in this.events) {
          this.events[name].call(this, data)
        }
      }
    }

    $(this.parent).on(MESSAGE, this.listener)
  }

  /**
   * get iframe model property
   * @param property
   * @returns {Promise}
   */
  get(property) {
    const defer = $.Deferred()

    const uid = messageUID()
    const transact = e => {
      if (e.data.type === 'reply' && e.data.uid === uid) {
        $(this.parent).off(MESSAGE, transact)
        defer.resolve(e.data.value);
      }
    }
    $(this.parent).on(MESSAGE, transact)

    this.child.postMessage({
      type: 'request',
      property,
      uid
    }, this.childOrigin)

    return defer.promise()
  }

  /**
   * invoke iframe model function property
   * @param property
   * @param data
   */
  call(property, data) {
    this.child.postMessage({
      type: 'call',
      property,
      data
    }, this.childOrigin)
  }

  /**
   * add iframe event handle
   * @param name
   * @param callback
   */
  on(name, callback) {
    this.events[name] = callback
  }

  /**
   * destroy iframe
   */
  destroy() {
    $(this.parent).off(MESSAGE, this.listener)
    this.frame.parentNode.removeChild(this.frame)
  }
}

class ChildAPI {
  constructor(info) {
    this.parent = info.parent
    this.parentOrigin = info.parentOrigin
    this.child = info.child
    this.model = info.model

    $(this.child).on(MESSAGE, e => {
      if (distrust(e, this.parentOrigin)) return

      const {type, property, uid, data} = e.data
      if (type === 'call') {
        if (property in this.model && typeof this.model[property] === 'function')
          this.model[property].call(this, data)
      } else if (type === 'request') {
        resolveValue(this.model, property).then(value => {
          e.source.postMessage({
            type: 'reply',
            value,
            uid
          }, e.origin)
        })
      }
    })
  }

  /**
   * iframe emit event and data to parent
   * @param name
   * @param data
   */
  emit(name, data) {
    this.parent.postMessage({
      type: 'emit',
      value: {name, data}
    }, this.parentOrigin)
  }
}

class Client {
  /**
   *
   * @param model iframe model
   * @returns {*}
   */
  constructor(model) {
    this.child = window
    this.parent = this.child.parent
    this.model = model
    return this.sendHandshakeReply()
  }

  sendHandshakeReply() {
    const defer = $.Deferred()

    const shake = (e) => {
      if (e.data.type === 'handshake') {
        $(this.child).off(MESSAGE, shake)
        this.parentOrigin = e.origin

        e.source.postMessage({
          type: 'handshake-reply',
        }, e.origin)

        Object.assign(this.model, e.data.model)

        defer.resolve(new ChildAPI(this))
      } else
        defer.reject('Handshake reply failed.')
    }

    $(this.child).on(MESSAGE, shake)

    return defer.promise()
  }
}

class Postbox {
  /**
   *
   * @param options
   * @param options.container element to inject iframe into
   * @param options.url iframe's url
   * @param options.model model send to iframe
   * @returns {*}
   */
  constructor(options) {
    const {container, url, model} = options

    this.parent = window
    this.frame = document.createElement('iframe');
    (container || document.body).appendChild(this.frame)
    this.child = this.frame.contentWindow || this.frame.contentDocument.parentWindow
    this.model = model || {}

    return this.sendHandshake(url)
  }

  sendHandshake(url) {
    const childOrigin = resolveOrigin(url)
    const defer = $.Deferred()

    const reply = (e) => {
      // receive handshake reply from iframe
      if (e.data.type === 'handshake-reply') {
        $(this.parent).off(MESSAGE, reply)
        this.childOrigin = e.origin

        defer.resolve(new ParentAPI(this))
      } else
        defer.reject('Handshake failed')
    }

    $(this.parent).on(MESSAGE, reply)

    // send handshake to iframe
    const loaded = (e) => {
      this.child.postMessage({
        type: 'handshake',
        model: this.model
      }, childOrigin)
    }

    this.frame.onload = loaded
    this.frame.src = url

    return defer.promise()
  }
}

Postbox.Client = Client

module.exports = Postbox
