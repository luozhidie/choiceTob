const ci = require('miniprogram-ci');
const path = require('path');

const appid = 'wxe0ffec0a398de8b7';
const projectPath = '/workspace/choiceTob-new/miniprogram-native';
const privateKeyPath = '/workspace/choiceTob-new/upload_key.pem';

const project = new ci.Project({
  appid,
  type: 'miniProgram',
  projectPath,
  privateKeyPath,
  ignores: ['node_modules/**/*', '.git/**/*', '**/*.map'],
});

const version = '1.4.6';
const desc = 'fix: 专业版移除色彩季型，仅保留穿衣风格诊断';

ci.upload({
  project,
  version,
  desc,
  setting: {
    urlCheck: false,
    es6: true,
    minified: true,
    uploadWithSourceMap: true,
  },
})
  .then((res) => {
    console.log('✅ 上传成功');
    console.log('体验版二维码(base64)已生成，长度:', (res && res.qrCodeDataUrl ? res.qrCodeDataUrl.length : 0));
    if (res && res.qrCodeDataUrl) {
      const fs = require('fs');
      const b64 = res.qrCodeDataUrl.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync('/workspace/choiceTob-new/体验版小程序码-新.png', Buffer.from(b64, 'base64'));
      console.log('已保存体验版小程序码到 /workspace/choiceTob-new/体验版小程序码-新.png');
    }
    console.log(JSON.stringify(res, null, 2));
  })
  .catch((err) => {
    console.error('❌ 上传失败:', err);
    process.exit(1);
  });
