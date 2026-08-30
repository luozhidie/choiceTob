var app = getApp();
var BASE = 'https://colour-choice.art';

Page({
  data:{
    showPay:false,
    selectedPlan:null,
    loading:false,
    showAgreement:false,
    agreementText:'',
    agreementSigned:false,
    agentStatus:{ active:false, depositAmount:0, discountRate:1, returnRate:0 },
    plans:[
      {id:'agent_test_cent',name:'链路测试',amount:'0.01',amountLabel:'¥0.01',discount:'2.8折',refund:5,example:'验证充值到账',isTest:true},
      {id:'wholesale_6k',name:'会员·首充6000',amount:'6000',amountLabel:'¥6,000',discount:'2.8折',refund:0,tryonTip:'充值¥6000将自动扣除¥998专业版试衣费，剩余¥5002计入预存货款（仅用于选购，不退现）',example:'原价¥100 → ¥28 + 赠专业试衣100次'},
      {id:'wholesale_5w',name:'充值会员·5万',amount:'5万',amountLabel:'¥50,000',discount:'2.8折',refund:5,example:'原价¥100 → ¥28'},
      {id:'wholesale_10w',name:'充值会员·10万',amount:'10万',amountLabel:'¥100,000',discount:'2.8折',refund:10,example:'原价¥100 → ¥28'},
      {id:'wholesale_30w',name:'充值会员·30万',amount:'30万',amountLabel:'¥300,000',discount:'2.6折',refund:20,example:'原价¥100 → ¥26'},
    ],
  },

  onLoad:function(){ this.fetchAgentStatus(); },
  onShow:function(){ this.fetchAgentStatus(); },

  goAgentCenter:function(){ wx.navigateTo({url:'/pages/agent-center/index'}); },

  fetchAgentStatus:function(){
    var t=this;
    app.getOpenid().then(function(openid){
      wx.request({
        url:BASE+'/api/agent/me?openid='+encodeURIComponent(openid),
        success:function(r){
          var d=r.data||{};
          var amt=d.depositAmount||0;
          t.setData({ agentStatus:{
            active:!!d.active,
            depositAmount:amt,
            depositText:t.formatMoney(amt),
            discountText:((d.discountRate||1)*10).toFixed(1),
            returnText:((d.returnRate||0)*100).toFixed(0),
            discountRate:d.discountRate||1,
            returnRate:d.returnRate||0,
            lastRecharge:d.lastRecharge||null,
          }});
        }
      });
    }).catch(function(){});
  },

  formatMoney:function(cents){
    if(!cents||cents<=0)return '0';
    var s=Math.floor(cents/100).toString();
    var out='';
    var len=s.length;
    for(var i=0;i<len;i++){
      if(i>0&&(len-i)%3===0)out+=',';
      out+=s.charAt(i);
    }
    return out;
  },

  selectPlan:function(e){var p=e.currentTarget.dataset.plan;this.setData({selectedPlan:p,showPay:true});},
  closePay:function(){this.setData({showPay:false,selectedPlan:null});},

  // 协议：拉取文本并展示
  openAgreement:function(){
    var t=this;
    app.getOpenid().then(function(openid){
      wx.request({
        url:BASE+'/api/agent/agreement?openid='+encodeURIComponent(openid),
        success:function(r){
          var d=r.data||{};
          if(d.signed){ t.setData({agreementSigned:true}); return; }
          t.setData({showAgreement:true, agreementText:d.agreementText||'《预充货款协议》'});
        }
      });
    });
  },
  closeAgreement:function(){this.setData({showAgreement:false});},
  signAgreement:function(){
    var t=this;
    app.getOpenid().then(function(openid){
      wx.request({
        url:BASE+'/api/agent/agreement',
        method:'POST',
        data:{version:'v1', openid:openid},
        success:function(r){
          if(r.data&&r.data.ok){
            t.setData({showAgreement:false, agreementSigned:true});
            wx.showToast({title:'已签署',icon:'success'});
          }else{
            wx.showModal({title:'签约失败',content:(r.data&&r.data.error)||'请重试',showCancel:false});
          }
        }
      });
    });
  },

  confirmPay:function(){
    var t=this;
    var p=this.data.selectedPlan;
    if(!p||t.data.loading)return;

    t.setData({loading:true});
    wx.showLoading({title:'正在调起支付...'});

    app.getOpenid().then(function(openid){
      wx.request({
        url:BASE+'/api/agent/recharge',
        method:'POST',
        data:{plan_id:p.id, openid:openid, platform:'mini'},
        success:function(r){
          wx.hideLoading();
          var d=r.data||{};
          t.setData({loading:false});
          if(d.error){
            // 未签协议：弹协议签约
            if(d.needAgreement){
              t.openAgreement();
              return;
            }
            wx.showModal({title:'下单失败',content:d.error,showCancel:false});return;}

          wx.requestPayment({
            timeStamp:d.timeStamp,
            nonceStr:d.nonceStr,
            package:d.package,
            signType:d.signType||'MD5',
            paySign:d.paySign,
            success:function(){
              wx.showToast({title:'支付成功',icon:'success'});
              t.setData({showPay:false});
              // 延迟后刷新状态
              setTimeout(function(){t.fetchAgentStatus();},1200);
            },
            fail:function(err){
              console.log('支付取消/失败',err);
              wx.showToast({title:'支付取消',icon:'none'});
            }
          });
        },
        fail:function(){
          wx.hideLoading();
          t.setData({loading:false});
          wx.showToast({title:'网络错误',icon:'none'});
        }
      });
    }).catch(function(err){
      wx.hideLoading();
      t.setData({loading:false});
      wx.showToast({title:'无法获取 openid',icon:'none'});
    });
  },

  goContact:function(){wx.showModal({title:'联系客服',content:'微信：luozhidie\n工作时间 9:00-18:00',showCancel:false,confirmText:'知道了'});},
  noop:function(){},
});
