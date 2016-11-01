'use strict';

const webpack = require('webpack')

module.exports = {
  entry: './index.js',
  output: {
    filename: 'postbox.js',
    library: 'Postbox',
    libraryTarget: 'umd'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ["es2015"],
          plugins: ["transform-object-assign"]
        }
      }
    ]
  }
}
