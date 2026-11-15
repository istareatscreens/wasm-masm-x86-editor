const common = require("./webpack.common");
const { merge } = require("webpack-merge");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = merge(common, {
  mode: "production",
  devtool: false,
  output: {
    // The lazy chunks (hex viewer, brotli) named by content, as the images are. The bundles that load them are
    // versioned by their pages (scripts/asset-versions.cjs); a chunk under a fixed name could come from an older
    // build in the HTTP cache and break the bundle loading it.
    chunkFilename: "[name].[contenthash:10].js",
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
});
