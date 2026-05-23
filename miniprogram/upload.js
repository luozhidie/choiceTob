const ci = require('miniprogram-ci');

(async () => {
  const project = new ci.Project({
    appid: 'wxe0ffec0a398de8b7',
    type: 'miniProgram',
    projectPath: '/workspace/miniprogram/frontend/dist',
    privateKeyPath: '/workspace/miniprogram/upload-private.key',
    ignores: ['node_modules/**/*'],
  });

  try {
    const uploadResult = await ci.upload({
      project,
      version: '1.0.0',
      desc: '骆芷蝶智选 初版',
      setting: {
        es6: true,
        es7: true,
        minify: true,
        codeProtect: false,
        minifyWXML: true,
        minifyWXSS: true,
        minifyJS: true,
      },
    });
    console.log('上传成功！', JSON.stringify(uploadResult, null, 2));
  } catch (err) {
    console.error('上传失败：', err.message || err);
    if (err.message && err.message.includes('ip')) {
      console.error('\n⚠️  IP 白名单未配置！请在小程序后台添加 IP: 152.136.104.182');
    }
  }
})();
