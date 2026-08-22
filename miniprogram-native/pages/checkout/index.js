var app = getApp();

Page({
  data:{
    items:[],
    address:null,
    remark:'',
    subtotal:'0.00',
    shipping:'0.00',
    total:'0.00',
  },

  onLoad:function(opt){
    /* 从购物车勾选商品进入 */
    var cart=wx.getStorageSync('cart_v2')||[];
    var items=cart.filter(function(i){return i.checked;});
    if(items.length===0){
      /* 尝试从参数获取单个商品 */
      if(opt.id){
        wx.request({
          url:'https://colour-choice.art/api/public/products?limit=1&id='+opt.id,
          method:'GET',
          success:function(r){
            var p=null;
            if(r.data&&r.data.data&&r.data.data.length>0)p=r.data.data[0];
            else if(Array.isArray(r.data))p=r.data[0];
            if(p){
              var isPM = !!(app && app.globalData && app.globalData.isPriceMember) || !!wx.getStorageSync('is_certified_store_owner');
              var rp=Number(p.price)||0;
              var wp=Number(p.wholesale_price)||0;
              var effCents=(isPM && wp>0)?wp:rp;
              var yuan=effCents>=100?Math.round(effCents/100):effCents;
              items=[{id:p.id,name:p.title||p.name,price:rp,wholesale_price:wp,priceText:yuan,image:p.image_url||'',quantity:Number(opt.quantity)||1}];
              wx.setStorageSync('checkout_items',items);
            }
          },complete:function(){this.calc();}.bind(this)
        });
      }
    }else{
      /* 格式化价格：会员（含认证店主）按批发价，否则零售价 */
      var isPM = !!(app && app.globalData && app.globalData.isPriceMember) || !!wx.getStorageSync('is_certified_store_owner');
      items.forEach(function(i){
        var rp=Number(i.price)||0;
        var wp=Number(i.wholesale_price)||0;
        var effCents=(isPM && wp>0)?wp:rp;
        i.priceText = effCents>=100 ? Math.round(effCents/100) : effCents;
      });
      this.setData({items:items});
      this.calc();
    }
  },

  calc:function(){
    var items=this.data.items;
    var sub=0;
    items.forEach(function(i){sub+=Number(i.priceText||0)*(i.quantity||1);});
    var ship=sub>=299?0:10;
    this.setData({
      subtotal:sub.toFixed(2),
      shipping:ship.toFixed(2),
      total:(sub+ship).toFixed(2),
    });
  },

  onRemark:function(e){this.setData({remark:e.detail.value});},

  loadDefaultAddress:function(){
    var t=this;
    var list=wx.getStorageSync('address_list')||[];
    var def=null;
    for(var i=0;i<list.length;i++){ if(list[i].isDefault){def=list[i];break;} }
    if(!def && list.length>0) def=list[0];
    if(def){
      var parts=(def.region||'').split(' ');
      t.setData({
        address:{
          name:def.name,
          phone:def.phone,
          province:parts[0]||'',
          city:parts[1]||'',
          district:parts[2]||'',
          detail:def.detail
        }
      });
    }
  },
  onShow:function(){ this.loadDefaultAddress(); },
  goAddress:function(){ wx.navigateTo({ url:'/pages/address/index' }); },

  submitOrder:function(){
    var t=this;
    if(!t.data.address){wx.showToast({title:'请选择收货地址',icon:'none'});return;}
    if(t.data.items.length===0){wx.showToast({title:'无商品',icon:'none'});return;}

    /* 先获取微信openid（JSAPI支付必需） */
    app.getOpenid().then(function(openid){
      t.doPay(openid);
    }).catch(function(err){
      console.error('获取openid失败',err);
      /* 获取不到openid时降级为native模式（扫码支付） */
      wx.showModal({
        title:'无法调起微信支付',
        content:'请在微信中打开此页面使用支付功能',
        showCancel:false
      });
    });
  },

  doPay:function(openid){
    var t=this;
    var items=t.data.items;
    if(!items||items.length===0){wx.showToast({title:'无商品',icon:'none'});return;}
    var total=Math.round(Number(t.data.total)*100);/* 转成分 */
    var qty=items.reduce(function(s,i){return s+(i.quantity||1);},0);
    var addr=t.data.address||{};
    var addrText=[addr.province,addr.city,addr.district,addr.detail].filter(Boolean).join(' ');
    var token=wx.getStorageSync('token')||'';

    wx.showLoading({title:'提交中...'});
    /* 第一步：建单落库（拿 order_no，供支付回调对应） */
    wx.request({
      url:'https://colour-choice.art/api/orders/create',
      method:'POST',
      header:{'Content-Type':'application/json','Authorization':'Bearer '+token},
      data:{
        product_id:items[0].id,
        product_title:items[0].name,
        product_image:items[0].image||'',
        product_price:items[0].price||0, /* 分 */
        quantity:qty,
        total_amount:total,             /* 分 */
        contact:(addr.name||'')+' '+(addr.phone||''),
        address:addrText,
        note:t.data.remark||'',
        payment_type:'wechat'
      },
      success:function(cr){
        var cd=cr.data||{};
        if(cd.error||!cd.success){wx.hideLoading();wx.showModal({title:'创建订单失败',content:cd.error||'请重试',showCancel:false});return;}
        var order_no=cd.order&&cd.order.order_no;
        if(!order_no){wx.hideLoading();wx.showModal({title:'创建订单失败',content:'未获取到订单号',showCancel:false});return;}

        /* 第二步：统一下单（复用 order_no，使支付回调能标记该订单已支付） */
        wx.request({
          url:'https://colour-choice.art/api/wechat-pay/unified-order',
          method:'POST',
          data:{
            product_id:items[0].id,
            product_title:items[0].name,
            total_fee:total,
            quantity:qty,
            platform:'mini',
            openid:openid,
            remark:t.data.remark,
            address:JSON.stringify(t.data.address),
            out_trade_no:order_no
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
                /* 清除购物车中已结算商品 */
                var cart=wx.getStorageSync('cart_v2')||[];
                var ids=t.data.items.map(function(i){return i.id;});
                cart=cart.filter(function(c){return ids.indexOf(c.id)<0;});
                wx.setStorageSync('cart_v2',cart);
                wx.showToast({title:'支付成功',icon:'success'});
                setTimeout(function(){wx.redirectTo({url:'/pages/orders/index?status=paid'});},1200);
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
      },
      fail:function(){wx.hideLoading();wx.showToast({title:'网络错误',icon:'none'});}
    });
  }
});
