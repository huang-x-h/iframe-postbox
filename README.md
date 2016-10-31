# postbox
> A postmessage library inspire by [Postmate](https://github.com/dollarshaveclub/postmate)

## Install

`<script src="yourpath/postbox.min.js></script>`

## Usage

parent.com

```js
var handshake = new Postbox({
  container: document.getElementById('some-div'), // Element to inject iframe into
  url: 'http://child.com/page.html'
});

handshake.then(function(child) {
  child.get('name').then(function(value) {
    alert(value)
  };

  child.on('some-event', function(data) {
    console.log(data)
  };
};
```

child.com/page.html

```js
var handshake = new Postbox.Client({
  name: 'iframe child'
});

handshake.emit('some-event', 'Hello world')
```
## Broser support

IE9+, `Promise` polyfill
