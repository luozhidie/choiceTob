const ci = require('miniprogram-ci');
const fs = require('fs');
const path = require('path');

const appid = process.env.WECHAT_APPID || '';
const keyPath = './private.key';
const distPath = './dist';
const sourcePath = path.resolve(__dirname, '../miniprogram-native');

if (!appid) {
  console.error('❌ 缺少环境变量 WECHAT_APPID');
  process.exit(1);
}

if (!fs.existsSync(keyPath)) {
  console.error('❌ 缺少上传密钥文件:', keyPath);
  process.exit(1);
}

// 清理并重建 dist
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
}
fs.mkdirSync(distPath, { recursive: true });

// 复制完整原生小程序源码
fs.cpSync(sourcePath, distPath, { recursive: true, dereference: true });

console.log('✅ 原生小程序代码已复制到 dist，开始上传...');
console.log('   来源:', sourcePath);
console.log('   目标:', distPath);

const project = new ci.Project({
  appid: appid,
  type: 'miniProgram',
  projectPath: distPath,
  ignoreDevFiles: true,
  privateKeyPath: keyPath
});

const version = process.env.GITHUB_RUN_NUMBER || process.env.WECHAT_UPLOAD_VERSION || String(Date.now()).slice(0, 10);

ci.upload({
  project: project,
  version: version,
  desc: 'native ' + (process.env.GITHUB_RUN_NUMBER ? 'v' + process.env.GITHUB_RUN_NUMBER : 'manual') + ' auto upload',
  setting: { es6: true, es7: true, enhance: true, compileHotReload: false, autoAudit: false },
  robot: 1
}).then(function() {
  console.log('✅ 上传成功！');
}).catch(function(e) {
  console.error('❌ 上传失败:', e.message);
  process.exit(1);
});
