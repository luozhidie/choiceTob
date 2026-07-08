Page({
  data:{
    step:'intro',

    /* ── Step 1: 店铺身份 ── */
    name:'',city:'',shopTypeIndex:0,yearsIndex:0,
    shopTypes:['实体店','档口','工作室','网店','社群团购','其他'],
    yearOptions:['<6个月','半年~1年','1~3年','3~5年','5年以上'],

    /* ── Step 2: 经营画像（选择题为主） ── */
    marketCheck:[false,false,false,false,false,false],   // 广州/杭州/深圳/上海/常熟/其他
    freqIndex:0,categoryCheck:[false,false,false,false,false],
    styleCheck:[false,false,false,false,false,false,false,false],
    priceIndex:0,
    ageIndex:-1,
    ages:['18-25岁','26-35岁','36-45岁','46-55岁','全年龄'],
    freqOptions:['每月1~2次','每月3~4次','每周2~3次','隔天一次','每天'],
    categories:['女装','男装','童装','配饰','内衣/家居服'],
    styles:['淑女风','知性风','名媛风','中性风','潮牌风','职业风','休闲风','大牌风'],
    prices:['100元以下','100~300元','300~500元','500~1000元','1000元以上'],

    /* ── Step 3: 补充联系 ── */
    wechat:'',phone:'',notes:'',

    submitting:false,submitError:'',needLogin:false,
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
    var s=this.data.step;
    if(s==='identity'){this.setData({step:'intro'});}
    else if(s==='profile'){this.setData({step:'identity'});}
    else if(s==='contact'){this.setData({step:'profile'});}
    else if(s==='done'){this.setData({step:'contact'});}
  },

  goIdentity:function(){this.setData({step:'identity'});},

  /* ── Step 1 输入 ── */
  onName:function(e){this.setData({name:e.detail.value});},
  onCity:function(e){this.setData({city:e.detail.value});},
  onShopType:function(e){this.setData({shopTypeIndex:Number(e.detail.value)});},
  onYears:function(e){this.setData({yearsIndex:Number(e.detail.value)});},

  goProfile:function(){
    var d=this.data;
    if(!d.name || !d.name.trim()){wx.showToast({title:'请填写店铺名称',icon:'none'});return;}
    if(!d.city || !d.city.trim()){wx.showToast({title:'请填写所在城市',icon:'none'});return;}
    this.setData({step:'profile'});
  },

  /* ── Step 2 多选切换 ── */
  toggleMarket:function(e){
    var i=Number(e.currentTarget.dataset.idx);
    var c=this.data.marketCheck.slice();
    c[i]=!c[i];this.setData({marketCheck:c});
  },
  onFreq:function(e){this.setData({freqIndex:Number(e.detail.value)});},
  toggleCat:function(e){
    var i=Number(e.currentTarget.dataset.idx);
    var c=this.data.categoryCheck.slice();
    c[i]=!c[i];this.setData({categoryCheck:c});
  },
  toggleStyle:function(e){
    var i=Number(e.currentTarget.dataset.idx);
    var c=this.data.styleCheck.slice();
    c[i]=!c[i];this.setData({styleCheck:c});
  },
  onPrice:function(e){this.setData({priceIndex:Number(e.detail.value)});},
  onAge:function(e){this.setData({ageIndex:Number(e.detail.value)});},

  goContact:function(){
    var d=this.data;
    var hasMarket=d.marketCheck.some(function(v){return v;});
    var hasStyle=d.styleCheck.some(function(v){return v;});
    if(!hasMarket){wx.showToast({title:'请至少选择1个拿货市场',icon:'none'});return;}
    if(!hasStyle){wx.showToast({title:'请至少选择1个风格偏好',icon:'none'});return;}
    if(d.ageIndex<0){wx.showToast({title:'请选择目标年龄层',icon:'none'});return;}
    if(d.priceIndex<0){wx.showToast({title:'请选择价格带',icon:'none'});return;}
    this.setData({step:'contact'});
  },

  /* ── Step 3 输入 ── */
  onWechat:function(e){this.setData({wechat:e.detail.value});},
  onPhone:function(e){this.setData({phone:e.detail.value});},
  onNotes:function(e){this.setData({notes:e.detail.value});},

  submitCertify:function(){
    var t=this;
    if(t.data.submitting)return;
    t.setData({submitting:true,submitError:''});

    var token=wx.getStorageSync('token');
    if(!token){t.setData({submitting:false,needLogin:true});return;}

    var d=t.data;

    // 组装市场列表
    var markets=['广州','杭州','深圳','上海','常熟','其他'];
    var selMarkets=[];
    for(var i=0;i<d.marketCheck.length;i++){if(d.marketCheck[i])selMarkets.push(markets[i]);}
    if(selMarkets.length===0)selMarkets.push(d.city||'未指定');

    // 组装品类
    var cats=['女装','男装','童装','配饰','内衣/家居服'];
    var selCats=[];
    for(var j=0;j<d.categoryCheck.length;j++){if(d.categoryCheck[j])selCats.push(cats[j]);}

    // 组装风格
    var stls=d.styles;
    var selStyles=[];
    for(var k=0;k<d.styleCheck.length;k++){if(d.styleCheck[k])selStyles.push(stls[k]);}

    // 可信度评分（后端也会算一份，前端先给提示）
    var score=50; // 基础分
    if(d.name && d.name.trim().length>=4)score+=10;          // 店铺名完整
    if(d.city)score+=10;                                      // 有城市
    if(selMarkets.length>=2)score+=10;                        // 有多个拿货渠道
    if(selCats.length>=1)score+=8;                            // 选了品类
    if(selStyles.length>=1)score+=8;                          // 选了风格
    if(d.wechat)score+=4;                                     // 留了微信

    var store={
      name:d.name.trim(),
      contact_person:null,
      phone:d.phone||null,
      wechat:d.wechat||null,
      city:d.city||null,
      district:null,
      shop_size:null,
      style_position:(selStyles.length>0?selStyles.join(','):null),
      target_age:(d.ageIndex>=0?d.ages[d.ageIndex]:null),
      price_range:d.prices[d.priceIndex]||null,
      business_data:{
        shop_type:d.shopTypes[d.shopTypeIndex]||null,
        years_experience:d.yearOptions[d.yearsIndex]||null,
        wholesale_markets:selMarkets.join(','),
        purchase_frequency:d.freqOptions[d.freqIndex]||null,
        main_categories:selCats.join(','),
        credibility_score:Math.min(score,100),
        source:'mini_program_certify',
        notes:d.notes||null,
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
