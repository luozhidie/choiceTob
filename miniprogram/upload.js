const ci = require('miniprogram-ci');
const fs = require('fs');

const appid = process.env.WECHAT_APPID;
const keyPath = './private.key';
const distPath = './dist';

console.log(`=== Upload Config ===`);
console.log(`APPID: ${appid}`);
console.log(`Key exists: ${fs.existsSync(keyPath)}`);
console.log(`Dist exists: ${fs.existsSync(distPath)}`);

if (!fs.existsSync(distPath)) {
  console.error('❌ dist目录不存在!');
  process.exit(1);
}
if (!fs.existsSync(keyPath)) {
  console.error('❌ 密钥文件不存在!');
  process.exit(1);
}

const project = new ci.Project({
  appid,
  type: 'miniProgram',
  projectPath: distPath,
  ignoreDevFiles: true,
  privateKeyPath: keyPath
});

console.log('开始上传...');
ci.upload({
  project,
  version: process.env.GITHUB_RUN_NUMBER || '1.0.8',
  desc: 'auto v' + (process.env.GITHUB_RUN_NUMBER || '8'),
  setting: {
    es6: true,
    es7: true,
    enhance: true,
    compileHotReLoad: false,
    autoAudits: false
  },
  robot: 1
}).then(() => {
  console.log('✅ 上传成功!');
}).catch(e => {
  console.error('❌ 上传失败:');
  console.error('  message:', e.message);
  console.error('  errCode:', e.errCode);
  console.error('  errMsg:', e.errMsg);
  console.error('  full:', JSON.stringify(e));
  process.exit(1);
});
