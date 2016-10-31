'use strict';

const webpack = require('webpack')

module.exports = {
  entry: './index.js',
  output: {
    filename: 'postbox.min.js',
    libraryTarget: 'umd'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel?presets[]=es2015'
      }
    ]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin()
  ]
}
