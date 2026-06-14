/**
 * Taro 4.2 项目配置（CommonJS，避免被 webpack 编译）
 */
const { defineConfig } = require('@tarojs/taro')

module.exports = defineConfig({
  projectName: 'luozhidie-choice',
  date: '2026-5-21',
  designWidth: 750,
  deviceRatio: { 640: 2.34 / 2, 750: 1, 375: 2, 828: 1.81 / 2 },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [],
  defineConstants: {},
  copy: { patterns: [], options: {} },
  framework: 'react',
  compiler: 'webpack5',
  cache: { enable: false },
  mini: {
    postcss: {
      pxtransform: { enable: true, config: {} },
      cssModules: { enable: false, config: { namingPattern: 'module', generateScopedName: '[name]__[local]___[hash:base64:5]' } }
    },
    optimizeMainPackage: { enable: false },
    webpackChain(chain) {
      chain.plugins.delete('progressPlugin')
      chain.plugins.delete('ProgressPlugin')
    }
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    postcss: {
      autoprefixer: { enable: true, config: {} },
      cssModules: { enable: false, config: { namingPattern: 'module', generateScopedName: '[name]__[local]___[hash:base64:5]' } }
    }
  }
})
