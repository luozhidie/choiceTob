var app = getApp();

// 兜底默认值（与后台 site_settings / 首次 seed 一致）
var DEFAULT_TASKS = [
  { key: 'know_activity', label: '平台活动提前知（秋款上新福利）', icon: '📣', type: 'once' },
  { key: 'subscribe_stall', label: '订阅档口领财富值', icon: '🔔', type: 'once' },
  { key: 'order_rebate', label: '下单返运费', icon: '🛒', type: 'daily' },
  { key: 'official_group', label: '加入一手店主官方福利群', icon: '👥', type: 'once', nav: '/pages/group/index' },
  { key: 'browse_spot', label: '浏览现货 15s', icon: '👀', type: 'daily' },
  { key: 'browse_hot', label: '浏览档口最爆款 15s', icon: '🔥', type: 'daily' },
  { key: 'market_new', label: '每日看市场新款', icon: '✨', type: 'daily' },
  { key: 'browse_invite', label: '浏览邀请 30s', icon: '🔗', type: 'daily' }
];
var DEFAULT_CHECKIN = [100, 200, 300, 500, 800, 1000, 1600];
var DEFAULT_EXCHANGE_COST = 3000;

Page({
  data: {
    loading: true,
    notLogin: false,
    wealth_score: 0,
    check_in_streak: 0,
    checkedToday: false,
    weekCheckedCount: 0,
    checkinLabels: ['一', '二', '三', '四', '五', '六', '日'],
    checkinRewards: DEFAULT_CHECKIN,
    tasks: [],
    canExchange: false,
    exchangeCost: DEFAULT_EXCHANGE_COST
  },

  onShow: function () { this.loadAll(); },

  // 同时拉取活动配置 + 用户状态
  loadAll: function () {
    var t = this;
    var token = wx.getStorageSync('token') || '';
    if (!token) { t.setData({ loading: false, notLogin: true }); return; }
    t.setData({ loading: true, notLogin: false });

    wx.request({
      url: 'https://colour-choice.art/api/public/settings?keys=fortune_checkin_rewards,fortune_tasks,fortune_exchange',
      method: 'GET',
      success: function (cr) {
        var cd = (cr.data || {}).data || {};
        var checkinRewards = Array.isArray(cd.fortune_checkin_rewards) ? cd.fortune_checkin_rewards : DEFAULT_CHECKIN;
        var tasksCfg = Array.isArray(cd.fortune_tasks) ? cd.fortune_tasks : DEFAULT_TASKS;
        var exchange = cd.fortune_exchange && typeof cd.fortune_exchange.cost === 'number' ? cd.fortune_exchange : { cost: DEFAULT_EXCHANGE_COST };
        t._cfg = { checkinRewards: checkinRewards, tasksCfg: tasksCfg, exchangeCost: exchange.cost };
        t.loadState(token);
      },
      fail: function () {
        t._cfg = { checkinRewards: DEFAULT_CHECKIN, tasksCfg: DEFAULT_TASKS, exchangeCost: DEFAULT_EXCHANGE_COST };
        t.loadState(token);
      }
    });
  },

  loadState: function (token) {
    var t = this;
    var cfg = t._cfg || { checkinRewards: DEFAULT_CHECKIN, tasksCfg: DEFAULT_TASKS, exchangeCost: DEFAULT_EXCHANGE_COST };
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
        var tasks = cfg.tasksCfg.map(function (tk) {
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
          weekCheckedCount: weekCheckedCount,
          checkinRewards: cfg.checkinRewards,
          tasks: tasks,
          exchangeCost: cfg.exchangeCost,
          canExchange: (d.wealth_score || 0) >= cfg.exchangeCost
        });
      },
      fail: function () { t.setData({ loading: false, checkinRewards: cfg.checkinRewards, tasks: cfg.tasksCfg, exchangeCost: cfg.exchangeCost }); }
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
          t.loadAll();
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
          t.loadAll();
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
      wx.showToast({ title: '财运值满 ' + t.data.exchangeCost + ' 可兑换', icon: 'none' });
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
          t.loadAll();
          wx.showToast({ title: '已兑换运费券', icon: 'none' });
        } else {
          wx.showToast({ title: (r.data && r.data.error) || '兑换失败', icon: 'none' });
        }
      }
    });
  },

  goLogin: function () { wx.navigateTo({ url: '/pages/login/index' }); }
});
