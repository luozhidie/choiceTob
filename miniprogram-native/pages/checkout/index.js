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
    var cart=wx.getStorageSync('cart')||[];
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
              var n=Number(p.price)||0;if(n>=100)n=Math.round(n/100);
              items=[{id:p.id,name:p.title||p.name,price:p.price,priceText:n,image:p.image_url||'',quantity:Number(opt.quantity)||1}];
              wx.setStorageSync('checkout_items',items);
            }
          },complete:function(){this.calc();}.bind(this)
        });
      }
    }else{
      /* 格式化价格 */
      items.forEach(function(i){
        var p=Number(i.price)||0;if(p>=100)p=Math.round(p/100);
        i.priceText=p;
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

  goAddress:function(){
    var t=this;
    wx.chooseAddress({
      success:function(res){
        t.setData({
          address:{
            name:res.userName,
            phone:res.telNumber,
            province:res.provinceName,
            city:res.cityName,
            district:res.countyName,
            detail:res.detailInfo,
          }
        });
      },
      fail:function(){wx.showToast({title:'请授权地址',icon:'none'});}
    });
  },

  submitOrder:function(){
    var t=this;
    if(!t.data.address){wx.showToast({title:'请选择收货地址',icon:'none'});return;}
    if(t.data.items.length===0){wx.showToast({title:'无商品',icon:'none'});return;}

    wx.showLoading({title:'提交中...'});
    var items=t.data.items;
    var total=Math.round(Number(t.data.total)*100);/* 转成分 */
    wx.request({
      url:'https://colour-choice.art/api/wechat-pay/unified-order',
      method:'POST',
      data:{
        product_id:items[0].id,
        product_title:items[0].name,
        total_fee:total,
        quantity:items.reduce(function(s,i){return s+(i.quantity||1);},0),
        platform:'mini',
        remark:t.data.remark,
        address:JSON.stringify(t.data.address),
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
            var cart=wx.getStorageSync('cart')||[];
            var ids=t.data.items.map(function(i){return i.id;});
            cart=cart.filter(function(c){return ids.indexOf(c.id)<0;});
            wx.setStorageSync('cart',cart);
            wx.showToast({title:'支付成功',icon:'success'});
            setTimeout(function(){wx.redirectTo({url:'/pages/orders/index?status=paid'});},1200);
          },
          fail:function(){wx.showToast({title:'支付取消',icon:'none'});}
        });
      },
      fail:function(){wx.hideLoading();wx.showToast({title:'网络错误',icon:'none'});}
    });
  }
});
