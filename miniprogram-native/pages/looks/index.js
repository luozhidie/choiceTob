var app = getApp();

Page({
  data:{
    todayStr:'',
    activeCat:'全部',
    cats:['全部','温柔知性','职场通勤','休闲随性','优雅气质','活力潮流'],
    looks:[],
    loading:true,
    isVip:false,
  },

  onLoad:function(){
    var d=new Date();
    var weeks=['日','一','二','三','四','五','六'];
    var m=d.getMonth()+1;
    this.setData({
      todayStr:d.getFullYear()+'年'+m+'月'+d.getDate()+'日 星期'+weeks[d.getDay()]
    });
    this.checkVip();
    this.loadLooks();
  },

  checkVip:function(){
    this.setData({isVip:wx.getStorageSync('vip_status')==='active'});
  },

  loadLooks:function(){
    var t=this;
    t.setData({loading:true});
    wx.request({
      url:'https://colour-choice.art/api/public/daily-looks',
      method:'GET',
      success:function(r){
        var raw=[];
        if(r.data&&r.data.data)raw=r.data.data||[];
        else if(Array.isArray(r.data))raw=r.data;
        var isVip=t.data.isVip;
        var list=raw.map(function(l,i){
          var colors=Array.isArray(l.colors)?l.colors:(l.colors?JSON.parse(l.colors||'[]'):[]);
          return {
            id:l.id,
            title:l.title||'精选搭配',
            desc:l.description||'',
            category:l.style||'精选',
            colors:colors,
            image_url:l.image_url||'',
            locked:!isVip && i>=3
          };
        });
        if(list.length===0)list=t.getDefaultLooks();
        if(t.data.activeCat!=='全部')list=list.filter(function(l){return l.category===t.data.activeCat;});
        t.setData({looks:list,loading:false});
      },
      fail:function(){t.setData({looks:t.getDefaultLooks(),loading:false});}
    });
  },

  onLookTap:function(e){
    var look=e.currentTarget.dataset.look;
    if(!look||look.locked)return;
    if(look.image_url){
      wx.previewImage({urls:[look.image_url],current:look.image_url});
    }
  },

  getDefaultLooks:function(){
    return[
      {id:1,title:'暖杏+咖啡',desc:'适合职场通勤，显白提气色',category:'温柔知性',colors:['#D4A574','#806600','#F5E6D3'],locked:false},
      {id:2,title:'雾霾蓝+白',desc:'夏日清爽配色，视觉降温',category:'清新减龄',colors:['#5B8FA3','#FFFFFF','#A8C8D8'],locked:false},
      {id:3,title:'酒红+黑+裸粉',desc:'秋冬高级感，气场十足',category:'优雅气质',colors:['#722F37','#000000','#D4A5A5'],locked:false},
      {id:4,title:'莫兰迪灰蓝',desc:'极简主义，高级耐看',category:'职场通勤',colors:['#8B9DAE','#C4CBD5','#6B7D8A'],locked:true},
    ];
  },

  swCat:function(e){this.setData({activeCat:e.currentTarget.dataset.c});this.loadLooks();},
  goVip:function(){wx.navigateTo({url:'/pages/vip/index'});},

  subMonthly:function(){this.doPay('daily_looks_monthly',99900,'搭配灵感·月度会员');},
  subYearly:function(){this.doPay('daily_looks_yearly',1198000,'搭配灵感·年度会员');},

  doPay:function(pid,fee,title){
    var t=this;
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
            success:function(){wx.showToast({title:'开通成功',icon:'success'});},
            fail:function(){}
          });
        },
        fail:function(){wx.hideLoading();wx.showToast({title:'网络错误'});}
      });
    }).catch(function(){
      wx.showToast({title:'无法调起微信支付',icon:'none'});
    });
  },
});
