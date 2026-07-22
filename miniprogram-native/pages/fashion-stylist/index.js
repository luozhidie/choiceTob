var API_BASE = "https://colour-choice.art";

var SERVICES = [
  { key: "outfit", label: "AI搭配", icon: "👗" },
  { key: "plan", label: "商品企划", icon: "📋" },
  { key: "buyer_group", label: "买手组货", icon: "🛒" },
  { key: "display", label: "陈列搭配", icon: "🪟" },
  { key: "marketing", label: "营销策划", icon: "📣" },
  { key: "sales", label: "销售服务", icon: "💡" },
  { key: "brand", label: "品牌管理", icon: "⭐" },
  { key: "design", label: "服装设计", icon: "✏️" },
];

Page({
  data: {
    services: SERVICES,
    service: "outfit",
    serviceLabel: "AI搭配",
    input: "",
    loading: false,
    result: "",
    history: [],
    isAdmin: false,
  },

  onLoad: function (options) {
    var s = options && options.service;
    if (s) {
      var f = SERVICES.find(function (x) {
        return x.key === s;
      });
      if (f) this.setData({ service: s, serviceLabel: f.label });
    }
    this.checkAdmin();
  },

  checkAdmin: function () {
    var t = this;
    var token = wx.getStorageSync("token") || "";
    if (!token) {
      t.setData({ isAdmin: false });
      wx.showModal({
        title: "提示",
        content: "该功能仅管理员可用，请先登录管理员账号",
        showCancel: false,
        confirmText: "返回",
        success: function () {
          wx.navigateBack();
        },
      });
      return;
    }
    wx.request({
      url: API_BASE + "/api/user/me",
      method: "GET",
      header: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      success: function (r) {
        var d = r.data || {};
        var admin = !!(d.data && d.data.isAdmin);
        t.setData({ isAdmin: admin });
        if (!admin) {
          wx.showModal({
            title: "提示",
            content: "该功能仅管理员可用",
            showCancel: false,
            confirmText: "返回",
            success: function () {
              wx.navigateBack();
            },
          });
        } else {
          t.loadHistory(token);
        }
      },
      fail: function () {
        t.setData({ isAdmin: false });
        wx.showToast({ title: "网络错误", icon: "none" });
      },
    });
  },

  selectService: function (e) {
    var k = e.currentTarget.dataset.key;
    var f = SERVICES.find(function (x) {
      return x.key === k;
    });
    this.setData({ service: k, serviceLabel: f ? f.label : "" });
  },

  onInput: function (e) {
    this.setData({ input: e.detail.value });
  },

  submit: function () {
    var t = this;
    if (!t.data.input || !t.data.input.trim()) {
      wx.showToast({ title: "请输入需求描述", icon: "none" });
      return;
    }
    var token = wx.getStorageSync("token") || "";
    if (!token) {
      wx.showToast({ title: "请先登录", icon: "none" });
      return;
    }
    t.setData({ loading: true, result: "" });
    wx.request({
      url: API_BASE + "/api/ai/fashion-stylist",
      method: "POST",
      header: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      data: {
        taskType: t.data.service,
        service: t.data.serviceLabel,
        input: t.data.input,
      },
      success: function (r) {
        var d = r.data || {};
        if (d.error) {
          wx.showModal({ title: "失败", content: d.error, showCancel: false });
          t.setData({ loading: false });
          return;
        }
        t.setData({ result: d.result || "", loading: false });
        t.loadHistory(token);
      },
      fail: function () {
        wx.showToast({ title: "网络错误", icon: "none" });
        t.setData({ loading: false });
      },
    });
  },

  loadHistory: function (token) {
    var t = this;
    wx.request({
      url: API_BASE + "/api/ai/fashion-stylist",
      method: "GET",
      header: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      success: function (r) {
        var d = r.data || {};
        if (d.records) t.setData({ history: d.records });
      },
    });
  },

  copyResult: function () {
    if (this.data.result) {
      wx.setClipboardData({
        data: this.data.result,
        success: function () {
          wx.showToast({ title: "已复制", icon: "success" });
        },
      });
    }
  },

  goBack: function () {
    wx.navigateBack();
  },
});
