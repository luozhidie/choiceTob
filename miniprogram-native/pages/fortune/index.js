var app = getApp();

// 任务配置（与后端 TASKS 对应）
var TASKS = [
  { key: 'know_activity', label: '平台活动提前知（秋款上新福利）', icon: '📣', type: 'once' },
  { key: 'subscribe_stall', label: '订阅档口领财富值', icon: '🔔', type: 'once' },
  { key: 'order_rebate', label: '下单返运费', icon: '🛒', type: 'daily' },
  { key: 'official_group', label: '加入一手店主官方福利群', icon: '👥', type: 'once', nav: '/pages/group/index' },
  { key: 'browse_spot', label: '浏览现货 15s', icon: '👀', type: 'daily' },
  { key: 'browse_hot', label: '浏览档口最爆款 15s', icon: '🔥', type: 'daily' },
  { key: 'market_new', label: '每日看市场新款', icon: '✨', type: 'daily' },
  { key: 'browse_invite', label: '浏览邀请 30s', icon: '🔗', type: 'daily' }
];

var CHECKIN_LABELS = ['一', '二', '三', '四', '五', '六', '日'];
var CHECKIN_REWARDS = [100, 200, 300, 500, 800, 1000, 1600];
var EXCHANGE_COST = 3000;

Page({
  data: {
    loading: true,
    notLogin: false,
    wealth_score: 0,
    check_in_streak: 0,
    checkedToday: false,
    weekChecks: [],
    checkinLabels: CHECKIN_LABELS,
    checkinRewards: CHECKIN_REWARDS,
    tasks: [],
    canExchange: false,
    exchangeCost: EXCHANGE_COST
  },

  onShow: function () { this.loadState(); },

  loadState: function () {
    var t = this;
    var token = wx.getStorageSync('token') || '';
    if (!token) { t.setData({ loading: false, notLogin: true }); return; }
    t.setData({ loading: true, notLogin: false });
    wx.request({
      url: 'https://colour-choice.art/api/fortune',
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + token },
      success: function (r) {
        var d = (r.data || {}).data || {};
        var doneMap = {};
        (d.tasksDoneToday || []).forEach(function (k) { doneMap[k] = true; });
        (d.tasksDoneOnce || []).forEach(function (k) { doneMap[k] = true; });
        var weekCheckedCount = Math.min((d.weekChecks || []).length, 7);
        var tasks = TASKS.map(function (tk) {
          return Object.assign({}, tk, {
            done: !!doneMap[tk.key],
            btn: tk.nav ? '去加群' : '完成'
          });
        });
        t.setData({
          loading: false,
          wealth_score: d.wealth_score || 0,
          check_in_streak: d.check_in_streak || 0,
          checkedToday: !!d.checkedToday,
          weekChecks: d.weekChecks || [],
          weekCheckedCount: weekCheckedCount,
          tasks: tasks,
          canExchange: (d.wealth_score || 0) >= EXCHANGE_COST
        });
      },
      fail: function () { t.setData({ loading: false }); }
    });
  },

  doCheckIn: function () {
    var t = this;
    if (t.data.checkedToday) return;
    var token = wx.getStorageSync('token') || '';
    wx.request({
      url: 'https://colour-choice.art/api/fortune',
      method: 'POST',
      header: { 'Authorization': 'Bearer ' + token, 'content-type': 'application/json' },
      data: { action: 'check-in' },
      success: function (r) {
        if (r.data && r.data.success) {
          t.loadState();
          wx.showToast({ title: '签到 +' + r.data.gained, icon: 'none' });
        } else {
          wx.showToast({ title: (r.data && r.data.error) || '签到失败', icon: 'none' });
        }
      }
    });
  },

  doTask: function (e) {
    var key = e.currentTarget.dataset.key;
    var nav = e.currentTarget.dataset.nav;
    if (nav) { wx.navigateTo({ url: nav }); return; }
    var t = this;
    var token = wx.getStorageSync('token') || '';
    wx.request({
      url: 'https://colour-choice.art/api/fortune',
      method: 'POST',
      header: { 'Authorization': 'Bearer ' + token, 'content-type': 'application/json' },
      data: { action: 'complete-task', task_key: key },
      success: function (r) {
        if (r.data && r.data.success) {
          t.loadState();
          wx.showToast({ title: '+' + r.data.gained + ' 财运值', icon: 'none' });
        } else {
          wx.showToast({ title: (r.data && r.data.error) || '操作失败', icon: 'none' });
        }
      }
    });
  },

  doExchange: function () {
    var t = this;
    if (!t.data.canExchange) {
      wx.showToast({ title: '财运值满 ' + EXCHANGE_COST + ' 可兑换', icon: 'none' });
      return;
    }
    var token = wx.getStorageSync('token') || '';
    wx.request({
      url: 'https://colour-choice.art/api/fortune',
      method: 'POST',
      header: { 'Authorization': 'Bearer ' + token, 'content-type': 'application/json' },
      data: { action: 'exchange' },
      success: function (r) {
        if (r.data && r.data.success) {
          t.loadState();
          wx.showToast({ title: '已兑换 ¥3 运费券', icon: 'none' });
        } else {
          wx.showToast({ title: (r.data && r.data.error) || '兑换失败', icon: 'none' });
        }
      }
    });
  },

  goLogin: function () { wx.navigateTo({ url: '/pages/login/index' }); }
});
