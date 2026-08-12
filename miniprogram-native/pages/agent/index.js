var app = getApp();

function tierLabel(t) {
  return { basic_5w: "基础版", pro_10w: "进阶版", brand_30w: "品牌版" }[t] || "";
}
function discText(d) {
  if (!d || d >= 1) return "零售价";
  return (Math.round(d * 100) / 10) + "折";
}
function levelNext(cum) {
  var tiers = [
    { name: "白银", min: 50000, d: 0.28 },
    { name: "黄金", min: 100000, d: 0.28 },
    { name: "钻石", min: 300000, d: 0.26 },
  ];
  for (var i = 0; i < tiers.length; i++) {
    if (cum < tiers[i].min) {
      return { nextName: tiers[i].name, diff: tiers[i].min - cum, discount: (tiers[i].d * 10) + "折" };
    }
  }
  return null;
}

Page({
  data: {
    loading: true,
    loggedIn: false,
    isAgent: false,
    tierLabel: "",
    storeName: "",
    wholesaleVisible: false,
    returnRate: 0,
    effectiveDiscount: "零售价",
    agentLevel: "普通",
    cumYuan: 0,
    tryonCredits: 0,
    subTier: "none",
    nextLevel: "",
    nextDiff: 0,
    nextDiscount: "",
    progress: 0,
  },

  onShow: function () { this.load(); },

  load: function () {
    var t = this;
    var token = wx.getStorageSync("token");
    if (!token) { t.setData({ loading: false, loggedIn: false }); return; }
    wx.request({
      url: "https://colour-choice.art/api/agent/me?token=" + token,
      success: function (r) {
        var d = r.data || {};
        if (d.error) { t.setData({ loading: false, loggedIn: false }); return; }
        var cum = d.cumulative_order_amount || 0;
        var nx = levelNext(cum);
        t.setData({
          loading: false,
          loggedIn: true,
          isAgent: !!d.is_sales_agent,
          tierLabel: tierLabel(d.agent_tier),
          storeName: d.store_name || "",
          wholesaleVisible: !!d.wholesale_visible,
          returnRate: d.return_rate || 0,
          effectiveDiscount: discText(d.effective_discount),
          agentLevel: d.agent_level || "普通",
          cumYuan: cum,
          tryonCredits: d.tryon_credits || 0,
          subTier: d.tryon_subscription_tier || "none",
          nextLevel: nx ? nx.nextName : "",
          nextDiff: nx ? nx.diff : 0,
          nextDiscount: nx ? nx.discount : "",
          progress: Math.min(100, (cum / 300000) * 100),
        });
      },
      fail: function () { t.setData({ loading: false }); },
    });
  },

  goDeposit: function () { wx.navigateTo({ url: "/pages/deposit/index" }); },
  goTryonCard: function () { wx.navigateTo({ url: "/pages/tryon-card/index" }); },
  goLogin: function () { wx.navigateTo({ url: "/pages/login/index" }); },
});
