Page({
  data:{loading:true,list:[]},

  onLoad:function(){this.load();},
  onShow:function(){
    /* 每次显示时刷新 */
    this.load();
  },
  onPullDownRefresh:function(){var t=this;t.load(function(){wx.stopPullDownRefresh();});},

  load:function(cb){
    var t=this;
    var hists=wx.getStorageSync('view_history')||[];
    hists.forEach(function(h){
      if(h.time){
        var d=new Date(h.time);
        var now=Date.now();
        var diff=Math.floor((now-h.time)/60000);
        if(diff<1)h.timeStr='刚刚';
        else if(diff<60)h.timeStr=diff+'分钟前';
        else if(diff<1440)h.timeStr=Math.floor(diff/60)+'小时前';
        else if(diff<43200)h.timeStr=Math.floor(diff/1440)+'天前';
        else{var m=d.getMonth()+1;h.timeStr=d.getFullYear()+'-'+(m<10?'0':'')+m+'-'+(d.getDate()<10?'0':'')+d.getDate();}
      }
      else{h.timeStr='';}
    });
    t.setData({list:hists,loading:false});
    if(cb)cb();
  },

  delOne:function(e){
    var idx=e.currentTarget.dataset.idx;
    var list=this.data.list;
    list.splice(idx,1);
    wx.setStorageSync('view_history',list);
    this.setData({list:list});
  },

  clearAll:function(){
    var t=this;
    wx.showModal({title:'确认清空',content:'确定清空所有浏览记录？',success:function(r){if(r.confirm){t.setData({list:[]});wx.setStorageSync('view_history',[]);}}});
  },

  goShop:function(e){var id=e.currentTarget.dataset.id;if(id)wx.navigateTo({url:'/pages/shop/index?id='+id});},
  goHome:function(){wx.switchTab({url:'/pages/home/index'});},
});
