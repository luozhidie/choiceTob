const ci = require('miniprogram-ci');
const fs = require('fs');
const path = require('path');

const appid = 'wxe0ffec0a398de8b7';
const keyPath = path.resolve('./private.key');
const distPath = path.resolve('./dist-upload');

if (!fs.existsSync(keyPath)) {
  console.error('ERROR: ./private.key 不存在');
  process.exit(1);
}
if (!fs.existsSync(distPath + '/app.json')) {
  console.error('ERROR: app.json 不存在于 ' + distPath);
  process.exit(1);
}

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
  desc: '本地直传 AI试衣入口 fix ' + version,
  setting: { es6: true, es7: true, enhance: true, minify: false },
  robot: 1
}).then(function() {
  console.log('=== UPLOAD SUCCESS === version:', version);
}).catch(function(e) {
  console.error('=== UPLOAD FAIL ===', e.message || e);
  process.exit(1);
});
