var app=getApp();

Page({
  data:{
    tabs:[{key:'unused',label:'未使用'},{key:'used',label:'已使用'},{key:'expired',label:'已过期'}],
    activeTab:'unused',
    list:[],
    loading:true,
  },

  onShow:function(){
    this.loadCoupons();
  },

  switchTab:function(e){
    this.setData({activeTab:e.currentTarget.dataset.tab});
    this.loadCoupons();
  },

  loadCoupons:function(){
    var t=this;
    var ui=wx.getStorageSync('user_info')||{};
    if(!ui.id){
      t.setData({loading:false,list:[]});
      return;
    }
    t.setData({loading:true});
    wx.request({
      url:'https://colour-choice.art/api/coupons?user_id='+ui.id+'&status='+t.data.activeTab,
      method:'GET',
      header:{'Authorization':'Bearer '+(wx.getStorageSync('token')||'')},
      success:function(r){
        var d=r.data||{};
        // 格式化金额显示
        var list=(d.data||[]).map(function(item){
          return {
            id:item.id,
            title:item.title,
            discount_desc:item.discount_desc||'',
            min_amount:item.min_amount||0,
            discount_amount:item.discount_amount||0,
            minLabel:item.min_amount>0?'满'+(item.min_amount/100)+'元':'无门槛',
            discountLabel:'-¥'+(item.discount_amount/100),
            expire_at:item.expire_at||'',
            status:item.status,
            coupon_type:item.coupon_type||'general',
          };
        });
        t.setData({list:list,loading:false});
      },
      fail:function(){t.setData({loading:false,list:[]});}
    });
  },

  /* 使用优惠券：跳转到商城首页 */
  useCoupon:function(e){
    wx.switchTab({url:'/pages/home/index'});
  },

  onPullDownRefresh:function(){
    this.loadCoupons();
    wx.stopPullDownRefresh();
  },
});
