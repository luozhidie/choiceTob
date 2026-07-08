var app = getApp();

Page({
  data:{
    activeTab:'price',
    isMember:false,
    memberLabel:'',
    expireDate:'',
    /* 拿货升级进度 */
    purchaseAmount:0,
    purchaseAmountLabel:'0',
    currentLevel:0,          // 0=普通,1=5万,2=10万,3=30万
    upgradeProgress:0,
    nextLevelLabel:'',
    nextLevelGapLabel:'',
    pricePlans:[
      {id:'price_trial',name:'价格会员·体验',priceLabel:'¥19.9',originalPrice:'',discountLabel:'省¥0',features:['查看所有商品批发价','对比供货价与市场价格差','爆款趋势预览'],highlight:false},
      {id:'price_3m',name:'价格会员·季卡',priceLabel:'¥128/季',originalPrice:'¥199',discountLabel:'省¥71',features:['查看所有商品批发价','对比供货价与市场价格差','爆款趋势预测数据','行业选品报告(月)'],highlight:false},
      {id:'price_1y',name:'价格会员·年卡',priceLabel:'¥399/年',originalPrice:'¥798',discountLabel:'省¥399',features:['查看所有商品批发价','对比供货价与市场价格差','爆款趋势预测数据','行业选品报告(月)','每日搭配订阅','专属客服通道'],highlight:true},
    ],
    depositPlans:[
      {id:'wholesale_5w',name:'充值会员·5万',priceLabel:'充值 ¥50,000',discountLabel:'2.8折',features:['同色同款三件起批','拿货折扣2.8折','退换额度5%','优先发货权'],highlight:false},
      {id:'wholesale_10w',name:'充值会员·10万',priceLabel:'充值 ¥100,000',discountLabel:'2.8折',features:['同色同款三件起批','拿货折扣2.8折','退换额度10%','优先发货权','专属配货师'],highlight:true},
      {id:'wholesale_30w',name:'充值会员·30万',priceLabel:'充值 ¥300,000',discountLabel:'2.6折',features:['同色同款三件起批','拿货折扣2.6折','退换额度20%','优先发货权','专属配货师','账期支持30天'],highlight:true},
    ],
    compareRows:[
      {name:'批发价查看',trial:true,quarterly:true,yearly:true},
      {name:'市场价格对比',trial:true,quarterly:true,yearly:true},
      {name:'爆款趋势预测',false:true,quarterly:true,yearly:true},
      {name:'选品报告(月)',false:false,quarterly:true,yearly:true},
      {name:'每日搭配订阅',false:false,quarterly:false,yearly:true},
      {name:'专属客服通道',false:false,quarterly:false,yearly:true},
    ],
    showPay:false,
    selectedPlan:null,
  },

  onLoad:function(options){
    if(options&&options.tab&&(options.tab==='price'||options.tab==='deposit')){
      this.setData({activeTab:options.tab});
    }
    this.chkLogin();
    this.loadPurchaseAmount();
  },

  chkLogin:function(){
    var t=this;
    var ui=wx.getStorageSync('user_info');
    if(ui){
      t.setData({isMember:true,memberLabel:'价格会员',expireDate:'2027-07-03'});
    }
  },

  /* 获取拿货金额并计算升级进度 */
  loadPurchaseAmount:function(){
    var t=this;
    var ui=wx.getStorageSync('user_info');
    if(!ui||!ui.id){
      t.setData({purchaseAmount:0,purchaseAmountLabel:'0',currentLevel:0,upgradeProgress:0,nextLevelLabel:'5万会员',nextLevelGapLabel:'50,000'});
      return;
    }
    wx.request({
      url:'https://colour-choice.art/api/user/me',
      method:'GET',
      header:{
        'Authorization':'Bearer '+ (wx.getStorageSync('token')||'')
      },
      success:function(r){
        var d=(r.data||{}).data||{};  // API返回 {data:{totalPurchaseAmount,...}}
        var amount=d.totalPurchaseAmount||0;  // 分
        var amountYuan=Math.round(amount/100);
        // 阈值（分）
        var thresholds=[0,500000,1000000,3000000];
        var levelNames=['普通','5万会员','10万会员','30万会员'];
        var curLv=0;
        for(var i=thresholds.length-1;i>=0;i--){
          if(amount>=thresholds[i]){curLv=i;break;}
        }
        var progress=0;
        var nextLabel='';
        var gapLabel='';
        if(curLv<thresholds.length-1){
          var curT=thresholds[curLv];
          var nextT=thresholds[curLv+1];
          var ratio=(amount-curT)/(nextT-curT);
          progress=Math.min(100,Math.max(0,Math.round(ratio*100)));
          nextLabel=levelNames[curLv+1];
          gapLabel=Math.round((nextT-amount)/100).toLocaleString();
        } else {
          progress=100;
        }
        t.setData({
          purchaseAmount:amount,
          purchaseAmountLabel:amountYuan.toLocaleString(),
          currentLevel:curLv,
          upgradeProgress:progress,
          nextLevelLabel:nextLabel,
          nextLevelGapLabel:gapLabel,
        });
      },
      fail:function(){
        t.setData({purchaseAmount:0,purchaseAmountLabel:'0',currentLevel:0,upgradeProgress:0,nextLevelLabel:'5万会员',nextLevelGapLabel:'50,000'});
      }
    });
  },

  switchTab:function(e){this.setData({activeTab:e.currentTarget.dataset.tab});},

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

  confirmPay:function(){
    var plan=this.data.selectedPlan;
    if(!plan)return;
    this.doWechatPay(plan);
  },

  getFee:function(pid){
    if(pid==='price_trial')return 1990;
    if(pid==='price_3m')return 12800;
    if(pid==='price_1y')return 39900;
    if(pid==='wholesale_5w')return 5000000;
    if(pid==='wholesale_10w')return 10000000;
    if(pid==='wholesale_30w')return 30000000;
    return 100;
  }
});
