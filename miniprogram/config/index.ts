import { defineConfig } from '@tarojs/cli';

export default defineConfig({
  projectName: 'luozhidie-choice',
  date: '2026-7-2',
  designWidth: 750,
  deviceRatio: 3,
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [
    ['@tarojs/plugin-framework-react', { reactVersion: '18' }],
    '@tarojs/plugin-platform-h5',
    '@tarojs/plugin-platform-weapp'
  ],
  h5: {
    devServer: {
      port: 10086
    },
    router: {
      mode: 'browser'
    }
  },
  weapp: {
    appid: 'wxe0ffec0a398de8b7',
    compileType: 'miniapp'
  },
  css: {
    postcss: {
      autoprefixer: {}
    }
  }
});
