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
const path = require('path');
function fixCompJson(dir) {
  const compJsonPath = path.join(dir, 'comp.json');
  if (fs.existsSync(compJsonPath)) {
    try {
      const compJson = JSON.parse(fs.readFileSync(compJsonPath, 'utf8'));
      let changed = false;
      if (compJson.usingComponents && compJson.usingComponents.comp) {
        delete compJson.usingComponents.comp;
        changed = true;
      }
      if (changed) {
        fs.writeFileSync(compJsonPath, JSON.stringify(compJson, null, 2));
        console.log('✅ 已修复 comp.json 自引用问题:', compJsonPath);
      }
    } catch(e) {
      console.log('⚠️ comp.json 修复跳过:', e.message);
    }
  }
  // 递归修复子目录
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      if (item.isDirectory() && item.name !== 'node_modules') {
        fixCompJson(path.join(dir, item.name));
      }
    }
  } catch(e) {}
}

console.log('🔧 修复 comp.json 自引用 + 页面 comp 引用...');
fixCompJson(distPath);

// 额外修复：所有页面的 index.json 里的 comp 引用（Taro v4 bug）
const path = require('path');
function fixPageIndexJson(dir) {
  const indexPath = path.join(dir, 'index.json');
  if (fs.existsSync(indexPath)) {
    try {
      const json = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      if (json.usingComponents && json.usingComponents.comp) {
        delete json.usingComponents.comp;
        // 如果 usingComponents 空了就删掉整个字段
        if (Object.keys(json.usingComponents).length === 0) {
          delete json.usingComponents;
        }
        fs.writeFileSync(indexPath, JSON.stringify(json, null, 2));
        console.log('✅ 已修复页面 index.json comp 引用:', indexPath);
      }
    } catch(e) {}
  }
  // 递归子目录
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      if (item.isDirectory() && item.name !== 'node_modules' && item.name !== '.git') {
        fixPageIndexJson(path.join(dir, item.name));
      }
    }
  } catch(e) {}
}
console.log('🔧 修复页面 index.json comp 引用...');
fixPageIndexJson(distPath);

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
