Page({
  data:{
    keyword:'',
    viewMode:'list',
    activeTab:'全部',
    sortType:'default',
    products:[],
    loading:true,
    hasMore:true,
    page:1,
    isPriceMember:false,  // 价格会员状态
  },

  onLoad:function(){
    this.refreshAuth();
    this.load();
  },

  onShow:function(){
    this.refreshAuth();
  },

  refreshAuth:function(){
    var app = getApp();
    var isCertified = !!wx.getStorageSync('is_certified_store_owner');
    this.setData({
      isPriceMember: !!(app && app.globalData && app.globalData.isPriceMember) || isCertified
    });
  },
  onPullDownRefresh:function(){var t=this;t.setData({page:1,hasMore:true});t.load(function(){wx.stopPullDownRefresh();});},
  onReachBottom:function(){if(!this.data.hasMore||this.data.loading)return;this.setData({page:this.data.page+1});this.loadMore();},

  buildUrl:function(){
    var url='https://colour-choice.art/api/public/products?limit=20';
    var t=this;
    if(t.data.keyword)url+='&keyword='+encodeURIComponent(t.data.keyword);
    if(t.data.activeTab!=='全部')url+='&category='+encodeURIComponent(t.data.activeTab);
    /* 排序 */
    if(t.data.sortType==='sales')url+='&sort=sales';
    else if(t.data.sortType==='price_asc')url+='&sort=price_asc';
    else if(t.data.sortType==='price_desc')url+'&sort=price_desc';
    else if(t.data.sortType==='newest')url+='&sort=newest';
    return url;
  },

  load:function(cb){
    var t=this;
    t.setData({loading:true});
    wx.request({
      url:this.buildUrl(),
      method:'GET',
      success:function(r){
        var list=[];
        if(r.data&&r.data.success&&r.data.data)list=r.data.data||[];
        else if(Array.isArray(r.data))list=r.data;
        var isPriceMember = t.data.isPriceMember;
        list.forEach(function(p){
          var n=Number(p.price)||0;if(n>=100)n=Math.round(n/100);
          var wp=Number(p.wholesale_price)||0;if(wp>=100)wp=Math.round(wp/100);
          if(isPriceMember && wp>0){
            // 会员（含认证店主）：主价显示批发价，不显示零售价
            p.priceText='\u00A5'+(wp%1===0?wp:wp.toFixed(2));
            p.wholesalePriceText='';
          } else {
            p.priceText='\u00A5'+(n%1===0?n:n.toFixed(2));
            p.wholesalePriceText = wp>0 ? '\u00A5???' : '';
          }
        });
        t.setData({products:list,hasMore:list.length>=20});
      },
      fail:function(){},
      complete:function(){t.setData({loading:false});if(cb)cb();}
    });
  },

  loadMore:function(){
    var t=this;
    t.setData({loading:true});
    var base=this.buildUrl();
    wx.request({
      url:base+'&offset='+(t.data.page*20),
      method:'GET',
      success:function(r){
        var list=[];
        if(r.data&&r.data.success&&r.data.data)list=r.data.data||[];
        else if(Array.isArray(r.data))list=r.data;
        var isPriceMember = t.data.isPriceMember;
        list.forEach(function(p){
          var n=Number(p.price)||0;if(n>=100)n=Math.round(n/100);
          var wp=Number(p.wholesale_price)||0;if(wp>=100)wp=Math.round(wp/100);
          if(isPriceMember && wp>0){
            // 会员（含认证店主）：主价显示批发价，不显示零售价
            p.priceText='\u00A5'+(wp%1===0?wp:wp.toFixed(2));
            p.wholesalePriceText='';
          } else {
            p.priceText='\u00A5'+(n%1===0?n:n.toFixed(2));
            p.wholesalePriceText = wp>0 ? '\u00A5???' : '';
          }
        });
        t.setData({products:t.data.products.concat(list),hasMore:list.length>=20});
      },
      complete:function(){t.setData({loading:false});}
    });
  },

  onSearchInput:function(e){this.setData({keyword:e.detail.value});},
  doSearch:function(){this.setData({page:1});this.load();},
  clearSearch:function(){this.setData({keyword:''});this.setData({page:1});this.load();},

  switchViewMode:function(){this.setData({viewMode:this.data.viewMode==='list'?'grid':'list'});},
  switchTab:function(e){this.setData({activeTab:e.currentTarget.dataset.tab,page:1});this.load();},

  setSort:function(e){
    var s=e.currentTarget.dataset.sort;
    if(s==='price'&&this.data.sortType==='price_asc')s='price_desc';
    else if(s==='price')s='price_asc';
    this.setData({sortType:s,page:1});
    this.load();
  },

  goShop:function(e){var id=e.currentTarget.dataset.id;if(id)wx.navigateTo({url:'/pages/shop/index?id='+id});},

  goCertify:function(){wx.navigateTo({url:'/pages/certify/index'});},

  goHome:function(){wx.switchTab({url:'/pages/home/index'});},

  addToCart:function(e){
    var p=e.currentTarget.dataset.product;
    if(!p)return;
    var cart=wx.getStorageSync('cart_v2')||[];
    var ex=cart.find(function(c){return c.id===p.id;});
    if(ex)ex.quantity+=1;
    else cart.push({id:p.id,name:p.name||p.title,price:p.price,wholesale_price:Number(p.wholesale_price)||0,image:p.image_url||p.cover_image,quantity:1});
    wx.setStorageSync('cart_v2',cart);
    wx.showToast({title:'已加购',icon:'success',duration:800});
  },
});
