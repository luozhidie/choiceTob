const BASE = 'https://colour-choice.art';
var app = getApp();

function fmtYuan(cents) {
  if (cents == null) return '0.00';
  var y = Number(cents) / 100;
  return y.toFixed(2);
}

Page({
  data: {
    loading: true,
    cards: [],
    showForm: false,
    bankName: '',
    accountName: '',
    cardNo: '',
    saving: false
  },
  onShow: function () {
    this.loadCards();
  },
  loadCards: function () {
    var t = this;
    var token = wx.getStorageSync('token') || '';
    if (!token) { wx.redirectTo({ url: '/pages/login/index' }); return; }
    t.setData({ loading: true });
    wx.request({
      url: BASE + '/api/agent/bank-cards',
      method: 'GET',
      header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      success: function (r) {
        var d = r.data || {};
        if (d.error) { wx.showToast({ title: d.error, icon: 'none' }); return; }
        t.setData({ cards: d.cards || [] });
      },
      fail: function () { wx.showToast({ title: '网络错误', icon: 'none' }); },
      complete: function () { t.setData({ loading: false }); }
    });
  },
  openForm: function () { this.setData({ showForm: true, bankName: '', accountName: '', cardNo: '' }); },
  closeForm: function () { this.setData({ showForm: false }); },
  onBankName: function (e) { this.setData({ bankName: e.detail.value }); },
  onAccountName: function (e) { this.setData({ accountName: e.detail.value }); },
  onCardNo: function (e) { this.setData({ cardNo: e.detail.value }); },
  saveCard: function () {
    var t = this;
    if (t.data.saving) return;
    var bankName = (t.data.bankName || '').trim();
    var accountName = (t.data.accountName || '').trim();
    var cardNo = (t.data.cardNo || '').trim().replace(/\s/g, '');
    if (!bankName) { wx.showToast({ title: '请输入开户行', icon: 'none' }); return; }
    if (!accountName) { wx.showToast({ title: '请输入持卡人姓名', icon: 'none' }); return; }
    if (!/^\d{16,19}$/.test(cardNo)) { wx.showToast({ title: '请输入16-19位银行卡号', icon: 'none' }); return; }
    t.setData({ saving: true });
    var token = wx.getStorageSync('token') || '';
    wx.request({
      url: BASE + '/api/agent/bank-cards',
      method: 'POST',
      header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      data: { bank_name: bankName, account_name: accountName, card_no: cardNo },
      success: function (r) {
        var d = r.data || {};
        if (d.error) { wx.showModal({ title: '保存失败', content: d.error, showCancel: false }); return; }
        wx.showToast({ title: '已绑定', icon: 'success' });
        t.setData({ showForm: false });
        t.loadCards();
      },
      fail: function () { wx.showToast({ title: '网络错误', icon: 'none' }); },
      complete: function () { t.setData({ saving: false }); }
    });
  },
  unbind: function (e) {
    var t = this;
    var id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '解绑银行卡',
      content: '确认解绑该银行卡？',
      success: function (res) {
        if (!res.confirm) return;
        var token = wx.getStorageSync('token') || '';
        wx.request({
          url: BASE + '/api/agent/bank-cards?id=' + encodeURIComponent(id),
          method: 'DELETE',
          header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          success: function (r) {
            var d = r.data || {};
            if (d.error) { wx.showModal({ title: '解绑失败', content: d.error, showCancel: false }); return; }
            wx.showToast({ title: '已解绑', icon: 'success' });
            t.loadCards();
          },
          fail: function () { wx.showToast({ title: '网络错误', icon: 'none' }); }
        });
      }
    });
  }
});
