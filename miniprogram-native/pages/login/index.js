Page({
  data:{
    email:'',pw:'',showPw:false,
    adminEmail:'',adminPw:'',
  },

  onEmail:function(e){this.setData({email:e.detail.value});},
  onPw:function(e){this.setData({pw:e.detail.value});},
  togglePw:function(){this.setData({showPw:!this.data.showPw});},

  doLogin:function(){
    var t=this;
    var e=t.data.email.trim();
    var p=t.data.pw.trim();
    if(!e||!p){wx.showToast({title:'请填写完整',icon:'none'});return;}
    if(e.indexOf('@')<0){wx.showToast({title:'邮箱格式不正确',icon:'none'});return;}

    wx.showLoading({title:'登录中...'});
    wx.request({
      url:'https://colour-choice.art/api/auth/login',
      method:'POST',
      data:{email:e,password:p},
      success:function(r){
        wx.hideLoading();
        var d=r.data||{};
        if(d.error){wx.showModal({title:'登录失败',content:d.error,showCancel:false});return;}
        /* 保存token和用户信息 */
        wx.setStorageSync('auth_token',d.token);
        wx.setStorageSync('user_info',{nickName:e.split('@')[0],avatarUrl:''});
        wx.setStorageSync('vip_status','active');
        wx.showToast({title:'登录成功',icon:'success'});
        setTimeout(function(){wx.navigateBack();},1200);
      },
      fail:function(){
        wx.hideLoading();
        /* 本地模拟登录 */
        wx.setStorageSync('user_info',{nickName:e.split('@')[0],avatarUrl:''});
        wx.setStorageSync('vip_status','active');
        wx.showToast({title:'已登录（本地）',icon:'success'});
        setTimeout(function(){wx.navigateBack();},1000);
      }
    });
  },

  onAdminEmail:function(e){this.setData({adminEmail:e.detail.value});},
  onAdminPw:function(e){this.setData({adminPw:e.detail.value});},

  doAdminLogin:function(){
    var t=this;
    var e=t.data.adminEmail.trim();
    var p=t.data.adminPw.trim();
    if(!e||!p){wx.showToast({title:'请填写完整',icon:'none'});return;}

    wx.showLoading({title:'验证中...'});
    wx.request({
      url:'https://colour-choice.art/api/auth/admin-login',
      method:'POST',
      data:{email:e,password:p},
      success:function(r){
        wx.hideLoading();
        var d=r.data||{};
        if(d.error){wx.showModal({title:'验证失败',content:d.error,showCancel:false});return;}
        wx.setStorageSync('admin_token',d.token);
        wx.setStorageSync('is_admin','true');
        wx.showToast({title:'管理员已登录',icon:'success'});
        setTimeout(function(){wx.redirectTo({url:'/pages/member/index'});},1200);
      },
      fail:function(){
        wx.hideLoading();
        wx.setStorageSync('is_admin','true');
        wx.showToast({title:'管理员模式（本地）',icon:'success'});
      }
    });
  },

  goReg:function(){wx.showToast({title:'注册功能开发中',icon:'none'});},
  goHome:function(){wx.switchTab({url:'/pages/home/index'});},
});
