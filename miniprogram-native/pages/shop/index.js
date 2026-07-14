var app = getApp();

Page({
  data:{
    productId:'',
    product:null,
    images:[],
    priceText:'',
    originalPriceText:'',
    discountText:'',
    wholesalePriceText:'',   // 批发价显示文本
    isPriceMember:false,      // 是否为价格会员
    quantity:1,
    cartCount:0,
    isFav:false,
    activeTab:'detail',
    specList:[],
    reviews:[],
    recList:[],
    tryonLoading:false,
    tryonResult:'',
    tryonIsDemo:false,
    showTryon:false,
  },

  onLoad:function(opt){
    var app = getApp();
    this.setData({
      productId:opt.id||'',
      isPriceMember: !!(app && app.globalData && app.globalData.isPriceMember)
    });
    this.loadProduct(opt.id);
    this.loadCartCount();
    this.loadFav(opt.id);
  },

  loadProduct:function(id){
    var t=this;
    wx.request({
      url:'https://colour-choice.art/api/public/products?limit=1&id='+id,
      method:'GET',
      success:function(r){
        var p=null;
        if(r.data&&r.data.data&&r.data.data.length>0)p=r.data.data[0];
        else if(Array.isArray(r.data))p=r.data[0];
        if(!p)return;
        var images=[];
        if(p.image_url)images.push(p.image_url);
        if(p.images&&Array.isArray(p.images))images=images.concat(p.images);
        if(images.length===0)images=[''];
        /* 零售价 */
        var price=Number(p.price)||0;
        if(price>=100)price=Math.round(price/100);
        var ori=p.original_price?Number(p.original_price):0;
        if(ori>=100)ori=Math.round(ori/100);
        var disc='';
        if(ori>0&&price>0)disc='省¥'+(ori-price);
        /* 批发价（分单位，需/100展示） */
        var isPriceMember = t.data.isPriceMember;
        var wholesaleText = '';
        var wp = Number(p.wholesale_price)||0;
        if(wp > 0){
          if(isPriceMember){
            wholesaleText = '¥' + Math.round(wp/100);
          } else {
            wholesaleText = '¥???';
          }
        }
        /* 规格 */
        var specList=[];
        if(p.category)specList.push({label:'分类',value:p.category});
        if(p.material)specList.push({label:'材质',value:p.material});
        if(p.size)specList.push({label:'尺码',value:p.size});
        if(p.color)specList.push({label:'颜色',value:p.color});
        /* 推荐 */
        t.setData({
          product:p,
          images:images,
          priceText:price?'¥'+price:'¥0',
          originalPriceText:ori?'¥'+ori:'',
          discountText:disc,
          wholesalePriceText:wholesaleText,
          specList:specList,
        });
        t.loadReviews(id);
        t.loadRec(p.category,id);
      }
    });
  },

  loadReviews:function(id){
    var t=this;
    wx.request({
      url:'https://colour-choice.art/api/public/reviews?product_id='+id+'&limit=10',
      method:'GET',
      success:function(r){
        var list=[];
        if(r.data&&r.data.data)list=r.data.data||[];
        t.setData({reviews:list});
      }
    });
  },

  loadRec:function(cat,excludeId){
    var t=this;
    var url='https://colour-choice.art/api/public/products?limit=10';
    if(cat)url+='&category='+encodeURIComponent(cat);
    wx.request({
      url:url,
      method:'GET',
      success:function(r){
        var list=[];
        if(r.data&&r.data.data)list=r.data.data||[];
        else if(Array.isArray(r.data))list=r.data;
        if(excludeId)list=list.filter(function(x){return x.id!==excludeId;});
        list.forEach(function(p){var n=Number(p.price)||0;if(n>=100)n=Math.round(n/100);p.priceLabel='¥'+n;});
        t.setData({recList:list.slice(0,6)});
      }
    });
  },

  loadCartCount:function(){
    var cart=wx.getStorageSync('cart')||[];
    var count=0;
    cart.forEach(function(i){count+=(i.quantity||1);});
    this.setData({cartCount:count});
  },

  loadFav:function(id){
    var favs=wx.getStorageSync('favorites')||[];
    this.setData({isFav:favs.indexOf(id)>=0});
  },

  toggleFav:function(){
    var id=this.data.productId;
    if(!id)return;
    var favs=wx.getStorageSync('favorites')||[];
    var idx=favs.indexOf(id);
    if(idx>=0){favs.splice(idx,1);this.setData({isFav:false});wx.showToast({title:'已取消收藏',icon:'none'});}
    else{favs.push(id);this.setData({isFip:true});wx.showToast({title:'已收藏',icon:'success'});}
    wx.setStorageSync('favorites',favs);
  },

  swTab:function(e){this.setData({activeTab:e.currentTarget.dataset.t});},

  inc:function(){this.setData({quantity:this.data.quantity+1});},
  dec:function(){var q=this.data.quantity-1;if(q<1)q=1;this.setData({quantity:q});},

  addCart:function(){
    var t=this;
    var p=this.data.product;
    if(!p)return;
    var cart=wx.getStorageSync('cart')||[];
    var idx=-1;
    cart.forEach(function(i,ii){if(i.id===p.id)idx=ii;});
    if(idx>=0){cart[idx].quantity=(cart[idx].quantity||1)+t.data.quantity;}
    else{cart.push({id:p.id,title:p.title||p.name,price:(Number(p.price)>=100?Math.round(Number(p.price)/100):Number(p.price)),image:p.image_url||'',quantity:t.data.quantity});}
    wx.setStorageSync('cart',cart);
    t.loadCartCount();
    wx.showToast({title:'已加购物车',icon:'success'});
  },

  buyNow:function(){
    var t=this;
    var p=this.data.product;
    if(!p)return;

    /* 先获取openid */
    app.getOpenid().then(function(openid){
      wx.showLoading({title:'调起支付...'});
      wx.request({
        url:'https://colour-choice.art/api/wechat-pay/unified-order',
        method:'POST',
        data:{
          product_id:p.id,
          product_title:p.title||p.name,
          total_fee:Number(p.price),
          quantity:t.data.quantity,
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
            success:function(){wx.showToast({title:'支付成功',icon:'success'});setTimeout(function(){wx.navigateBack();},1500);},
            fail:function(err){if(!(err&&err.errMsg&&err.errMsg.indexOf('cancel')>-1)){wx.showToast({title:'支付取消',icon:'none'});}}
          });
        },
        fail:function(){wx.hideLoading();wx.showToast({title:'网络错误',icon:'none'});}
      });
    }).catch(function(){
      wx.showToast({title:'无法调起微信支付',icon:'none'});
    });
  },

  goCart:function(){wx.switchTab({url:'/pages/cart/index'});},
  goShop:function(e){var id=e.currentTarget.dataset.id;if(id)wx.navigateTo({url:'/pages/shop/index?id='+id});},
  goVip:function(){wx.navigateTo({url:'/pages/vip/index'});},

  onTryOn:function(){
    var t=this;
    var images=t.data.images||[];
    var garment=images[0]||(t.data.product&&t.data.product.image_url)||'';
    if(!garment){wx.showToast({title:'暂无商品图',icon:'none'});return;}
    wx.chooseMedia({
      count:1,
      mediaType:['image'],
      sourceType:['album','camera'],
      success:function(res){
        var personPath=res.tempFiles[0].tempFilePath;
        t.setData({tryonLoading:true});
        wx.uploadFile({
          url:'https://embodied-ai-eight.vercel.app/api/virtual-tryon',
          filePath:personPath,
          name:'personImage',
          formData:{ garmentImageUrl: garment, industry:'clothing' },
          success:function(up){
            var data={};
            try{data=JSON.parse(up.data);}catch(e){}
            if(data.ok){
              t.setData({tryonLoading:false, tryonResult:data.resultUrl, tryonIsDemo:(data.resultUrl||'').indexOf('data:image')===0, showTryon:true});
            }else{
              t.setData({tryonLoading:false});
              wx.showToast({title:(data.error||'试穿失败'),icon:'none'});
            }
          },
          fail:function(){
            t.setData({tryonLoading:false});
            wx.showToast({title:'试穿请求失败',icon:'none'});
          }
        });
      }
    });
  },

  closeTryon:function(){this.setData({showTryon:false});},
  stopProp:function(){},
});
