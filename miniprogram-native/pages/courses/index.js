Page({
  data:{
    activeTab:'course',
    catLabel:'全部分类',
    diffLabel:'全部难度',
    courses:[],
    tools:[],
    loading:true,
  },

  onLoad:function(){this.loadCourses();this.loadTools();},

  swTab:function(e){var t=e.currentTarget.dataset.t;this.setData({activeTab:t});},

  loadCourses:function(){
    var t=this;
    t.setData({loading:true});
    wx.request({
      url:'https://colour-choice.art/api/public/courses?limit=50',
      method:'GET',
      success:function(r){
        var list=[];
        if(r.data&&r.data.data)list=r.data.data||[];
        else if(Array.isArray(r.data))list=r.data||[];
        list.forEach(function(c){
          var p=c.price||0;if(p>=100)p=Math.round(p/100);
          c.price=p;
        });
        t.setData({courses:list,loading:false});
      },
      fail:function(){t.setData({courses:[],loading:false});}
    });
  },

  loadTools:function(){
    var t=this;
    wx.request({
      url:'https://colour-choice.art/api/public/products?category=工具&limit=20',
      method:'GET',
      success:function(r){
        var list=[];
        if(r.data&&r.data.data)list=r.data.data||[];
        else if(Array.isArray(r.data))list=r.data||[];
        list.forEach(function(p){
          var n=Number(p.price)||0;if(n>=100)n=Math.round(n/100);
          p.price=n;
        });
        t.setData({tools:list});
      }
    });
  },

  playCourse:function(e){
    var id=e.currentTarget.dataset.id;
    wx.showModal({title:'课程播放',content:'课程视频播放功能开发中\n\n请关注后续更新',showCancel:false,confirmText:'知道了'});
  },

  goTool:function(e){
    var id=e.currentTarget.dataset.id;
    wx.navigateTo({url:'/pages/shop/index?id='+id});
  },
});
