Page({
  data:{
    showPay:false,
    selectedPlan:null,
    plans:[
      {id:'wholesale_5w',name:'拿货会员·5万',amount:'5万',amountLabel:'¥50,000',discount:'2.8折',refund:5,example:'原价¥100 → ¥28'},
      {id:'wholesale_10w',name:'拿货会员·10万',amount:'10万',amountLabel:'¥100,000',discount:'2.8折',refund:10,example:'原价¥100 → ¥28'},
      {id:'wholesale_30w',name:'拿货会员·30万',amount:'30万',amountLabel:'¥300,000',discount:'2.6折',refund:20,example:'原价¥100 → ¥26'},
    ],
  },

  selectPlan:function(e){var p=e.currentTarget.dataset.plan;this.setData({selectedPlan:p,showPay:true});},
  closePay:function(){this.setData({showPay:false,selectedPlan:null});},

  confirmPay:function(){
    var t=this;
    var p=this.data.selectedPlan;
    if(!p)return;
    wx.showLoading({title:'正在调起支付...'});
    var feeMap={'wholesale_5w':5000000,'wholesale_10w':10000000,'wholesale_30w':30000000};
    wx.request({
      url:'https://colour-choice.art/api/wechat-pay/unified-order',
      method:'POST',
      data:{product_id:p.id,product_title:p.name,total_fee:feeMap[p.id]||5000000,quantity:1,platform:'mini'},
      success:function(r){
        wx.hideLoading();
        var d=r.data||{};
        if(d.error){wx.showModal({title:'下单失败',content:d.error,showCancel:false});return;}
        var pm=d.jsapi||d;
        wx.requestPayment({
          timeStamp:pm.timestamp||pm.timeStamp,
          nonceStr:pm.nonceStr,
          package:pm.package,
          signType:pm.signType||'RSA',
          paySign:pm.paySign,
          success:function(){wx.showToast({title:'充值成功',icon:'success'});t.setData({showPay:false});},
          fail:function(){wx.showToast({title:'支付取消',icon:'none'});}
        });
      },
      fail:function(){wx.hideLoading();wx.showToast({title:'网络错误',icon:'none'});}
    });
  },

  goContact:function(){wx.showModal({title:'联系客服',content:'微信：luozhidie\n工作时间 9:00-18:00',showCancel:false,confirmText:'知道了'});},
  noop:function(){},
});
