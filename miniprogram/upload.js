const ci = require('miniprogram-ci');
const fs = require('fs');
const path = require('path');

const appid = process.env.WECHAT_APPID || '';
const keyPath = './private.key';
const distPath = process.argv[2] || './dist';

console.log(`=== Upload Config ===`);
console.log(`APPID: ${appid ? '已配置' : '未配置!'}`);
console.log(`Dist: ${distPath}`);

if (!fs.existsSync(distPath) || !fs.existsSync(keyPath) || !fs.existsSync(`${distPath}/app.json`)) {
  console.error('❌ 必要文件不存在!');
  process.exit(1);
}

// ========== 一刀切修复 Taro v4 编译 bug ==========

// 1. 重写 app.wxss（原始版本有 font-size:NaNrpx 等异常值导致解析失败）
const wxssContent = `
page {
  background-color: #f8f7f4;
  color: #333;
  font-size: 14px;
}
`;
const appWxssPath = path.join(distPath, 'app.wxss');
if (fs.existsSync(appWxssPath)) {
  fs.writeFileSync(appWxssPath, wxssContent);
  console.log('✅ 已重写 app.wxss（清除异常值）');
}

// 2. 删除所有 comp.json 自引用
function fixAllJson(dir) {
  // 处理 comp.json
  const compPath = path.join(dir, 'comp.json');
  if (fs.existsSync(compPath)) {
    try {
      const j = JSON.parse(fs.readFileSync(compPath, 'utf8'));
      if (j.usingComponents && j.usingComponents.comp) delete j.usingComponents.comp;
      fs.writeFileSync(compPath, JSON.stringify(j));
      console.log('✅ 修复:', compPath);
    } catch(e) {}
  }
  // 处理所有 index.json — 删除 comp 引用
  const indexPath = path.join(dir, 'index.json');
  if (fs.existsSync(indexPath)) {
    try {
      const j = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      if (j.usingComponents) delete j.usingComponents;
      fs.writeFileSync(indexPath, JSON.stringify(j));
      console.log('✅ 修复:', indexPath);
    } catch(e) {}
  }
  // 递归子目录
  try {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      if (item.isDirectory() && !['node_modules', '.git'].includes(item.name)) {
        fixAllJson(path.join(dir, item.name));
      }
    }
  } catch(e) {}
}

console.log('🔧 执行一刀切修复...');
fixAllJson(distPath);

// ========== 开始上传 ==========
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
  version: process.env.GITHUB_RUN_NUMBER || '1',
  desc: 'auto v' + (process.env.GITHUB_RUN_NUMBER || '1'),
  setting: { es6: true, es7: true, enhance: true, compileHotReLoad: false, autoAudits: false },
  robot: 1
}).then(() => console.log('✅ 上传成功!')).catch(e => {
  console.error('❌ 上传失败:', e.message);
  process.exit(1);
});
