const path = require('path')
const webpack = require('webpack')

module.exports = {
    devtool: 'inline-source-map',
    mode:'development',
    devtool: 'inline-source-map',
    target: 'web',
    module: {
        rules: [
            {
              test: /\.(tsx?|jsx?)$/,
              use: 'ts-loader',
              exclude: [/node_modules/,/boxedwine/],
            }
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js','jsx'],
    },
  };
  