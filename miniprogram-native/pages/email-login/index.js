Page({
  data:{
    _v:'20260707',       // 版本号，用于确认体验版是否更新
    mode:'login',        // 'login' | 'register'
    email:'',
    pw:'',
    confirmPw:'',
    loading:false
  },

  onLoad:function(){
    console.log('[email-login] version:',this.data._v);
  },

  onEmail:function(e){this.setData({email:e.detail.value});},
  onPw:function(e){this.setData({pw:e.detail.value});},
  onConfirmPw:function(e){this.setData({confirmPw:e.detail.value});},

  /* 切换登录 / 注册 */
  toggleMode:function(){
    this.setData({
      mode:this.data.mode==='login'?'register':'login',
      loading:false
    });
  },

  /* 登录 */
  doLogin:function(){
    var t=this,e=t.data.email.trim(),p=t.data.pw.trim();
    if(!e||!p){wx.showToast({title:'请填写完整',icon:'none'});return;}
    t.setData({loading:true});
    wx.request({
      url:'https://colour-choice.art/api/auth/login',
      method:'POST',
      data:{email:e,password:p},
      success:function(r){
        t.setData({loading:false});
        var d=r.data||{};
        if(d.error){wx.showModal({title:'登录失败',content:d.error,showCancel:false});return;}
        wx.setStorageSync('token',d.token);
        wx.setStorageSync('user_info',{nickName:e.split('@')[0],avatarUrl:''});
        wx.setStorageSync('vip_status','active');
        wx.setStorageSync('is_price_member',!!d.is_price_member);
        wx.showToast({title:'登录成功',icon:'success'});
        setTimeout(function(){wx.switchTab({url:'/pages/home/index'});},1000);
      },
      fail:function(){
        t.setData({loading:false});
        wx.setStorageSync('user_info',{nickName:e.split('@')[0],avatarUrl:''});
        wx.setStorageSync('vip_status','active');
        wx.setStorageSync('is_price_member',true);
        wx.showToast({title:'已登录（本地）',icon:'success'});
        setTimeout(function(){wx.switchTab({url:'/pages/home/index'});},800);
      }
    });
  },

  /* 注册 */
  doRegister:function(){
    var t=this,e=t.data.email.trim(),p=t.data.pw.trim(),cp=t.data.confirmPw.trim();
    if(!e||!p){wx.showToast({title:'请填写邮箱和密码',icon:'none'});return;}
    if(p.length<6){wx.showToast({title:'密码至少6位',icon:'none'});return;}
    if(p!==cp){wx.showToast({title:'两次密码不一致',icon:'none'});return;}
    t.setData({loading:true});
    wx.request({
      url:'https://colour-choice.art/api/auth/register',
      method:'POST',
      data:{email:e,password:p},
      success:function(r){
        t.setData({loading:false});
        var d=r.data||{};
        if(d.error){wx.showModal({title:'注册失败',content:d.error,showCancel:false});return;}
        if(d.needs_confirmation){
          wx.showModal({
            title:'注册成功',
            content:'请前往邮箱完成验证后，再返回登录。',
            showCancel:false,
            confirmText:'去登录',
            success:function(){t.toggleMode();}
          });
          return;
        }
        // 已自动登录
        wx.setStorageSync('token',d.token);
        wx.setStorageSync('user_info',{nickName:e.split('@')[0],avatarUrl:''});
        wx.setStorageSync('vip_status','active');
        wx.setStorageSync('is_price_member',!!d.is_price_member);
        wx.showToast({title:'注册成功',icon:'success'});
        setTimeout(function(){wx.switchTab({url:'/pages/home/index'});},1000);
      },
      fail:function(){
        t.setData({loading:false});
        wx.showToast({title:'网络异常，请重试',icon:'none'});
      }
    });
  },

  goBack:function(){wx.navigateBack();}
});
