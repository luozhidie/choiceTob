var app=getApp();

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
      header:{'Authorization':'Bearer '+wx.getStorageSync('token')},
      success:function(r){
        var list=[];
        if(r.data&&r.data.data)list=r.data.data||[];
        else if(Array.isArray(r.data))list=r.data;
        var statusMap={pending:'待支付',paid:'已支付',shipped:'已发货',completed:'已完成',refund_pending:'退换申请',refunded:'已退款'};
        list=list.map(function(o){
          var total=(Math.round(Number(o.total_amount||0))/100).toFixed(2);
          return{
            id:o.id,order_no:o.order_no,
            product_id:o.product_id,
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

  goDetail:function(e){var id=e.currentTarget.dataset.id;wx.navigateTo({url:'/pages/orders/detail?id='+id});},

  cancelOrder:function(e){
    var id=e.currentTarget.dataset.id;
    var t=this;
    wx.showModal({title:'取消订单',content:'确定取消该订单？',success:function(r){
      if(r.confirm){
        wx.request({
          url:'https://colour-choice.art/api/orders/'+id,
          method:'POST',
          header:{'Content-Type':'application/json','Authorization':'Bearer '+wx.getStorageSync('token')},
          data:{status:'cancelled'},
          success:function(){wx.showToast({title:'已取消',icon:'success'});t.loadOrders();},
          fail:function(){t.loadOrders();}
        });
      }
    }});
  },

  payOrder:function(e){
    var t=this;
    var id=e.currentTarget.dataset.id;
    var token=wx.getStorageSync('token')||'';
    wx.showLoading({title:'调起支付...'});
    app.getOpenid().then(function(openid){
      wx.request({
        url:'https://colour-choice.art/api/public/orders/'+id,
        method:'GET',
        header:{'Authorization':'Bearer '+token},
        success:function(rr){
          var od=rr.data&&rr.data.data;
          if(!od){wx.hideLoading();wx.showToast({title:'订单信息缺失',icon:'none'});return;}
          var total=Math.round(Number(od.total_amount||0)); /* 已是分 */
          wx.request({
            url:'https://colour-choice.art/api/wechat-pay/unified-order',
            method:'POST',
            data:{
              product_id:od.product_id,
              product_title:od.product_title,
              total_fee:total,
              quantity:od.quantity||1,
              platform:'mini',
              openid:openid,
              out_trade_no:od.order_no
            },
            success:function(r){
              wx.hideLoading();
              var d=r.data||{};
              if(d.error){wx.showModal({title:'下单失败',content:d.error,showCancel:false});return;}
              var params=d.jsapi||d;
              wx.requestPayment({
                timeStamp:params.timeStamp,
                nonceStr:params.nonceStr,
                package:params.package,
                signType:params.signType||'MD5',
                paySign:params.paySign,
                success:function(){wx.showToast({title:'支付成功',icon:'success'});setTimeout(function(){t.loadOrders();},1000);},
                fail:function(err){if(!(err&&err.errMsg&&err.errMsg.indexOf('cancel')>-1)){wx.showToast({title:'支付失败',icon:'none'});}}
              });
            },
            fail:function(){wx.hideLoading();wx.showToast({title:'网络错误',icon:'none'});}
          });
        },
        fail:function(){wx.hideLoading();wx.showToast({title:'网络错误',icon:'none'});}
      });
    }).catch(function(){wx.hideLoading();wx.showModal({title:'无法调起微信支付',content:'请在微信中打开此页面使用支付功能',showCancel:false});});
  },

  confirmReceive:function(e){
    var id=e.currentTarget.dataset.id;
    var t=this;
    wx.showModal({title:'确认收货',content:'确认已收到商品？',success:function(r){
      if(r.confirm){
        wx.request({
          url:'https://colour-choice.art/api/orders/'+id,
          method:'POST',
          header:{'Content-Type':'application/json','Authorization':'Bearer '+wx.getStorageSync('token')},
          data:{status:'completed'},
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
