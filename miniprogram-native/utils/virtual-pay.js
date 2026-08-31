// utils/virtual-pay.js
// 微信小程序「虚拟支付」统一封装（虚拟内容：试衣次数 / 搭配灵感 / 资讯订阅）
// 说明：
//  1) signData 必须由服务端生成并原样透传，客户端不得二次拼装，否则签名校验失败
//  2) 服务端返回 fallback=true 时（虚拟支付未开启/未配置），自动回退到原 JSAPI 支付，保证生意不停
//  3) iOS 需微信 8.0.68+ 且该能力已额外开通；不支持时引导「联系顾问」
var BASE = 'https://colour-choice.art';
var ADVISOR_WX = 'luozhidie666';

function compareVersion(v1, v2) {
  if (typeof v1 !== 'string' || typeof v2 !== 'string') return 0;
  var a = v1.split('.'), b = v2.split('.');
  var len = Math.max(a.length, b.length);
  while (a.length < len) a.push('0');
  while (b.length < len) b.push('0');
  for (var i = 0; i < len; i++) {
    var n1 = parseInt(a[i], 10), n2 = parseInt(b[i], 10);
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
}

function getSys() {
  try { return wx.getSystemInfoSync() || {}; } catch (e) { return {}; }
}

/** 当前客户端是否支持虚拟支付 */
function supported() {
  var sys = getSys();
  var sdk = sys.SDKVersion || '';
  if (sdk && compareVersion(sdk, '2.19.2') < 0) return false;

  // iOS 端需微信客户端 >= 8.0.68（低于此版本调起必失败，改为引导联系顾问）
  var plat = String(sys.platform || '').toLowerCase();
  var wxVer = sys.version || '';
  if ((plat === 'ios' || plat === 'mac') && wxVer) {
    if (compareVersion(wxVer, '8.0.68') < 0) return false;
  }

  try {
    if (wx.canIUse && !wx.canIUse('requestVirtualPayment')) return false;
  } catch (e) { /* 忽略，按支持处理 */ }
  return true;
}

function contactAdvisor(tip) {
  wx.showModal({
    title: '当前环境暂不支持在线支付',
    content: (tip || '') + '请联系顾问开通，微信号：' + ADVISOR_WX,
    confirmText: '复制微信号',
    cancelText: '知道了',
    success: function (r) {
      if (r.confirm) {
        wx.setClipboardData({ data: ADVISOR_WX, success: function () {} });
      }
    }
  });
}

/**
 * 发起虚拟支付
 * @param {Object} opts
 *   goodsKey   {String}  必填，道具 key（与 MP 后台道具ID 一致）
 *   quantity   {Number}  购买数量，默认 1
 *   attach     {String}  透传数据，发货推送时回传
 *   success    {Function} 支付并发货成功
 *   fail       {Function} 失败/取消
 *   legacy     {Function} 服务端要求回退时执行（原 JSAPI 支付逻辑）
 */
function pay(opts) {
  var goodsKey = opts.goodsKey;
  if (!goodsKey) {
    wx.showToast({ title: '商品参数缺失', icon: 'none' });
    return;
  }

  if (!supported()) {
    contactAdvisor('您的微信版本暂不支持虚拟内容在线支付，');
    opts.fail && opts.fail({ errMsg: 'unsupported' });
    return;
  }

  wx.showLoading({ title: '调起支付...' });
  wx.login({
    success: function (lr) {
      if (!lr.code) {
        wx.hideLoading();
        wx.showToast({ title: '微信登录失败', icon: 'none' });
        opts.fail && opts.fail({ errMsg: 'login fail' });
        return;
      }
      wx.request({
        url: BASE + '/api/virtual-pay/sign',
        method: 'POST',
        data: {
          code: lr.code,
          goodsKey: goodsKey,
          buyQuantity: opts.quantity || 1,
          attach: opts.attach || goodsKey
        },
        success: function (r) {
          wx.hideLoading();
          var d = r.data || {};
          if ((d.error || !d.signData) && typeof opts.legacy === 'function') {
            console.warn('[虚拟支付] 回退 JSAPI:', d.error);
            opts.legacy();
            return;
          }
          if (!d.signData) {
            wx.showModal({ title: '下单失败', content: d.error || '支付参数获取失败', showCancel: false });
            opts.fail && opts.fail(d);
            return;
          }

          wx.requestVirtualPayment({
            signData: d.signData,
            paySig: d.paySig,
            signature: d.signature,
            mode: d.mode || 'short_series_goods',
            success: function (res) {
              wx.showLoading({ title: '开通中...' });
              wx.request({
                url: BASE + '/api/virtual-pay/grant',
                method: 'POST',
                data: { outTradeNo: d.outTradeNo },
                complete: function () { wx.hideLoading(); },
                success: function (gr) {
                  var gd = gr.data || {};
                  if (gd.error) {
                    console.warn('[虚拟支付] 发货未成功:', gd.error);
                  }
                  opts.success && opts.success(res);
                },
                fail: function () {
                  // 发货失败也视为支付成功，后台推送会补发
                  opts.success && opts.success(res);
                }
              });
            },
            fail: function (err) {
              var code = err && err.errCode;
              var msg = (err && err.errMsg) || '';
              if (code === -2 || msg.indexOf('cancel') > -1) return; // 用户取消
              var tip = '支付未完成';
              if (code === -15010 || code === -15018) tip = '商品未上架，请联系顾问';
              else if (code === -15005 || code === -15006) tip = '签名校验失败，请联系顾问';
              else if (code === -15007) tip = '登录态过期，请退出重进';
              else if (code === -4) tip = '支付被风控拦截，请联系顾问';
              wx.showModal({ title: tip, content: '错误码 ' + code + '，或联系顾问微信：' + ADVISOR_WX, showCancel: false });
              opts.fail && opts.fail(err);
            }
          });
        },
        fail: function () {
          wx.hideLoading();
          wx.showToast({ title: '网络错误', icon: 'none' });
          opts.fail && opts.fail({ errMsg: 'network' });
        }
      });
    },
    fail: function () {
      wx.hideLoading();
      wx.showToast({ title: '微信登录失败', icon: 'none' });
      opts.fail && opts.fail({ errMsg: 'login fail' });
    }
  });
}

module.exports = {
  pay: pay,
  supported: supported,
  contactAdvisor: contactAdvisor,
  ADVISOR_WX: ADVISOR_WX
};
