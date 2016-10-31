const MESSAGE = 'message'

function resolveOrigin(url) {
  const a = document.createElement('a')
  a.href = url
  return a.origin || `${a.protocol}//${a.hostname}`
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

  call(property, data) {
    this.child.postMessage({
      type: 'call',
      property,
      data
    }, this.childOrigin)
  }

  on(name, callback) {
    this.events[name] = callback
  }

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
        this.model[property].call(this, data)
      }
    }, false)
  }

  emit(name, data) {
    this.parent.postMessage({
      type: 'emit',
      value: {name, data}
    }, this.parentOrigin)
  }
}

class Client {
  constructor() {
    this.child = window
    this.parent = this.child.parent
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

          resolve(new ChildAPI(this))
        } else
          reject('Handshake reply failed.')
      }

      this.child.addEventListener(MESSAGE, shake, false)
    })
  }
}

class Postbox {
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

        if (e.data.type === 'handshake-reply') {
          this.parent.removeEventListener(MESSAGE, reply, false)
          this.childOrigin = e.origin

          resolve(new ParentAPI(this))
        } else
          reject('Handshake failed')
      }

      this.parent.addEventListener(MESSAGE, reply, false)

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
