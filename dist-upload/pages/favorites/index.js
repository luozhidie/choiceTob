Page({
  data:{list:[],loading:true},

  onShow:function(){this.load();},

  load:function(){
    var t=this;
    t.setData({loading:true});
    var favs=wx.getStorageSync('favorites')||[];
    if(favs.length===0){t.setData({list:[],loading:false});return;}
    /* 批量查商品 */
    var ids=favs.join(',');
    wx.request({
      url:'https://colour-choice.art/api/public/products?limit=50',
      method:'GET',
      success:function(r){
        var list=[];
        if(r.data&&r.data.data)list=r.data.data||[];
        else if(Array.isArray(r.data))list=r.data;
        /* 只保留收藏的 */
        list=list.filter(function(p){return favs.indexOf(p.id)>=0;});
        list.forEach(function(p){
          var n=Number(p.price)||0;if(n>=100)n=Math.round(n/100);
          p.price=n;p.name=p.title||p.name;
        });
        t.setData({list:list,loading:false});
      },
      fail:function(){t.setData({loading:false});}
    });
  },

  delOne:function(e){
    var id=e.currentTarget.dataset.id;
    var favs=wx.getStorageSync('favorites')||[];
    favs=favs.filter(function(x){return x!==id;});
    wx.setStorageSync('favorites',favs);
    this.load();
  },

  goShop:function(e){var id=e.currentTarget.dataset.id;if(id)wx.navigateTo({url:'/pages/shop/index?id='+id});},
  goBuyer:function(){wx.switchTab({url:'/pages/buyer/index'});},
});
