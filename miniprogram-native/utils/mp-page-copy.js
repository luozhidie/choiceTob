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

// 试衣次数 + 价格 后台可配：用 tryon_packages / virtual_goods_prices 覆盖文案里的次数与价格
// 专业版次数 / 价格均随后台；每个套餐可附 bonusText 赠送文案（如「原100次，加送20次」）
// 注意：virtual_goods_prices 以 productId 为 key（如 tryon_pro_998），与 VIRTUAL_GOODS.productId 对齐
function applyTryonPackages(copy, pkgs, vp) {
  if (!isObj(copy)) return copy;
  var num = function (id, field, fb) {
    var v = pkgs && pkgs[id] && pkgs[id][field];
    return typeof v === "number" ? v : fb;
  };
  var str = function (id, field) {
    var v = pkgs && pkgs[id] && pkgs[id][field];
    return typeof v === "string" ? v : "";
  };
  var fmtYuan = function (fen) {
    var y = Math.round(fen) / 100;
    var s = y.toFixed(2).replace(/\.?0+$/, "");
    return "¥" + s;
  };
  var priceOf = function (productId, fallbackFen) {
    var v = vp && vp[productId];
    var fen = (typeof v === "number") ? v : fallbackFen;
    return fmtYuan(fen);
  };
  var first = num("tryon_first_9_9", "normal", 12);
  var month = num("tryon_normal_month_99", "normal", 120);
  var pro = num("tryon_pro_998", "pro", 100);
  var bonusPro = str("tryon_pro_998", "bonusText");
  var firstPrice = priceOf("tryon_first_9_9", 990);
  var monthPrice = priceOf("tryon_normal_99", 9900);
  var proPrice = priceOf("tryon_pro_998", 99800);
  if (isObj(copy.promo)) {
    if (typeof copy.promo.ctaSub === "string") copy.promo.ctaSub = first + " 次普通试穿 · 限时";
    if (typeof copy.promo.ctaMain === "string") copy.promo.ctaMain = "新人首单 " + firstPrice + " 试穿";
    if (copy.promo.entries && copy.promo.entries[0]) copy.promo.entries[0].sub = "快速看上身 · " + monthPrice + "/月 " + month + " 次";
    if (copy.promo.entries && copy.promo.entries[1]) {
      copy.promo.entries[1].sub = "诊断+搭配 · " + proPrice + "/" + pro + " 次";
      if (bonusPro) copy.promo.entries[1].bonusText = bonusPro;
    }
  }
  if (isObj(copy.normal)) {
    if (typeof copy.normal.pkgFirstSub === "string") copy.normal.pkgFirstSub = first + " 次普通试穿";
    if (typeof copy.normal.pkgMonthSub === "string") copy.normal.pkgMonthSub = "30 天 " + month + " 次普通试穿";
    if (typeof copy.normal.pkgFirstPriceLabel === "string") copy.normal.pkgFirstPriceLabel = firstPrice;
    if (typeof copy.normal.pkgFirstBtn === "string") copy.normal.pkgFirstBtn = "购买 " + firstPrice;
    if (typeof copy.normal.pkgMonthPriceLabel === "string") copy.normal.pkgMonthPriceLabel = monthPrice;
    if (typeof copy.normal.pkgMonthBtn === "string") copy.normal.pkgMonthBtn = "购买 " + monthPrice;
  }
  if (isObj(copy.pro)) {
    if (typeof copy.pro.pkgSub === "string") copy.pro.pkgSub = pro + " 次专业诊断 · 含 14 题风格测试 / 八大风格真人试穿";
    if (bonusPro) copy.pro.bonusText = bonusPro;
    if (typeof copy.pro.pkgPriceLabel === "string") copy.pro.pkgPriceLabel = proPrice;
    if (typeof copy.pro.pkgBtn === "string") copy.pro.pkgBtn = "购买 " + proPrice;
  }
  return copy;
}

// 加载某一页的文案配置，回调返回合并后的对象
function loadMpSection(key, cb) {
  var def = DEFAULTS[key] || {};
  wx.request({
    url: BASE + '/api/public/settings?keys=mp_page_copy,tryon_packages,virtual_goods_prices',
    method: 'GET',
    success: function (res) {
      var d = res.data && res.data.data;
      var data = d && d.mp_page_copy;
      var merged = merge(def, data ? data[key] : undefined);
      var pkgs = d && d.tryon_packages;
      var vp = d && d.virtual_goods_prices;
      if (key === "tryon" && (isObj(pkgs) || isObj(vp))) merged = applyTryonPackages(merged, pkgs || {}, vp || {});
      cb(merged);
    },
    fail: function () {
      cb(def);
    }
  });
}

module.exports = { loadMpSection: loadMpSection, DEFAULTS: DEFAULTS };
