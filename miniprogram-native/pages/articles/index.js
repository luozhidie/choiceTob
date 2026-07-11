var app = getApp();

Page({
  data:{
    activeTab:'blogger',
    tags:['全部','穿搭','护肤','彩妆','养生','食品','家居'],
    activeTag:'全部',
    loading:true,
    articles:[],
  },

  onLoad:function(){this.load();},
  onPullDownRefresh:function(){var t=this;t.load(function(){wx.stopPullDownRefresh();});},

  swTab:function(e){this.setData({activeTab:e.currentTarget.dataset.t});this.load();},
  swTag:function(e){this.setData({activeTag:e.currentTarget.dataset.t});this.load();},

  load:function(cb){
    var t=this;
    t.setData({loading:true,articles:[]});
    var url='https://colour-choice.art/api/public/articles?limit=20';
    if(t.data.activeTag!=='全部')url+='&category='+encodeURIComponent(t.data.activeTag);
    wx.request({
      url:url,
      method:'GET',
      success:function(r){
        var list=[];
        if(r.data&&r.data.data)list=r.data.data||[];
        else if(Array.isArray(r.data))list=r.data;
        t.setData({articles:list,loading:false});
      },
      fail:function(){t.setData({loading:false});},
      complete:function(){if(cb)cb();}
    });
  },

  goDetail:function(e){
    var id=e.currentTarget.dataset.id;
    console.log('[goDetail] tapped id=', id);
    if(!id){return;}
    wx.navigateTo({url:'/pages/articles/detail?id='+id});
  },

  subMonthly:function(){
    this.doPay('articles_monthly',13800,'时尚资讯·月费订阅');
  },
  subYearly:function(){
    this.doPay('articles_yearly',138000,'时尚资讯·年费订阅');
  },

  doLogin:function(){wx.navigateTo({url:'/pages/login/index'});},

  doPay:function(pid,fee,title){
    app.getOpenid().then(function(openid){
      wx.showLoading({title:'调起支付...'});
      wx.request({
        url:'https://colour-choice.art/api/wechat-pay/unified-order',
        method:'POST',
        data:{product_id:pid,product_title:title,total_fee:fee,quantity:1,platform:'mini',openid:openid},
        success:function(r){
          wx.hideLoading();
          var d=r.data||{};
          if(d.error){wx.showModal({title:d.error,showCancel:false});return;}
          var pm=d.jsapi||d;
          wx.requestPayment({
            timeStamp:pm.timeStamp||pm.timestamp,
            nonceStr:pm.nonceStr,
            package:pm.package,
            signType:pm.signType||'MD5',
            paySign:pm.paySign,
            success:function(){wx.showToast({title:'订阅成功',icon:'success'});},
            fail:function(){}
          });
        },
        fail:function(){wx.hideLoading();wx.showToast({title:'网络错误'});}
      });
    }).catch(function(){
      wx.showToast({title:'无法调起微信支付',icon:'none'});
    });
  }
});
