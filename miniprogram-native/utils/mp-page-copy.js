// 小程序页面文案加载器：从后台 /api/public/settings 读取 mp_page_copy
// 每个页面只取自己那一段（member / newcustomer / tryon），后台改了实时覆盖默认值。
var BASE = 'https://colour-choice.art';
var DEFAULTS = require('./mp-page-copy-defaults.js');

function isObj(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

// 深合并：base 为默认值（结构骨架），ext 为后台返回（优先级更高）
function merge(base, ext) {
  if (Array.isArray(base)) return Array.isArray(ext) ? ext : base;
  if (!isObj(base)) return (ext === undefined ? base : ext);
  var out = {};
  for (var k in base) {
    out[k] = merge(base[k], ext ? ext[k] : undefined);
  }
  if (ext && isObj(ext)) {
    for (var k2 in ext) {
      if (!(k2 in out)) out[k2] = ext[k2];
    }
  }
  return out;
}

// 加载某一页的文案配置，回调返回合并后的对象
function loadMpSection(key, cb) {
  var def = DEFAULTS[key] || {};
  wx.request({
    url: BASE + '/api/public/settings?keys=mp_page_copy',
    method: 'GET',
    success: function (res) {
      var data = res.data && res.data.data && res.data.data.mp_page_copy;
      cb(merge(def, data ? data[key] : undefined));
    },
    fail: function () {
      cb(def);
    }
  });
}

module.exports = { loadMpSection: loadMpSection, DEFAULTS: DEFAULTS };
