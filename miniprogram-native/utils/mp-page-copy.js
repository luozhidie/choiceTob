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

// 试衣次数后台可配：用 tryon_packages 配置覆盖文案里的次数数字（与后端发放保持一致）
function applyTryonPackages(copy, pkgs) {
  if (!isObj(copy) || !isObj(pkgs)) return copy;
  var num = function (id, field, fb) {
    var v = pkgs[id] && pkgs[id][field];
    return typeof v === "number" ? v : fb;
  };
  var first = num("tryon_first_9_9", "normal", 12);
  var month = num("tryon_normal_month_99", "normal", 120);
  if (typeof copy.ctaSub === "string") copy.ctaSub = first + " 次普通试穿 · 限时";
  if (copy.entries && copy.entries[0]) copy.entries[0].sub = "快速看上身 · ¥99/月 " + month + " 次";
  if (isObj(copy.promo)) {
    if (typeof copy.promo.pkgFirstSub === "string") copy.promo.pkgFirstSub = first + " 次普通试穿";
    if (typeof copy.promo.pkgMonthSub === "string") copy.promo.pkgMonthSub = "30 天 " + month + " 次普通试穿";
  }
  return copy;
}

// 加载某一页的文案配置，回调返回合并后的对象
function loadMpSection(key, cb) {
  var def = DEFAULTS[key] || {};
  wx.request({
    url: BASE + '/api/public/settings?keys=mp_page_copy,tryon_packages',
    method: 'GET',
    success: function (res) {
      var d = res.data && res.data.data;
      var data = d && d.mp_page_copy;
      var merged = merge(def, data ? data[key] : undefined);
      var pkgs = d && d.tryon_packages;
      if (key === "tryon" && isObj(pkgs)) merged = applyTryonPackages(merged, pkgs);
      cb(merged);
    },
    fail: function () {
      cb(def);
    }
  });
}

module.exports = { loadMpSection: loadMpSection, DEFAULTS: DEFAULTS };
