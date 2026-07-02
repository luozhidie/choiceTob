const ci = require('miniprogram-ci');
const fs = require('fs');

const appid = process.env.WECHAT_APPID || '';
const keyPath = './private.key';
// 支持从命令行参数传入 dist 路径
const distPath = process.argv[2] || './dist';

console.log(`=== Upload Config ===`);
console.log(`APPID: ${appid ? '已配置' : '未配置!'}`);
console.log(`Dist: ${distPath}`);
console.log(`Key exists: ${fs.existsSync(keyPath)}`);
console.log(`Dist exists: ${fs.existsSync(distPath)}`);
if (fs.existsSync(distPath)) {
  console.log(`app.json exists: ${fs.existsSync(`${distPath}/app.json`)}`);
}

if (!fs.existsSync(distPath)) {
  console.error('❌ dist目录不存在!');
  process.exit(1);
}
if (!fs.existsSync(keyPath)) {
  console.error('❌ 密钥文件不存在!');
  process.exit(1);
}
if (!fs.existsSync(`${distPath}/app.json`)) {
  console.error('❌ app.json不存在，编译可能失败!');
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
  version: process.env.GITHUB_RUN_NUMBER || '1.0.10',
  desc: 'auto v' + (process.env.GITHUB_RUN_NUMBER || '10'),
  setting: {
    es6: true, es7: true, enhance: true,
    compileHotReLoad: false, autoAudits: false
  },
  robot: 1
}).then(() => console.log('✅ 上传成功!')).catch(e => {
  console.error('❌ 上传失败:');
  console.error('  message:', e.message);
  console.error('  errCode:', e.errCode);
  console.error('  errMsg:', e.errMsg);
  process.exit(1);
});
