const webpack = require('webpack');
const path = require('path');

/*
 * SplitChunksPlugin is enabled by default and replaced
 * deprecated CommonsChunkPlugin. It automatically identifies modules which
 * should be splitted of chunk by heuristics using module duplication count and
 * module category (i. e. node_modules). And splits the chunks…
 *
 * It is safe to remove "splitChunks" from the generated configuration
 * and was added as an educational example.
 *
 * https://webpack.js.org/plugins/split-chunks-plugin/
 *
 */

const common = {
  entry: {
    main: './src/',
    register: './src/register'
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json']
  },

  module: {
    rules: [
      {
        include: [path.resolve(__dirname, 'src')],
        loader: 'babel-loader',
        test: /\.[jt]s$/
      }
    ]
  },

  output: {
    library: 'HackforPlayCommon',
    libraryTarget: 'umd'
  },

  optimization: {
    splitChunks: {
      cacheGroups: {
        vendors: {
          priority: -10,
          test: /[\\/]node_modules[\\/]/
        }
      },

      chunks: 'async',
      minChunks: 1,
      minSize: 30000,
      name: false
    }
  },

  devServer: {
    hot: false,
    inline: false,
    contentBase: path.join(__dirname, 'dist'),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*'
    },
    disableHostCheck: true
  }
};

module.exports = [
  {
    ...common,
    mode: 'development',
    output: {
      ...common.output,
      filename: '[name].js'
    }
  },
  {
    ...common,
    mode: 'production',
    output: {
      ...common.output,
      filename: '[name].min.js'
    }
  }
];
