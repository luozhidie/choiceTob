var app = getApp();
var BASE = 'https://colour-choice.art';

var DEFAULT_DEPOSIT_COPY={
  header:{title:'📦 预存货款 · 折扣选购',subtitle:'预存越多，折扣越低。预存款可用于采购下单，随时退。'},
  status:{activeMain:'已激活：预存 ¥{depositText}',activeSub:'选购 {discountText} 折 · 可退 {returnText}%',inactiveMain:'未开通预存货款会员',inactiveSub:'充值后即可享受会员折扣价'},
  agentEntry:{title:'代理中心',descActive:'已开通会员店铺 · 去设置专属价、分享搭配',descInactive:'充值后自动开通会员店铺，享专属价',btnActive:'进入 ›',btnInactive:'去开通 ›'},
  plansHeader:{title:'充值会员套餐',sub:'充值即得 折扣权 + 退换额度'},
  plans:[
    {id:'agent_test_cent',name:'链路测试',amount:'0.01',amountLabel:'¥0.01',discount:'2.8折',refund:5,example:'验证充值到账',isTest:true},
    {id:'wholesale_6k',name:'会员·首充6000',amount:'6000',amountLabel:'¥6,000',discount:'2.8折',refund:0,tryonTip:'充值¥6000将自动扣除¥998专业版试衣费，剩余¥5002计入预存货款（仅用于选购，不退现）',example:'原价¥100 → ¥28 + 赠专业试衣100次'},
    {id:'wholesale_5w',name:'充值会员·5万',amount:'5万',amountLabel:'¥50,000',discount:'2.8折',refund:5,example:'原价¥100 → ¥28'},
    {id:'wholesale_10w',name:'充值会员·10万',amount:'10万',amountLabel:'¥100,000',discount:'2.8折',refund:10,example:'原价¥100 → ¥28'},
    {id:'wholesale_30w',name:'充值会员·30万',amount:'30万',amountLabel:'¥300,000',discount:'2.6折',refund:20,example:'原价¥100 → ¥26'}
  ],
  amountLabels:{pay:'支付金额',deposit:'预存金额',noRefund:'不退现'},
  tips:{tip:'💡 预存货款仅用于本店选购，不退现；已享折扣的已消费部分不退。详情请联系客服',contactPrefix:'如有疑问或需要帮助，请',contactLink:'联系客服'},
  payModal:{title:'联系顾问充值',payTip:'预存货款为线下对公入账，需由顾问确认后开通。添加顾问微信后发送「充值 + 套餐名」，到账后 5 分钟内自动开通权益。',copyDialogTitle:'已复制微信号',advisorLabel:'顾问微信',copyBtn:'复制微信号'},
  agreement:{title:'请阅读并签署《预充货款协议》',agreeBtn:'我已阅读并同意签署',cancelBtn:'暂不开通'},
  contactDialog:{title:'联系客服',content:'微信：{advisorWx}\n工作时间 9:00-18:00',confirmText:'知道了'},
  advisorWx:'luozhidie666'
};

Page({
  data:{
    showPay:false,
    selectedPlan:null,
    loading:false,
    showAgreement:false,
    agreementText:'',
    agreementSigned:false,
    agentStatus:{ active:false, depositAmount:0, discountRate:1, returnRate:0 },
    /* 后台可配置文案（充值页） */
    depositCopy:DEFAULT_DEPOSIT_COPY,
    advisorWx:DEFAULT_DEPOSIT_COPY.advisorWx,
    plans:DEFAULT_DEPOSIT_COPY.plans,
  },

  onLoad:function(){
    this.fetchAgentStatus();
    this.loadDepositCopy();
  },

  /* 加载后台充值页文案 */
  loadDepositCopy:function(){
    var t=this;
    wx.request({
      url:BASE+'/api/public/settings?keys=deposit_page_copy',
      success:function(r){
        var d=(r.data||{}).data||{};
        var dc=d.deposit_page_copy;
        if(!dc)return;
        var merged={};
        for(var k in DEFAULT_DEPOSIT_COPY){ if(DEFAULT_DEPOSIT_COPY.hasOwnProperty(k)) merged[k]=(dc[k]!==undefined?dc[k]:DEFAULT_DEPOSIT_COPY[k]); }
        t.setData({depositCopy:merged, advisorWx:merged.advisorWx, plans:merged.plans});
        t.refreshStatusText();
      }
    });
  },
  onShow:function(){
    this.fetchAgentStatus();
    this.refreshStatusText();
  },

  goAgentCenter:function(){ wx.navigateTo({url:'/pages/agent-center/index'}); },

  /* 根据 agentStatus 和后台文案模板，计算当前权益显示文案 */
  refreshStatusText:function(){
    var t=this;
    var copy=(t.data.depositCopy||DEFAULT_DEPOSIT_COPY);
    var st=copy.status||DEFAULT_DEPOSIT_COPY.status;
    var ag=t.data.agentStatus||{};
    var main='', sub='';
    if(ag.active){
      main=(st.activeMain||'').replace('{depositText}', ag.depositText||'0');
      sub=(st.activeSub||'').replace('{discountText}', ag.discountText||'10').replace('{returnText}', ag.returnText||'0');
    }else{
      main=st.inactiveMain||'';
      sub=st.inactiveSub||'';
    }
    t.setData({statusMain:main, statusSub:sub});
  },

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
          t.refreshStatusText();
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

  /* 预存货款属预付资金，不支持小程序在线支付，改为联系顾问线下入账 */
  copyAdvisor:function(){
    var t=this;
    var cfg=((t.data.depositCopy&&t.data.depositCopy.payModal)||DEFAULT_DEPOSIT_COPY.payModal);
    var wxid=t.data.advisorWx||DEFAULT_DEPOSIT_COPY.advisorWx;
    wx.setClipboardData({
      data:wxid,
      success:function(){
        wx.showModal({
          title:cfg.copyDialogTitle||'已复制微信号',
          content:(cfg.payTip||'请在微信中搜索添加顾问 {advisorWx}，发送「充值 + 套餐名」，顾问确认到账后立即为你开通权益。').replace(/{advisorWx}/g, wxid),
          showCancel:false,
          confirmText:'知道了'
        });
      }
    });
  },

  legacyConfirmPay:function(){
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

  goContact:function(){
    var t=this;
    var cfg=((t.data.depositCopy&&t.data.depositCopy.contactDialog)||DEFAULT_DEPOSIT_COPY.contactDialog);
    var wxid=t.data.advisorWx||DEFAULT_DEPOSIT_COPY.advisorWx;
    wx.showModal({title:cfg.title, content:(cfg.content||'').replace(/{advisorWx}/g, wxid), showCancel:false, confirmText:cfg.confirmText||'知道了'});
  },
  noop:function(){},
});
