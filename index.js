const MESSAGE = 'message'

function resolveOrigin(url) {
  const a = document.createElement('a')
  a.href = url
  return a.origin || `${a.protocol}//${a.hostname}`
}

function resolveValue(model, property) {
  const unwrappedContext = typeof model[property] === 'function'
    ? model[property]() : model[property];
  return Promise.resolve(unwrappedContext);
}

function distrust(e, origin) {
  return e.origin !== origin
}

class ParentAPI {
  constructor(info) {
    this.parent = info.parent
    this.child = info.child
    this.childOrigin = info.childOrigin
    this.frame = info.frame

    this.listener = (e) => {
      if (distrust(e, this.childOrigin)) return

      if (e.data.type === 'emit') {
        const {name, data} = e.data
        if (name in this.events) {
          this.events[name].call(this, data)
        }
      }
    }

    this.parent.addEventListener(MESSAGE, this.listener, false)
  }

  /**
   * get iframe model property
   * @param property
   * @returns {Promise}
   */
  get(property) {
    return new Promise((resolve, reject) => {
      const transact = e => {
        if (e.data.type === 'reply') {
          this.parent.removeEventListener(MESSAGE, transact, false);
          resolve(e.data.value);
        }
      }
      this.parent.addEventListener(MESSAGE, transact, false)

      this.child.postMessage({
        type: 'request',
        property
      }, this.childOrigin)
    })
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
    this.parent.removeEventListener(MESSAGE, this.listener, false)
    this.frame.parentNode.removeChild(this.frame)
  }
}

class ChildAPI {
  constructor(info) {
    this.parent = info.parent
    this.parentOrigin = info.parentOrigin

    this.child.addEventListener(MESSAGE, e => {
      if (distrust(e, this.parentOrigin)) return

      if (e.data.type === 'call') {
        if (property in this.model && typeof this.model[property] === 'function')
          this.model[property].call(this, data)
      } else if (e.data.type === 'request') {
        resolveValue(this.model, e.data.prototype).then(value => {
          e.source.postMessage({
            type: 'reply',
            value
          }, e.origin)
        })
      }
    }, false)
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
    return new Promise((resolve, reject) => {
      const shake = (e) => {
        if (e.data.type === 'handshake') {
          this.child.removeEventListener(MESSAGE, shake, false)
          this.parentOrigin = e.origin

          e.source.postMessage({
            type: 'handshake-reply',
          }, e.origin)

          Object.assign(this.model, e.data.model)

          resolve(new ChildAPI(this))
        } else
          reject('Handshake reply failed.')
      }

      this.child.addEventListener(MESSAGE, shake, false)
    })
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
    this.frame = document.createElement('iframe')
    (container || document.body).appendChild(this.frame)
    this.child = this.frame.contentWindow || this.frame.contentDocument.parentWindow
    this.model = model || {}

    return this.sendHandshake(url)
  }

  sendHandshake(url) {
    const childOrigin = resolveOrigin(url)
    return new Promise((resolve, reject) => {
      const reply = (e) => {

        // receive handshake reply from iframe
        if (e.data.type === 'handshake-reply') {
          this.parent.removeEventListener(MESSAGE, reply, false)
          this.childOrigin = e.origin

          resolve(new ParentAPI(this))
        } else
          reject('Handshake failed')
      }

      this.parent.addEventListener(MESSAGE, reply, false)

      // send handshake to iframe
      const loaded = (e) => {
        this.child.postMessage({
          type: 'handshake',
          model: this.model
        }, childOrigin)
      }

      this.frame.onload = loaded
      this.frame.src = url
    })
  }
}

Postbox.Client = Client

export default Postbox
