'use strict';

const webpack = require('webpack')

module.exports = {
  entry: {
    'postbox': './index.js',
    'postbox.jquery': './index.jquery.js'
  },
  output: {
    filename: '[name].js',
    library: 'Postbox',
    libraryTarget: 'umd'
  },
  externals: ['jquery'],
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
