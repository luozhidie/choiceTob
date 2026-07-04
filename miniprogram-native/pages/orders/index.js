Page({
  data:{
    activeTab:'all',
    orders:[],
    loading:true,
  },

  onShow:function(){this.loadOrders();},

  loadOrders:function(){
    var t=this;
    t.setData({loading:true});
    var url='https://colour-choice.art/api/public/orders?limit=50';
    wx.request({
      url:url,
      method:'GET',
      success:function(r){
        var list=[];
        if(r.data&&r.data.data)list=r.data.data||[];
        else if(Array.isArray(r.data))list=r.data;
        var statusMap={pending:'待支付',paid:'已支付',shipped:'已发货',completed:'已完成',refund_pending:'退换申请',refunded:'已退款'};
        list=list.map(function(o){
          var total=o.total_amount||0;
          if(total>=100)total=Math.round(total/100);
          return{
            id:o.id,order_no:o.order_no,
            product_title:o.product_title,
            product_image:o.product_image,
            quantity:o.quantity||1,
            status:o.status,
            statusLabel:statusMap[o.status]||o.status,
            totalAmountLabel:total,
          };
        });
        /* 按Tab过滤 */
        var filtered;
        if(t.data.activeTab==='refund'){
          filtered=list.filter(function(o){return o.status==='refund_pending'||o.status==='refunded';});
        }else if(t.data.activeTab==='all'){
          filtered=list;
        }else{
          filtered=list.filter(function(o){return o.status===t.data.activeTab;});
        }
        t.setData({orders:filtered,loading:false});
      },
      fail:function(){t.setData({loading:false});}
    });
  },

  switchTab:function(e){
    this.setData({activeTab:e.currentTarget.dataset.tab});
    this.loadOrders();
  },

  goDetail:function(e){wx.showToast({title:'订单详情开发中',icon:'none'});},

  cancelOrder:function(e){
    var id=e.currentTarget.dataset.id;
    var t=this;
    wx.showModal({title:'取消订单',content:'确定取消该订单？',success:function(r){
      if(r.confirm){
        wx.request({
          url:'https://colour-choice.art/api/admin/orders/update',
          method:'POST',
          data:{id:id,status:'cancelled'},
          success:function(){wx.showToast({title:'已取消',icon:'success'});t.loadOrders();}
        });
      }
    }});
  },

  payOrder:function(e){
    var id=e.currentTarget.dataset.id;
    wx.showToast({title:'重新支付功能开发中',icon:'none'});
  },

  confirmReceive:function(e){
    var id=e.currentTarget.dataset.id;
    var t=this;
    wx.showModal({title:'确认收货',content:'确认已收到商品？',success:function(r){
      if(r.confirm){
        wx.request({
          url:'https://colour-choice.art/api/admin/orders/update',
          method:'POST',
          data:{id:id,status:'completed'},
          success:function(){wx.showToast({title:'已确认收货',icon:'success'});t.loadOrders();},
          fail:function(){t.loadOrders();}
        });
      }
    }});
  },

  applyRefund:function(e){
    wx.showModal({title:'申请退换',content:'请联系客服处理退换货\n微信：luozhidie\n工作时间 9:00-18:00',showCancel:false,confirmText:'知道了'});
  },

  goBuyer:function(){wx.switchTab({url:'/pages/buyer/index'});},
});
