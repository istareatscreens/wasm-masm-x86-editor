const path = require('path')
const webpack = require('webpack')

module.exports = {
  entry:{
    "index-bw": './src/js/components/boxedwine/index-bw.jsx',
    "index-editor": './src/js/components/editor/index-editor.jsx'
    },
    output:{
      filename:'[name].js'
    },
    devtool: 'inline-source-map',
    mode:'development',
    target: 'web',
    module: {
        rules: [
            {
              test: /\.(tsx?|jsx?)$/,
              use: 'ts-loader',
              exclude: /node_modules/,
            }
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js','jsx'],
    },
  };
  