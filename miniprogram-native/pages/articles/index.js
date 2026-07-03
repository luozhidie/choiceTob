Page({
  data:{
    cats:['全部','流行趋势','行业动态','选品攻略','穿搭灵感'],
    activeCat:'全部',
    loading:true,
    articles:[],
  },

  onLoad:function(){this.load();},
  onPullDownRefresh:function(){var t=this;this.load(function(){wx.stopPullDownRefresh();});},

  swCat:function(e){this.setData({activeCat:e.currentTarget.dataset.c});this.load();},

  load:function(cb){
    var t=this;
    t.setData({loading:true,articles:[]});
    var url='https://colour-choice.art/api/public/articles?limit=20';
    if(t.data.activeCat!=='全部')url+='&category='+encodeURIComponent(t.data.activeCat);
    wx.request({
      url:url,
      method:'GET',
      success:function(r){
        var list=[];
        if(r.data&&r.data.data)list=r.data.data||[];
        else if(Array.isArray(r.data))list=r.data;
        t.setData({articles:list,loading:false});
      },
      fail:function(){t.setData({loading:false});},
      complete:function(){if(cb)cb();}
    });
  },

  goDetail:function(e){
    var id=e.currentTarget.dataset.id;
    /* 文章详情暂用 web-view 或弹窗展示 */
    wx.showModal({
      title:'文章详情',
      content:'即将跳转到文章详情页（开发中）\n\n文章ID: '+id,
      showCancel:false,
      confirmText:'返回'
    });
  }
});
