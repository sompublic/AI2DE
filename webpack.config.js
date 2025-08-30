const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';

const mainConfig = {
  entry: './src/main/main.ts',
  target: 'electron-main',
  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? false : 'source-map',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true
          }
        },
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@main': path.resolve(__dirname, 'src/main'),
      '@shared': path.resolve(__dirname, 'src/shared')
    }
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js'
  },
  node: {
    __dirname: false,
    __filename: false
  },
  externals: {
    sqlite3: 'commonjs sqlite3'
  }
};

const preloadConfig = {
  entry: './src/main/preload.ts',
  target: 'electron-preload',
  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? false : 'source-map',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true
          }
        },
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'preload.js'
  }
};

const rendererConfig = {
  entry: './src/renderer/index.tsx',
  target: 'electron-renderer',
  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? false : 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true
          }
        },
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: 'asset/resource'
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@shared': path.resolve(__dirname, 'src/shared')
    }
  },
  output: {
    path: path.resolve(__dirname, 'dist/renderer'),
    filename: 'renderer.js'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
      filename: 'index.html'
    })
  ]
};

module.exports = [mainConfig, preloadConfig, rendererConfig];
