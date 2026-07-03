Page({
  data: {
    activeTab: 'all',
    orders: [],
    loading: true,
  },

  onShow: function () { this.loadOrders(); },

  loadOrders: function () {
    var that = this;
    that.setData({ loading: true });
    wx.request({
      url: 'https://colour-choice.art/api/public/orders?limit=50',
      method: 'GET',
      success: function (r) {
        var list = [];
        if (r.data && r.data.data) list = r.data.data || [];
        else if (Array.isArray(r.data)) list = r.data;
        // 格式化
        var statusMap = { pending: '待支付', paid: '已支付', shipped: '已发货', completed: '已完成', refund_pending: '退换申请', refunded: '已退款' };
        list = list.map(function (o) {
          var total = o.total_amount || 0;
          if (total >= 100) total = Math.round(total / 100);
          return {
            id: o.id,
            product_title: o.product_title,
            product_image: o.product_image,
            quantity: o.quantity,
            status: o.status,
            statusLabel: statusMap[o.status] || o.status,
            totalAmountLabel: total,
          };
        });
        // 筛选
        var filtered = that.data.activeTab === 'all' ? list : (that.data.activeTab === 'refund' ? list.filter(function (o) { return o.status === 'refund_pending' || o.status === 'refunded'; }) : list.filter(function (o) { return o.status === that.data.activeTab; }));
        that.setData({ orders: filtered, loading: false });
      },
      fail: function () { that.setData({ loading: false }); }
    });
  },

  switchTab: function (e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
    this.loadOrders();
  },

  confirmReceive: function (e) {
    var id = e.currentTarget.dataset.id;
    var that = this;
    wx.showModal({
      title: '确认收货',
      content: '确认已收到商品？',
      success: function (res) {
        if (res.confirm) {
          // 调用后端API更新状态
          wx.request({
            url: 'https://colour-choice.art/api/admin/orders/update',
            method: 'POST',
            header: { 'Content-Type': 'application/json' },
            data: { id: id, status: 'completed', completed_at: new Date().toISOString() },
            success: function () {
              wx.showToast({ title: '已确认收货', icon: 'success' });
              that.loadOrders();
            }
          });
        }
      }
    });
  },

  reorder: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/shop/index?id=' + id });
  },

  applyRefund: function (e) {
    wx.showModal({
      title: '申请退换',
      content: '请联系客服处理退换货\n微信：luozhidie',
      showCancel: false,
    });
  },

  goBuyer: function () { wx.switchTab({ url: '/pages/buyer/index' }); },
});
