Page({
  data:{
    step:'intro',

    /* ── 基本信息 ── */
    name:'',contact:'',phone:'',wechat:'',city:'',district:'',
    shopSizeIndex:0,styleIndex:0,ageIndex:0,priceIndex:0,
    shopSizeOptions:['<30㎡','30-50㎡','50-80㎡','80-120㎡','120-200㎡','>200㎡'],
    styleOptions:['淑女风','知性风','名媛风','中性风','潮牌风','职业风','休闲风','大牌风'],
    ageOptions:['18-25岁','26-35岁','36-45岁','46-55岁','全年龄'],
    priceOptions:['100元以下','100-300元','300-500元','500-1000元','1000元以上'],

    /* ── 经营数据 ── */
    rent:'',breakeven:'',grossMargin:'',netMargin:'',turnover:'',
    channels:'',trends:'',notes:'',

    submitting:false,
    submitError:'',
    needLogin:false,
  },

  onLoad:function(){
    var token=wx.getStorageSync('token');
    var info=wx.getStorageSync('user_info');
    if(!token && (!info || !info.nickName)){
      this.setData({needLogin:true});
    }
  },

  goLogin:function(){wx.navigateTo({url:'/pages/login/index'});},
  goHome:function(){wx.switchTab({url:'/pages/home/index'});},
  goBackStep:function(){
    var t=this,s=t.data.step;
    if(s==='base'){t.setData({step:'intro'});}
    else if(s==='biz'){t.setData({step:'base'});}
    else if(s==='done'){t.setData({step:'biz'});}
  },
  goForm:function(){this.setData({step:'base'});},

  /* ── 基本信息输入 ── */
  onName:function(e){this.setData({name:e.detail.value});},
  onContact:function(e){this.setData({contact:e.detail.value});},
  onPhone:function(e){this.setData({phone:e.detail.value});},
  onWechat:function(e){this.setData({wechat:e.detail.value});},
  onCity:function(e){this.setData({city:e.detail.value});},
  onDistrict:function(e){this.setData({district:e.detail.value});},
  onShopSize:function(e){this.setData({shopSizeIndex:Number(e.detail.value)});},
  onStyle:function(e){this.setData({styleIndex:Number(e.detail.value)});},
  onAge:function(e){this.setData({ageIndex:Number(e.detail.value)});},
  onPrice:function(e){this.setData({priceIndex:Number(e.detail.value)});},

  goBiz:function(){
    if(!this.data.name || !this.data.name.trim()){
      wx.showToast({title:'请填写店铺名称',icon:'none'});
      return;
    }
    this.setData({step:'biz'});
  },

  /* ── 经营数据输入 ── */
  onRent:function(e){this.setData({rent:e.detail.value});},
  onBreakeven:function(e){this.setData({breakeven:e.detail.value});},
  onGross:function(e){this.setData({grossMargin:e.detail.value});},
  onNet:function(e){this.setData({netMargin:e.detail.value});},
  onTurnover:function(e){this.setData({turnover:e.detail.value});},
  onChannels:function(e){this.setData({channels:e.detail.value});},
  onTrends:function(e){this.setData({trends:e.detail.value});},
  onNotes:function(e){this.setData({notes:e.detail.value});},

  submitCertify:function(){
    var t=this;
    if(t.data.submitting)return;
    t.setData({submitting:true,submitError:''});

    var token=wx.getStorageSync('token');
    if(!token){t.setData({submitting:false,needLogin:true});return;}

    var d=t.data;
    var store={
      name:d.name.trim(),
      contact_person:d.contact||null,
      phone:d.phone||null,
      wechat:d.wechat||null,
      city:d.city||null,
      district:d.district||null,
      shop_size:d.shopSizeOptions[d.shopSizeIndex]||null,
      style_position:d.styleOptions[d.styleIndex]||null,
      target_age:d.ageOptions[d.ageIndex]||null,
      price_range:d.priceOptions[d.priceIndex]||null,
      business_data:{
        monthly_rent:d.rent||null,
        breakeven:d.breakeven||null,
        gross_margin:d.grossMargin||null,
        net_margin:d.netMargin||null,
        monthly_turnover:d.turnover||null,
        traffic_channels:d.channels||null,
        trends:d.trends||null,
      },
      notes:d.notes||null,
    };

    wx.request({
      url:'https://colour-choice.art/api/auth/store-certify',
      method:'POST',
      data:{token:token,store:store},
      success:function(r){
        t.setData({submitting:false});
        var res=r.data||{};
        if(res.error){
          if(r.statusCode===401){t.setData({needLogin:true});wx.showToast({title:'请重新登录后再认证',icon:'none'});}
          else{t.setData({submitError:res.error});wx.showModal({title:'提交失败',content:res.error,showCancel:false});}
          return;
        }
        wx.setStorageSync('is_certified_store_owner',true);
        wx.setStorageSync('certified_style',store.style_position);
        var app=getApp();
        if(app&&app.globalData)app.globalData.isCertifiedStoreOwner=true;
        t.setData({step:'done'});
        wx.showToast({title:'认证成功！已开启批发价',icon:'success',duration:2000});
      },
      fail:function(){
        t.setData({submitting:false,submitError:'网络异常，请重试'});
        wx.showToast({title:'网络异常，请重试',icon:'none'});
      }
    });
  },

  goBuyer:function(){wx.switchTab({url:'/pages/buyer/index'});},
  goMy:function(){wx.switchTab({url:'/pages/my/index'});},
});
