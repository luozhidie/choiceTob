// 风格订阅：服务端（openid）持久化 + 本地兜底
// 用法：var sub = require('../../utils/stallSubscribe.js');
// 本地 key 已迁移到 subscribed_styles，读取时兼容老 key subscribed_stalls；迁移完成即清掉老 key。
// API URL 暂沿用 /api/public/stall-subscriptions；后端入参兼容 stall_id（老）/ style_id（新）。
var BASE = 'https://colour-choice.art/api/public/stall-subscriptions';
var STORAGE_KEY_NEW = 'subscribed_styles';
var STORAGE_KEY_OLD = 'subscribed_stalls';

function getOpenid() {
  var app = getApp();
  if (app && app.getOpenid) return app.getOpenid();
  return Promise.reject(new Error('no getOpenid'));
}

// 返回该 openid 订阅的 stall_id 数组；失败返回 null（调用方回退本地）
function fetchSubscribedIds(openid) {
  return new Promise(function (resolve) {
    if (!openid) { resolve(null); return; }
    wx.request({
      url: BASE + '?openid=' + encodeURIComponent(openid),
      method: 'GET',
      success: function (r) {
        var d = r.data || {};
        if (d.success && Array.isArray(d.data)) resolve(d.data);
        else resolve(null);
      },
      fail: function () { resolve(null); }
    });
  });
}

// isSub=true 订阅，false 取消；返回 Promise
function toggleSubscribe(openid, stallId, isSub) {
  return new Promise(function (resolve, reject) {
    wx.request({
      url: BASE,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { openid: openid, stall_id: stallId, action: isSub ? 'subscribe' : 'unsubscribe' },
      success: function (r) {
        var d = r.data || {};
        if (d.success) resolve(true); else reject(new Error(d.error || '操作失败'));
      },
      fail: function () { reject(new Error('网络错误')); }
    });
  });
}

// 本地订阅数组（兜底/离线）；优先新 key，回退老 key 一次性迁移
function localIds() {
  var n = wx.getStorageSync(STORAGE_KEY_NEW);
  if (Array.isArray(n)) return n;
  var o = wx.getStorageSync(STORAGE_KEY_OLD);
  if (Array.isArray(o)) {
    wx.setStorageSync(STORAGE_KEY_NEW, o); // 迁移
    return o;
  }
  return [];
}
function saveLocal(ids) {
  wx.setStorageSync(STORAGE_KEY_NEW, ids);
  wx.removeStorageSync(STORAGE_KEY_OLD); // 清掉老 key
}

module.exports = {
  getOpenid: getOpenid,
  fetchSubscribedIds: fetchSubscribedIds,
  toggleSubscribe: toggleSubscribe,
  localIds: localIds,
  saveLocal: saveLocal
};
