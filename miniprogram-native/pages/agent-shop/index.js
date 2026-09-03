var app = getApp();
var BASE = 'https://colour-choice.art';
var mp = require('../../utils/mp-page-copy.js');

function fmtYuan(cents) {
  if (cents == null) return '0';
  var y = Math.round(cents) / 100;
  return y % 1 === 0 ? '' + y : y.toFixed(2);
}
function proxyImg(u) {
  if (typeof u !== 'string') return u;
  u = u.replace(/^https?:\/\/fxeknwkmytzedkhplozn\.supabase\.co\//i, 'https://colour-choice.art/simg/');
  return u;
}

Page({
  data: {
    ref: '',
    loading: true,
    valid: false,
    agentName: '',
    products: [],
    // 下单
    showPay: false,
    payItem: null,
    address: null,
    paying: false,
    pageCopy: {}
  },

  onLoad: function (opt) {
    var t = this;
    var ref = (opt && (opt.ref || opt.code)) || '';
    this.setData({ ref: ref });
    mp.loadMpSection('agent', function (c) { t.setData({ pageCopy: (c && c.shop) || {} }); });
    if (!ref) { this.setData({ loading: false }); return; }
    this.loadLanding(ref);
  },

  loadLanding: function (ref) {
    var t = this;
    wx.request({
      url: BASE + '/api/agent/landing?ref=' + encodeURIComponent(ref),
      method: 'GET',
      success: function (r) {
        var d = r.data || {};
        if (!d.valid) { t.setData({ loading: false, valid: false }); return; }
        var list = (d.products || []).map(function (p) {
          return {
            product_id: p.product_id,
            title: p.title,
            cover_image: proxyImg(p.cover_image),
            price: p.price,
            price_yuan: fmtYuan(p.price)
          };
        });
        t.setData({ loading: false, valid: true, agentName: d.agentName || '', products: list });
      },
      fail: function () { t.setData({ loading: false, valid: false }); }
    });
  },

  goTry: function () { wx.navigateTo({ url: '/pages/look-studio/index' }); },

  loadDefaultAddress: function () {
    var t = this;
    var list = wx.getStorageSync('address_list') || [];
    var def = null;
    for (var i = 0; i < list.length; i++) { if (list[i].isDefault) { def = list[i]; break; } }
    if (!def && list.length > 0) def = list[0];
    if (def) {
      var parts = (def.region || '').split(' ');
      t.setData({
        address: {
          name: def.name, phone: def.phone,
          province: parts[0] || '', city: parts[1] || '',
          district: parts[2] || '', detail: def.detail
        }
      });
    }
  },
  onShow: function () { this.loadDefaultAddress(); },
  chooseAddr: function () { wx.navigateTo({ url: '/pages/address/index' }); },

  buy: function (e) {
    var t = this;
    var item = t.data.products[e.currentTarget.dataset.index];
    var token = wx.getStorageSync('token') || '';
    if (!token) {
      wx.navigateTo({ url: '/pages/login/index?redirect=' + encodeURIComponent('/pages/agent-shop/index?ref=' + t.data.ref) });
      return;
    }
    t.setData({ payItem: item, showPay: true });
    if (!t.data.address) t.chooseAddr();
  },

  closePay: function () { this.setData({ showPay: false, payItem: null }); },

  submitOrder: function () {
    var t = this;
    if (!t.data.address) { wx.showToast({ title: '请选择收货地址', icon: 'none' }); return; }
    if (t.data.paying) return;
    var item = t.data.payItem;
    if (!item) return;
    var token = wx.getStorageSync('token') || '';
    var qty = 1;
    var total = Math.round(item.price * qty); // 分
    var addr = t.data.address;
    var addrText = [addr.province, addr.city, addr.district, addr.detail].filter(Boolean).join(' ');
    t.setData({ paying: true });
    wx.showLoading({ title: '提交中...' });

    app.getOpenid().then(function (openid) {
      wx.request({
        url: BASE + '/api/orders/create', method: 'POST',
        header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        data: {
          product_id: item.product_id,
          product_title: item.title,
          product_image: item.cover_image || '',
          product_price: item.price,
          quantity: qty,
          total_amount: total,
          contact: (addr.name || '') + ' ' + (addr.phone || ''),
          address: addrText,
          payment_type: 'wechat',
          referral_code: t.data.ref
        },
        success: function (cr) {
          var cd = cr.data || {};
          if (cd.error || !cd.success) {
            wx.hideLoading(); t.setData({ paying: false });
            wx.showModal({ title: '创建订单失败', content: cd.error || '请重试', showCancel: false }); return;
          }
          var order_no = cd.order && cd.order.order_no;
          if (!order_no) {
            wx.hideLoading(); t.setData({ paying: false });
            wx.showModal({ title: '创建订单失败', content: '未获取到订单号', showCancel: false }); return;
          }
          wx.request({
            url: BASE + '/api/wechat-pay/unified-order', method: 'POST',
            data: {
              product_id: item.product_id, product_title: item.title,
              total_fee: total, quantity: qty, platform: 'mini',
              openid: openid, address: JSON.stringify(addr), out_trade_no: order_no
            },
            success: function (ur) {
              wx.hideLoading();
              var d = ur.data || {};
              if (d.error) {
                wx.showModal({ title: '下单失败', content: d.error, showCancel: false });
                t.setData({ paying: false }); return;
              }
              var params = d.jsapi || d;
              wx.requestPayment({
                timeStamp: params.timeStamp,
                nonceStr: params.nonceStr,
                package: params.package,
                signType: params.signType || 'MD5',
                paySign: params.paySign,
                success: function () {
                  t.setData({ showPay: false, payItem: null, paying: false });
                  wx.showToast({ title: '支付成功', icon: 'success' });
                  setTimeout(function () { wx.redirectTo({ url: '/pages/orders/index?status=paid' }); }, 1200);
                },
                fail: function (err) {
                  t.setData({ paying: false });
                  if (!(err && err.errMsg && err.errMsg.indexOf('cancel') > -1)) {
                    wx.showToast({ title: '支付失败', icon: 'none' });
                  }
                }
              });
            },
            fail: function () { wx.hideLoading(); t.setData({ paying: false }); wx.showToast({ title: '网络错误', icon: 'none' }); }
          });
        },
        fail: function () { wx.hideLoading(); t.setData({ paying: false }); wx.showToast({ title: '网络错误', icon: 'none' }); }
      });
    }).catch(function () {
      wx.hideLoading(); t.setData({ paying: false });
      wx.showModal({ title: '无法调起支付', content: '请在微信中打开此页面', showCancel: false });
    });
  },

  goHome: function () { wx.switchTab({ url: '/pages/home/index' }); },
  noop: function () {}
});
