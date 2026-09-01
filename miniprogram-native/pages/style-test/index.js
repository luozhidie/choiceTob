var app = getApp();
var guard = require('../../utils/agent-guard.js');
var vp = require('../../utils/virtual-pay.js');

Page({
  data:{
    /* 测试会员（付费风格测试 / 智能形象诊断）
       开通后女士测试、男士测试、真人试穿同时可用 */
    isTestMember:false,
    testFeeLabel:'¥998',

    /* 后台配置的图片 */
    heroImage:'',
    blocks:[]
  },

  onLoad:function(options){
    this.loadConfig();
    this.checkEntitlement();
  },

  /* ========== 查询专业版权益（风格测试会员 = 专业版） ========== */
  checkEntitlement:function(){
    var t=this;
    if(!app||!app.getOpenid)return;
    app.getOpenid().then(function(openid){
      wx.request({
        url:'https://colour-choice.art/api/tryon/entitlement?openid='+encodeURIComponent(openid),
        method:'GET',
        success:function(r){
          var d=r.data||{};
          t.setData({isTestMember:!!(d.active && d.proLeft > 0)});
        }
      });
    }).catch(function(){});
  },

  /* ========== 进入八大风格真人试穿 ========== */
  goTryon:function(){
    if(!this.data.isTestMember){
      wx.showModal({
        title:'需开通风格测试会员',
        content:'八大风格真人试穿属于专业诊断，开通 ¥998 风格测试会员（含 100 次专业诊断）后即可使用。',
        confirmText:'立即开通',
        cancelText:'取消',
        success:function(res){ if(res.confirm) wx.navigateTo({url:'/pages/tryon-pro/index'}); }
      });
      return;
    }
    if (!guard.isAllowed()) { wx.showToast({ title: '该功能仅对合作代理开放', icon: 'none', duration: 2000 }); return; }
    wx.navigateTo({ url:'/pages/style-tryon/index' });
  },

  /* ========== 进入女士风格测试 ========== */
  goFemale:function(){
    if(!this.data.isTestMember){
      this.showBuyModal();
      return;
    }
    wx.navigateTo({ url:'/pages/style-test-female/index' });
  },

  /* ========== 进入男士风格测试 ========== */
  goMale:function(){
    if(!this.data.isTestMember){
      this.showBuyModal();
      return;
    }
    wx.navigateTo({ url:'/pages/style-test-male/index' });
  },

  showBuyModal:function(){
    if (!guard.isAllowed()) { wx.showToast({ title: '该功能仅对合作代理开放', icon: 'none', duration: 2000 }); return; }
    wx.showModal({
      title:'需开通风格测试会员',
      content:'风格测试为专业诊断内容，开通 ¥998 会员后女士 / 男士测试与真人试穿同时可用。',
      confirmText:'立即开通',
      cancelText:'取消',
      success:function(res){ if(res.confirm) wx.navigateTo({url:'/pages/tryon-pro/index'}); }
    });
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

  /* ========== 开通测试会员（¥998） ========== */
  // 风格测试会员 = 专业版：100 次专业诊断 + 女士/男士风格测试 + 八大风格真人试穿
  buyTestMember:function(){
    var t=this;
    if(!app||!app.getOpenid){wx.showToast({title:'暂不支持',icon:'none'});return;}
    vp.pay({
      goodsKey:'tryon_pro_998',
      success:function(){wx.showToast({title:'开通成功',icon:'success'});t.setData({isTestMember:true});},
      fail:function(err){if(!(err&&err.errMsg&&String(err.errMsg).indexOf('cancel')>-1))wx.showToast({title:'支付失败',icon:'none'});},
      legacy:function(){t.legacyBuyTestMember();}
    });
  },

  /* 兜底：虚拟支付不可用时走原 JSAPI 通道 */
  legacyBuyTestMember:function(){
    var t=this;
    wx.showLoading({title:'调起支付...'});
    app.getOpenid().then(function(openid){
      wx.request({
        url:'https://colour-choice.art/api/tryon/create',
        method:'POST',
        data:{package_id:'tryon_pro_998',openid:openid,platform:'mini'},
        success:function(r){
          wx.hideLoading();
          var d=r.data||{};
          if(d.error){wx.showModal({title:'下单失败',content:d.error,showCancel:false});return;}
          wx.requestPayment({
            timeStamp:d.timeStamp,nonceStr:d.nonceStr,package:d.package,
            signType:d.signType||'MD5',paySign:d.paySign,
            success:function(){wx.showToast({title:'开通成功',icon:'success'});t.setData({isTestMember:true});},
            fail:function(err){if(!(err&&err.errMsg&&err.errMsg.indexOf('cancel')>-1))wx.showToast({title:'支付失败',icon:'none'});}
          });
        },
        fail:function(){wx.hideLoading();wx.showToast({title:'网络错误',icon:'none'});}
      });
    }).catch(function(){wx.hideLoading();wx.showToast({title:'无法调起支付',icon:'none'});});
  }
});
