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

// 修复 Taro v4 编译 bug: comp 组件无限自引用导致页面空白
const compJsonPath = `${distPath}/comp.json`;
if (fs.existsSync(compJsonPath)) {
  try {
    const compJson = JSON.parse(fs.readFileSync(compJsonPath, 'utf8'));
    if (compJson.usingComponents && compJson.usingComponents.comp) {
      delete compJson.usingComponents.comp;
      fs.writeFileSync(compJsonPath, JSON.stringify(compJson));
      console.log('✅ 已修复 comp.json 自引用问题');
    }
  } catch(e) {
    console.log('⚠️ comp.json 修复跳过:', e.message);
  }
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
