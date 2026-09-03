const ci = require('miniprogram-ci');
const fs = require('fs');
const path = require('path');

const appid = 'wxe0ffec0a398de8b7';
const keyPath = path.resolve('./private.key');
const srcPath = path.resolve('./miniprogram-native');
const distPath = path.resolve('./dist-upload');

if (!fs.existsSync(keyPath)) {
  console.error('ERROR: ./private.key 不存在');
  process.exit(1);
}
if (!fs.existsSync(srcPath + '/app.json')) {
  console.error('ERROR: app.json 不存在于 ' + srcPath);
  process.exit(1);
}

/* 关键：上传前强制把源码同步到构建目录。
   历史教训：dist-upload 曾停留在旧快照，导致连续多次「UPLOAD SUCCESS」传的其实都是旧代码。 */
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
}
fs.cpSync(srcPath, distPath, { recursive: true });
if (!fs.existsSync(distPath + '/app.json')) {
  console.error('ERROR: 同步失败，app.json 不存在于 ' + distPath);
  process.exit(1);
}
console.log('[sync] miniprogram-native -> dist-upload 同步完成');

const project = new ci.Project({
  appid: appid,
  type: 'miniProgram',
  projectPath: path.resolve(distPath),
  privateKeyPath: keyPath
});

const now = new Date();
const version = now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0') + '.' + String(now.getHours()).padStart(2,'0') + String(now.getMinutes()).padStart(2,'0');

ci.upload({
  project: project,
  version: version,
  desc: '本地直传 套餐价格后台可配 + 权益中心资料编辑 ' + version,
  setting: { es6: true, es7: true, enhance: true, minify: false },
  robot: 1
}).then(function() {
  console.log('=== UPLOAD SUCCESS === version:', version);
}).catch(function(e) {
  console.error('=== UPLOAD FAIL ===', e.message || e);
  process.exit(1);
});
