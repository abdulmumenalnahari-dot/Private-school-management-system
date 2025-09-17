// craco.config.js
const webpack = require("webpack");

module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          http: require.resolve("stream-http"),
          https: require.resolve("https-browserify"),
          url: require.resolve("url/"),
          stream: require.resolve("stream-browserify"),
          util: require.resolve("util/"),
          zlib: require.resolve("browserify-zlib"),
          crypto: require.resolve("crypto-browserify"),
          assert: require.resolve("assert/"),
        },
      },
    },
  },
};
netlify.toml