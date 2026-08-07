var app=getApp();
Page({
  data:{
    id:'',
    order:null,
    loading:true,
    statusLabel:'',
    statusTip:'',
    priceYuan:'0.00',
    totalYuan:'0.00',
    createdAt:'',
    paidAt:''
  },
  onLoad:function(opt){
    var id=opt&&opt.id;
    this.setData({id:id});
    this.loadDetail();
  },
  loadDetail:function(){
    var t=this;
    var token=wx.getStorageSync('token')||'';
    t.setData({loading:true});
    wx.request({
      url:'https://colour-choice.art/api/public/orders/'+t.data.id,
      method:'GET',
      header:{'Authorization':'Bearer '+token},
      success:function(r){
        var od=r.data&&r.data.data;
        if(!od){t.setData({loading:false});return;}
        var sm={pending:'待支付',paid:'已支付',shipped:'已发货',completed:'已完成',cancelled:'已取消',refund_pending:'退换申请',refunded:'已退款'};
        var tipm={pending:'请尽快完成支付，超时订单可能自动关闭',paid:'已支付，等待商家发货',shipped:'商品已发出，请确认收货',completed:'交易已完成，感谢您的信任',cancelled:'订单已取消',refund_pending:'退换申请处理中',refunded:'已退款'};
        var priceY=(Math.round(Number(od.product_price||0))/100).toFixed(2);
        var totalY=(Math.round(Number(od.total_amount||0))/100).toFixed(2);
        t.setData({
          order:od,
          loading:false,
          statusLabel:sm[od.status]||od.status,
          statusTip:tipm[od.status]||'',
          priceYuan:priceY,
          totalYuan:totalY,
          createdAt:(od.created_at||'').replace('T',' ').slice(0,19),
          paidAt:(od.paid_at||'').replace('T',' ').slice(0,19)
        });
      },
      fail:function(){t.setData({loading:false});}
    });
  },
  payAgain:function(){
    var t=this;
    var od=t.data.order;
    if(!od)return;
    var token=wx.getStorageSync('token')||'';
    wx.showLoading({title:'调起支付...'});
    app.getOpenid().then(function(openid){
      wx.request({
        url:'https://colour-choice.art/api/wechat-pay/unified-order',
        method:'POST',
        data:{
          product_id:od.product_id,
          product_title:od.product_title,
          total_fee:Math.round(Number(od.total_amount||0)),
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
            success:function(){wx.showToast({title:'支付成功',icon:'success'});setTimeout(function(){t.loadDetail();},1000);},
            fail:function(err){if(!(err&&err.errMsg&&err.errMsg.indexOf('cancel')>-1)){wx.showToast({title:'支付失败',icon:'none'});}}
          });
        },
        fail:function(){wx.hideLoading();wx.showToast({title:'网络错误',icon:'none'});}
      });
    }).catch(function(){wx.hideLoading();wx.showModal({title:'无法调起微信支付',content:'请在微信中打开此页面使用支付功能',showCancel:false});});
  },
  confirmReceive:function(){
    var t=this;
    var id=t.data.id;
    wx.showModal({title:'确认收货',content:'确认已收到商品？',success:function(r){
      if(r.confirm){
        wx.request({
          url:'https://colour-choice.art/api/orders/'+id,
          method:'POST',
          header:{'Content-Type':'application/json','Authorization':'Bearer '+wx.getStorageSync('token')},
          data:{status:'completed'},
          success:function(){wx.showToast({title:'已确认收货',icon:'success'});t.loadDetail();},
          fail:function(){t.loadDetail();}
        });
      }
    }});
  },
  goBack:function(){wx.navigateBack();}
});
