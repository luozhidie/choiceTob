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

ci.preview({
  project,
  version: '1.4.7',
  desc: 'preview 验证有限次数套餐',
  setting: { urlCheck: false, es6: true, minified: false },
  qrcodeFormat: 'image',
  qrcodeOutputDest: '/workspace/choiceTob-new/验证用-开发版预览码.png',
  onProgressUpdate: function(info){ console.log('progress:', info); }
}).then(function(res){
  console.log('=== PREVIEW 成功 ===');
  console.log('qrCodeDataUrl 长度:', res && res.qrCodeDataUrl ? res.qrCodeDataUrl.length : 0);
}).catch(function(e){
  console.error('=== PREVIEW 失败 ===', e.message || e);
  process.exit(1);
});
