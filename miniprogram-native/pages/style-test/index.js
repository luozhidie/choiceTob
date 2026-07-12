var app = getApp();

Page({
  data:{
    /* 当前测试模式：female / male */
    testMode:'female',
    isPersonal:false,

    /* 测试会员（付费风格测试） */
    isTestMember:false,
    testFeeLabel:'¥99',

    /* 后台配置的图片 */
    heroImage:'',
    blocks:[]
  },

  onLoad:function(options){
    var isPersonal = options && options.scene === 'personal';
    if(isPersonal){wx.setNavigationBarTitle({title:'VIP形象诊断'});}
    this.setData({isPersonal:isPersonal, testMode:options.mode || 'female'});
    this.loadConfig();
  },

  /* ========== 切换男士/女士模式 ========== */
  switchMode:function(e){
    var mode = e.currentTarget.dataset.mode;
    if(mode===this.data.testMode)return;
    this.setData({testMode:mode, isTestMember:false});
  },

  /* ========== 读取后台配置（Hero 大图 + 图片模块） ========== */
  loadConfig:function(){
    var t = this;
    wx.request({
      url:'https://colour-choice.art/api/public/site-assets?keys=style_test_hero,style_test_blocks',
      method:'GET',
      success:function(r){
        var d = r.data || {};
        if(d.success && d.data){
          var upd = {};
          if(d.data.style_test_hero) upd.heroImage = d.data.style_test_hero;
          if(d.data.style_test_blocks){
            try{
              var list = JSON.parse(d.data.style_test_blocks);
              if(Array.isArray(list)) upd.blocks = list;
            }catch(e){}
          }
          t.setData(upd);
        }
      }
    });
  },

  /* ========== 开通测试会员（¥99） ========== */
  buyTestMember:function(){
    var t=this;
    if(!app||!app.getOpenid){wx.showToast({title:'暂不支持',icon:'none'});return;}
    wx.showLoading({title:'调起支付...'});
    app.getOpenid().then(function(openid){
      var isFemale=t.data.testMode==='female';
      var pid=isFemale?'test_female':'test_male';
      var title=isFemale?'女士风格测试会员':'男士风格测试会员';
      wx.request({
        url:'https://colour-choice.art/api/wechat-pay/unified-order',
        method:'POST',
        data:{product_id:pid,product_title:title,total_fee:9900,quantity:1,platform:'mini',openid:openid},
        success:function(r){
          wx.hideLoading();
          var d=r.data||{};
          if(d.error){wx.showModal({title:'下单失败',content:d.error,showCancel:false});return;}
          var p=d.jsapi||d;
          wx.requestPayment({
            timeStamp:p.timeStamp,nonceStr:p.nonceStr,package:p.package,
            signType:p.signType||'MD5',paySign:p.paySign,
            success:function(){wx.showToast({title:'开通成功',icon:'success'});t.setData({isTestMember:true});},
            fail:function(err){if(!(err&&err.errMsg&&err.errMsg.indexOf('cancel')>-1))wx.showToast({title:'支付失败',icon:'none'});}
          });
        },
        fail:function(){wx.hideLoading();wx.showToast({title:'网络错误',icon:'none'});}
      });
    }).catch(function(){wx.hideLoading();wx.showToast({title:'无法调起支付',icon:'none'});});
  }
});
