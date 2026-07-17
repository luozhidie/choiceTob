var app=getApp();

Page({
  data:{
    tabs:[{key:'unused',label:'未使用'},{key:'used',label:'已使用'},{key:'expired',label:'已过期'}],
    activeTab:'unused',
    list:[],
    loading:true,
  },

  onShow:function(){ this.loadPackets(); },

  switchTab:function(e){
    this.setData({activeTab:e.currentTarget.dataset.tab});
    this.loadPackets();
  },

  loadPackets:function(){
    var t=this;
    var token=wx.getStorageSync('token')||'';
    if(!token){ t.setData({loading:false,list:[]}); return; }
    t.setData({loading:true});
    wx.request({
      url:'https://colour-choice.art/api/red-packets?status='+t.data.activeTab,
      method:'GET',
      header:{'Authorization':'Bearer '+token},
      success:function(r){
        var d=(r.data||{}).data||[];
        t.setData({list:d,loading:false});
      },
      fail:function(){t.setData({loading:false,list:[]});}
    });
  },

  useRedPacket:function(e){
    wx.switchTab({url:'/pages/home/index'});
  },

  onPullDownRefresh:function(){
    this.loadPackets();
    wx.stopPullDownRefresh();
  },
});
