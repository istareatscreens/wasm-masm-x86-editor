const path = require('path')
const webpack = require('webpack')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
    devtool: 'inline-source-map',
    mode:'development',
    target: 'web',
    module: {
        rules: [
            {
              test: /\.(tsx?|jsx?)$/,
              use: 'ts-loader',
              exclude: [/node_modules/,/boxedwine/],
            },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js','jsx'],
    },
  };
  