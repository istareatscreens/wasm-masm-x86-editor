const path = require('path')
const webpack = require('webpack')

module.exports = {
    devtool: 'inline-source-map',
    module: {
      rules: [
        {
            test: /\.(js|jsx)$/,
            exclude: /(node_modules|bower_components)/,
            loader: "babel-loader",
            options: { presets: ["@babel/env"] }
          },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js','jsx'],
    },
  };
  