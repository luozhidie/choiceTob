Page({
  data:{
    step:'intro',

    /* ── Step 1: 店铺身份（全必填 *） ── */
    name:'',contact:'',phone:'',wechat:'',city:'',district:'',
    shopSizeIndex:-1,shopTypeIndex:-1,
    shopSizes:['<30㎡','30-50㎡','50-80㎡','80-120㎡','120-200㎡','>200㎡'],
    shopTypes:['实体店','档口','工作室','网店','社群团购','其他'],

    /* ── Step 2: 经营画像（全必填 *） ── */
    marketCheck:[false,false,false,false,false,false],
    freqIndex:-1,categoryCheck:[false,false,false,false,false],
    styleCheck:[false,false,false,false,false,false,false,false],
    priceIndex:-1,ageIndex:-1,
    freqOptions:['每月1~2次','每月3~4次','每周2~3次','隔天一次','每天'],
    categories:['女装','男装','童装','配饰','内衣/家居服'],
    styles:['淑女风','知性风','名媛风','中性风','潮牌风','职业风','休闲风','大牌风'],
    prices:['100元以下','100~300元','300~500元','500~1000元','1000元以上'],
    ages:['18-25岁','26-35岁','36-45岁','46-55岁','全年龄'],

    /* ── Step 3: 补充信息（全必填 *） ── */
    address:'',
    colorIndex:-1,
    colors:['大地色/大地色系','莫兰迪色系','多巴胺色','美拉德色','新中式/国潮',
            '黑白灰极简','马卡龙/糖果色','撞色/对比色','韩系清新','法式优雅','其他'],
    frontPhotoPath:null,   // 门头照 temp path
    interiorPhotoPath:null, // 陈列照 temp path
    purchaseOrderPath:null,// 拿货单 temp path（必填）

    /* ── 经营数据（选填） ── */
    monthlyRent:'',        // 月租金(元)
    breakEven:'',          // 保本点(元/月)
    grossMargin:'',        // 毛利率
    netMargin:'',          // 净利率
    onlineExposure:'',     // 线上曝光人数/月
    footTraffic:'',        // 月进店数
    conversionRate:'',     // 成交率
    attachRate:'',         // 连带率
    avgItemPrice:'',       // 均件单价(元)
    monthlyRevenue:'',     // 月营业额(元)
    trafficChannels:'',    // 流量渠道

    notes:'',

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
    else if(s==='extra'){this.setData({step:'profile'});}
    else if(s==='done'){this.setData({step:'extra'});}
  },

  goIdentity:function(){this.setData({step:'identity'});},

  /* ── Step 1 输入 ── */
  onName:function(e){this.setData({name:e.detail.value});},
  onContact:function(e){this.setData({contact:e.detail.value});},
  onPhone:function(e){this.setData({phone:e.detail.value});},
  onWechat:function(e){this.setData({wechat:e.detail.value});},
  onCity:function(e){this.setData({city:e.detail.value});},
  onDistrict:function(e){this.setData({district:e.detail.value});},
  onShopType:function(e){this.setData({shopTypeIndex:Number(e.detail.value)});},
  onShopSize:function(e){this.setData({shopSizeIndex:Number(e.detail.value)});},

  goProfile:function(){
    var d=this.data;
    if(!d.name||!d.name.trim()){wx.showToast({title:'请填写店铺名称',icon:'none'});return;}
    if(!d.contact||!d.contact.trim()){wx.showToast({title:'请填写联系人',icon:'none'});return;}
    if(!d.phone||!d.phone.trim()){wx.showToast({title:'请填写联系电话',icon:'none'});return;}
    if(!d.wechat||!d.wechat.trim()){wx.showToast({title:'请填写微信号',icon:'none'});return;}
    if(!d.city||!d.city.trim()){wx.showToast({title:'请填写所在城市',icon:'none'});return;}
    if(d.shopTypeIndex<0){wx.showToast({title:'请选择经营模式',icon:'none'});return;}
    if(d.shopSizeIndex<0){wx.showToast({title:'请选择店铺面积',icon:'none'});return;}
    this.setData({step:'profile'});
  },

  /* ── Step 2 多选切换 ── */
  toggleMarket:function(e){
    var i=Number(e.currentTarget.dataset.idx);
    var c=this.data.marketCheck.slice();c[i]=!c[i];this.setData({marketCheck:c});
  },
  onFreq:function(e){this.setData({freqIndex:Number(e.detail.value)});},
  toggleCat:function(e){
    var i=Number(e.currentTarget.dataset.idx);
    var c=this.data.categoryCheck.slice();c[i]=!c[i];this.setData({categoryCheck:c});
  },
  toggleStyle:function(e){
    var i=Number(e.currentTarget.dataset.idx);
    var c=this.data.styleCheck.slice();c[i]=!c[i];this.setData({styleCheck:c});
  },
  onPrice:function(e){this.setData({priceIndex:Number(e.detail.value)});},
  onAge:function(e){this.setData({ageIndex:Number(e.detail.value)});},

  goExtra:function(){
    var d=this.data;
    if(!d.marketCheck.some(function(v){return v;})){wx.showToast({title:'请至少选择1个拿货市场',icon:'none'});return;}
    if(d.freqIndex<0){wx.showToast({title:'请选择月均拿货频次',icon:'none'});return;}
    if(!d.categoryCheck.some(function(v){return v;})){wx.showToast({title:'请至少选择1个主营品类',icon:'none'});return;}
    if(!d.styleCheck.some(function(v){return v;})){wx.showToast({title:'请至少选择1个风格偏好',icon:'none'});return;}
    if(d.priceIndex<0){wx.showToast({title:'请选择价格带',icon:'none'});return;}
    if(d.ageIndex<0){wx.showToast({title:'请选择目标年龄层',icon:'none'});return;}
    this.setData({step:'extra'});
  },

  /* ── Step 3 输入 ── */
  onAddress:function(e){this.setData({address:e.detail.value});},
  onColor:function(e){this.setData({colorIndex:Number(e.detail.value)});},
  onNotes:function(e){this.setData({notes:e.detail.value});},
  onMonthlyRent:function(e){this.setData({monthlyRent:e.detail.value});},
  onBreakEven:function(e){this.setData({breakEven:e.detail.value});},
  onGrossMargin:function(e){this.setData({grossMargin:e.detail.value});},
  onNetMargin:function(e){this.setData({netMargin:e.detail.value});},
  onOnlineExposure:function(e){this.setData({onlineExposure:e.detail.value});},
  onFootTraffic:function(e){this.setData({footTraffic:e.detail.value});},
  onConversionRate:function(e){this.setData({conversionRate:e.detail.value});},
  onAttachRate:function(e){this.setData({attachRate:e.detail.value});},
  onAvgItemPrice:function(e){this.setData({avgItemPrice:e.detail.value});},
  onMonthlyRevenue:function(e){this.setData({monthlyRevenue:e.detail.value});},
  onTrafficChannels:function(e){this.setData({trafficChannels:e.detail.value});},

  chooseFrontPhoto:function(){
    var t=this;
    wx.chooseMedia({count:1,mediaType:['image'],sizeType:['compressed'],sourceType:['album','camera'],
      success:function(r){
        if(r.tempFiles&&r.tempFiles[0]){
          t.setData({frontPhotoPath:r.tempFiles[0].tempFilePath});
        }
      }
    });
  },
  chooseInteriorPhoto:function(){
    var t=this;
    wx.chooseMedia({count:1,mediaType:['image'],sizeType:['compressed'],sourceType:['album','camera'],
      success:function(r){
        if(r.tempFiles&&r.tempFiles[0]){
          t.setData({interiorPhotoPath:r.tempFiles[0].tempFilePath});
        }
      }
    });
  },
  choosePurchaseOrder:function(){
    var t=this;
    wx.chooseMedia({count:1,mediaType:['image'],sizeType:['compressed'],sourceType:['album','camera'],
      success:function(r){
        if(r.tempFiles&&r.tempFiles[0]){
          t.setData({purchaseOrderPath:r.tempFiles[0].tempFilePath});
        }
      }
    });
  },

  submitCertify:function(){
    var t=this;
    if(t.data.submitting)return;
    t.setData({submitting:true,submitError:''});

    // 全部必填校验
    var d=t.data;
    if(!d.address||!d.address.trim()){t.setData({submitting:false});wx.showToast({title:'请填写店铺地址',icon:'none'});return;}
    if(d.colorIndex<0){t.setData({submitting:false});wx.showToast({title:'请选择店铺主要色系',icon:'none'});return;}
    if(!d.frontPhotoPath){t.setData({submitting:false});wx.showToast({title:'请上传店铺门头照',icon:'none'});return;}
    if(!d.interiorPhotoPath){t.setData({submitting:false});wx.showToast({title:'请上传店内陈列照',icon:'none'});return;}
    if(!d.purchaseOrderPath){t.setData({submitting:false});wx.showToast({title:'请上传拿货单',icon:'none'});return;}

    var token=wx.getStorageSync('token');
    if(!token){t.setData({submitting:false,needLogin:true});return;}

    // 图片转 base64（门头照 + 陈列照 + 拿货单）
    wx.showLoading({title:'正在提交...'});
    Promise.all([
      new Promise(function(resolve){wx.getFileSystemManager().readFile({
        filePath:d.frontPhotoPath,encoding:'base64',
        success:function(res){resolve('data:image/jpeg;base64,'+res.data);},
        fail:function(){resolve(null);}
      });}),
      new Promise(function(resolve){wx.getFileSystemManager().readFile({
        filePath:d.interiorPhotoPath,encoding:'base64',
        success:function(res){resolve('data:image/jpeg;base64,'+res.data);},
        fail:function(){resolve(null);}
      });}),
      new Promise(function(resolve){wx.getFileSystemManager().readFile({
        filePath:d.purchaseOrderPath,encoding:'base64',
        success:function(res){resolve('data:image/jpeg;base64,'+res.data);},
        fail:function(){resolve(null);}
      });})
    ]).then(function(imgResults){

      var markets=['广州','杭州','深圳','上海','常熟','其他'];
      var selMarkets=[];
      for(var i=0;i<d.marketCheck.length;i++){if(d.marketCheck[i])selMarkets.push(markets[i]);}

      var cats=d.categories;var selCats=[];
      for(var j=0;j<d.categoryCheck.length;j++){if(d.categoryCheck[j])selCats.push(cats[j]);}

      var stls=d.styles;var selStyles=[];
      for(var k=0;k<d.styleCheck.length;k++){if(d.styleCheck[k])selStyles.push(stls[k]);}

      var store={
        name:d.name.trim(),
        contact_person:d.contact.trim()||null,
        phone:d.phone.trim()||null,
        wechat:d.wechat.trim()||null,
        city:d.city.trim()||null,
        district:d.district.trim()||null,
        shop_size:d.shopSizes[d.shopSizeIndex]||null,
        style_position:(selStyles.length>0?selStyles.join(','):null),
        target_age:(d.ageIndex>=0?d.ages[d.ageIndex]:null),
        price_range:d.prices[d.priceIndex]||null,
        business_data:{
          shop_type:d.shopTypes[d.shopTypeIndex]||null,
          wholesale_markets:selMarkets.join(','),
          purchase_frequency:d.freqOptions[d.freqIndex]||null,
          main_categories:selCats.join(','),
          store_color_system:d.colors[d.colorIndex]||null,
          store_address:d.address.trim(),
          source:'mini_program_certify',
          notes:d.notes||null,
          front_photo_base64:imgResults[0],     // 门头照
          interior_photo_base64:imgResults[1],  // 陈列照
          purchase_order_base64:imgResults[2],  // 拿货单
          /* 经营数据（选填，有值才传） */
          monthly_rent:d.monthlyRent?Number(d.monthlyRent):null,
          break_even_point:d.breakEven?Number(d.breakEven):null,
          gross_margin_rate:d.grossMargin?Number(d.grossMargin):null,
          net_margin_rate:d.netMargin?Number(d.netMargin):null,
          online_exposure:d.onlineExposure?Number(d.onlineExposure):null,
          foot_traffic:d.footTraffic?Number(d.footTraffic):null,
          conversion_rate:d.conversionRate?Number(d.conversionRate):null,
          attach_rate:d.attachRate?Number(d.attachRate):null,
          avg_item_price:d.avgItemPrice?Number(d.avgItemPrice):null,
          monthly_revenue:d.monthlyRevenue?Number(d.monthlyRevenue):null,
          traffic_channels:d.trafficChannels.trim()||null,
        },
        notes:d.notes||null,
      };

      wx.request({
        url:'https://colour-choice.art/api/auth/store-certify',
        method:'POST',
        data:{token:token,store:store},
        success:function(r){
          wx.hideLoading();
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
          wx.hideLoading();
          t.setData({submitting:false,submitError:'网络异常，请重试'});
          wx.showToast({title:'网络异常，请重试',icon:'none'});
        }
      });
    });
  },

  goBuyer:function(){wx.switchTab({url:'/pages/buyer/index'});},
  goMy:function(){wx.switchTab({url:'/pages/my/index'});},
});
