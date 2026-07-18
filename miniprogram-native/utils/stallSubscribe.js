// 档口订阅：服务端（openid）持久化 + 本地兜底
// 用法：var sub = require('../../utils/stallSubscribe.js');
var BASE = 'https://colour-choice.art/api/public/stall-subscriptions';

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

// 本地订阅数组（兜底/离线）
function localIds() {
  return wx.getStorageSync('subscribed_stalls') || [];
}
function saveLocal(ids) {
  wx.setStorageSync('subscribed_stalls', ids);
}

module.exports = {
  getOpenid: getOpenid,
  fetchSubscribedIds: fetchSubscribedIds,
  toggleSubscribe: toggleSubscribe,
  localIds: localIds,
  saveLocal: saveLocal
};
