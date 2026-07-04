Page({
  data:{
    activeTab:'price',
    isMember:false,
    memberLabel:'',
    expireDate:'',
    pricePlans:[
      {id:'price_trial',name:'价格会员·体验',priceLabel:'¥19.9',originalPrice:'',discountLabel:'省¥0',features:['查看所有商品批发价','对比供货价与市场价格差','爆款趋势预览'],highlight:false},
      {id:'price_3m',name:'价格会员·季卡',priceLabel:'¥128/季',originalPrice:'¥199',discountLabel:'省¥71',features:['查看所有商品批发价','对比供货价与市场价格差','爆款趋势预测数据','行业选品报告(月)'],highlight:false},
      {id:'price_1y',name:'价格会员·年卡',priceLabel:'¥399/年',originalPrice:'¥798',discountLabel:'省¥399',features:['查看所有商品批发价','对比供货价与市场价格差','爆款趋势预测数据','行业选品报告(月)','每日搭配订阅','专属客服通道'],highlight:true},
    ],
    depositPlans:[
      {id:'wholesale_5w',name:'拿货会员·5万',priceLabel:'充值 ¥50,000',discountLabel:'2.8折起',features:['同色同款三件起批','拿货折扣2.8折','退换额度5%','优先发货权'],highlight:false},
      {id:'wholesale_10w',name:'拿货会员·10万',priceLabel:'充值 ¥100,000',discountLabel:'2.6折起',features:['同色同款三件起批','拿货折扣2.6折','退换额度10%','优先发货权','专属配货师'],highlight:true},
      {id:'wholesale_30w',name:'拿货会员·30万',priceLabel:'充值 ¥300,000',discountLabel:'2.4折起',features:['同色同款三件起批','拿货折扣2.4折','退换额度15%','优先发货权','专属配货师','账期支持30天'],highlight:true},
    ],
    testPlans:[
      {id:'test_style',name:'色彩风格测试',priceLabel:'¥99/次',features:['17道专业诊断题','色彩风格匹配报告','搭配建议方案','结果微信通知']},
    ],
    compareRows:[
      {name:'批发价查看',trial:true,quarterly:true,yearly:true},
      {name:'市场价格对比',trial:true,quarterly:true,yearly:true},
      {name:'爆款趋势预测',trial:false,quarterly:true,yearly:true},
      {name:'选品报告(月)',trial:false,quarterly:true,yearly:true},
      {name:'每日搭配订阅',trial:false,quarterly:false,yearly:true},
      {name:'专属客服通道',trial:false,quarterly:false,yearly:true},
    ],
    showPay:false,
    selectedPlan:null,
  },

  onLoad:function(){this.chkLogin();},

  chkLogin:function(){
    var t=this;
    var ui=wx.getStorageSync('user_info');
    if(ui){
      t.setData({isMember:true,memberLabel:'价格会员',expireDate:'2027-07-03'});
    }
  },

  switchTab:function(e){this.setData({activeTab:e.currentTarget.dataset.tab});},

  selectPlan:function(e){
    var plan=e.currentTarget.dataset.plan;
    this.setData({selectedPlan:plan,showPay:true});
  },
  closePay:function(){this.setData({showPay:false,selectedPlan:null});},

  confirmPay:function(){
    var that=this;
    var plan=this.data.selectedPlan;
    if(!plan)return;
    wx.showLoading({title:'正在调起支付...'});
    wx.request({
      url:'https://colour-choice.art/api/wechat-pay/unified-order',
      method:'POST',
      data:{
        product_id:plan.id,
        product_title:plan.name,
        total_fee:this.getFee(plan.id),
        quantity:1,
        platform:'mini',
      },
      success:function(r){
        wx.hideLoading();
        var d=r.data||{};
        if(d.error){wx.showModal({title:'下单失败',content:d.error,showCancel:false});return;}
        var params=d.jsapi||d;
        wx.requestPayment({
          timeStamp:params.timestamp||params.timeStamp,
          nonceStr:params.nonceStr,
          package:params.package,
          signType:params.signType||'RSA',
          paySign:params.paySign,
          success:function(){
            wx.showToast({title:'支付成功',icon:'success'});
            that.setData({showPay:false,selectedPlan:null});
            that.chkLogin();
          },
          fail:function(){wx.showToast({title:'支付取消',icon:'none'});}
        });
      },
      fail:function(){wx.hideLoading();wx.showToast({title:'网络错误',icon:'none'});}
    });
  },

  getFee:function(pid){
    if(pid==='price_trial')return 1990;
    if(pid==='price_3m')return 12800;
    if(pid==='price_1y')return 39900;
    if(pid==='wholesale_5w')return 5000000;
    if(pid==='wholesale_10w')return 10000000;
    if(pid==='wholesale_30w')return 30000000;
    if(pid==='test_style')return 9900;
    return 100;
  }
});
