var app = getApp();
var guard = require('../../utils/agent-guard.js');

Page({
  data:{
    activeTab:'deposit',
    isMember:false,
    memberLabel:'',
    expireDate:'',
    /* 充值会员套餐（预存货款赛道）*/
    depositPlans:[
      {id:'wholesale_6k',name:'会员·首充6000',priceLabel:'充值 ¥6,000',discountLabel:'2.8折',features:['同色同款三件起购','会员折扣2.8折','无退换额度','小批量试购'],highlight:false},
      {id:'wholesale_5w',name:'充值会员·5万',priceLabel:'充值 ¥50,000',discountLabel:'2.8折',features:['同色同款三件起购','会员折扣2.8折','退换额度5%','优先发货权'],highlight:false},
      {id:'wholesale_10w',name:'充值会员·10万',priceLabel:'充值 ¥100,000',discountLabel:'2.8折',features:['同色同款三件起购','会员折扣2.8折','退换额度10%','优先发货权','专属配货师'],highlight:true},
      {id:'wholesale_30w',name:'充值会员·30万',priceLabel:'充值 ¥300,000',discountLabel:'2.6折',features:['同色同款三件起购','会员折扣2.6折','退换额度20%','优先发货权','专属配货师','专属服务支持'],highlight:true},
    ],
    /* 998 虚拟试衣会员入口 */
    tryonAgentPlan:{id:'tryon_pro_998',name:'虚拟试衣会员·¥998',priceLabel:'购买 ¥998',discountLabel:'3.3折起',features:['单件3.3折','满5件2.8折','赠专业版100次','无需预存'],highlight:true},
    showTryonAgent:false,
    showPay:false,
    selectedPlan:null,
    advisorWx:'luozhidie666',
    /* 代理中心 */
    isAgent:false,
    agentStatus:{active:false,depositAmount:0,discountRate:1,returnRate:0},
  },

  onLoad:function(options){
    this.setData({showTryonAgent:guard.isAllowed()});
    if(options&&options.tab&&(options.tab==='price'||options.tab==='deposit')){
      this.setData({activeTab:options.tab});
    }
    this.chkLogin();
    this.loadAgentStatus();
  },

  onShow:function(){ this.loadAgentStatus(); },

  chkLogin:function(){
    var t=this;
    var ui=wx.getStorageSync('user_info');
    if(ui){
      t.setData({isMember:true,memberLabel:'充值会员',expireDate:'2027-07-03'});
    }
  },

  switchTab:function(e){this.setData({activeTab:e.currentTarget.dataset.tab});},

  /* 加载代理状态 */
  loadAgentStatus:function(){
    var t=this;
    app.getOpenid().then(function(openid){
      wx.request({
        url:'https://colour-choice.art/api/agent/me?openid='+encodeURIComponent(openid),
        success:function(r){
          var d=r.data||{};
          t.setData({
            isAgent:!!(d.active||d.isAdmin),
            agentStatus:{
              active:!!d.active,
              depositAmount:d.depositAmount||0,
              discountRate:d.discountRate||1,
              returnRate:d.returnRate||0,
            }
          });
        }
      });
    }).catch(function(){});
  },

  /* 去代理中心 */
  goAgentCenter:function(){ wx.navigateTo({url:'/pages/agent-center/index'}); },

  /* 引导卡：充值 → 滚动到套餐区 */
  scrollToDeposit:function(){
    var t=this;
    setTimeout(function(){
      wx.createSelectorQuery().select("#deposit").boundingClientRect(function(rect){
        if(!rect)return;
        wx.pageScrollTo({scrollTop:Math.max(0,rect.top-10),duration:300});
      }).exec();
    },100);
  },

  selectPlan:function(e){
    var plan=e.currentTarget.dataset.plan;
    this.setData({selectedPlan:plan,showPay:true});
  },

  /* 统一支付方法：先获取openid，再调起支付 */
  doWechatPay:function(planData){
    var t=this;
    wx.showLoading({title:'正在调起支付...'});

    /* 先获取openid */
    app.getOpenid().then(function(openid){
      wx.request({
        url:'https://colour-choice.art/api/wechat-pay/unified-order',
        method:'POST',
        data:{
          product_id:planData.id,
          product_title:planData.name,
          total_fee:t.getFee(planData.id),
          quantity:1,
          platform:'mini',
          openid:openid,
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
            success:function(){
              wx.showToast({title:'支付成功',icon:'success'});
              t.setData({showPay:false,selectedPlan:null});
              t.chkLogin();
            },
            fail:function(err){
              if(!(err&&err.errMsg&&err.errMsg.indexOf('cancel')>-1)){
                wx.showToast({title:'支付失败',icon:'none'});
              }
            }
          });
        },
        fail:function(){wx.hideLoading();wx.showToast({title:'网络错误',icon:'none'});}
      });
    }).catch(function(err){
      wx.hideLoading();
      console.error('获取openid失败',err);
      wx.showToast({title:'无法调起微信支付',icon:'none'});
    });
  },

  closePay:function(){this.setData({showPay:false,selectedPlan:null});},

  /* 998 虚拟试衣会员：跳转云衣橱专业版购买页 */
  buyTryonAgent:function(){
    if (!guard.isAllowed()) { wx.showToast({ title: '该功能仅对合作代理开放', icon: 'none', duration: 2000 }); return; }
    wx.navigateTo({ url: '/pages/look-studio/index?promo=1' });
  },

  /* 预存货款属预付资金，小程序内不提供在线支付入口，改联系顾问线下入账 */
  copyAdvisor:function(){
    var t=this;
    wx.setClipboardData({
      data:t.data.advisorWx,
      success:function(){
        wx.showModal({
          title:'已复制微信号',
          content:'请在微信中搜索添加顾问 '+t.data.advisorWx+'，发送「充值 + 套餐名」，顾问确认到账后立即为你开通权益。',
          showCancel:false,
          confirmText:'知道了'
        });
      }
    });
  },

  getFee:function(pid){
    if(pid==='price_trial')return 1990;
    if(pid==='price_3m')return 12800;
    if(pid==='price_1y')return 39900;
    if(pid==='wholesale_6k')return 600000;
    if(pid==='wholesale_5w')return 5000000;
    if(pid==='wholesale_10w')return 10000000;
    if(pid==='wholesale_30w')return 30000000;
    return 100;
  }
});
