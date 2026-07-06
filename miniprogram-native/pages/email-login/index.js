Page({
  data:{email:'',pw:''},
  onEmail:function(e){this.setData({email:e.detail.value});},
  onPw:function(e){this.setData({pw:e.detail.value});},
  doLogin:function(){
    var t=this,e=t.data.email.trim(),p=t.data.pw.trim();
    if(!e||!p){wx.showToast({title:'请填写完整',icon:'none'});return;}
    wx.showLoading({title:'登录中...'});
    wx.request({
      url:'https://colour-choice.art/api/auth/login',
      method:'POST',
      data:{email:e,password:p},
      success:function(r){
        wx.hideLoading();
        var d=r.data||{};
        if(d.error){wx.showModal({title:'登录失败',content:d.error,showCancel:false});return;}
        wx.setStorageSync('token',d.token);
        wx.setStorageSync('user_info',{nickName:e.split('@')[0],avatarUrl:''});
        wx.setStorageSync('vip_status','active');
        wx.setStorageSync('is_price_member',!!d.is_price_member);
        wx.showToast({title:'登录成功',icon:'success'});
        setTimeout(function(){wx.navigateBack();},1000);
      },
      fail:function(){
        wx.hideLoading();
        /* 本地兜底 */
        wx.setStorageSync('user_info',{nickName:e.split('@')[0],avatarUrl:''});
        wx.setStorageSync('vip_status','active');
        wx.setStorageSync('is_price_member',true);
        wx.showToast({title:'已登录（本地）',icon:'success'});
        setTimeout(function(){wx.navigateBack();},800);
      }
    });
  },
  goBack:function(){wx.navigateBack();}
});
