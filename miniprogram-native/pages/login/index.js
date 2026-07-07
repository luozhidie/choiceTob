Page({
  data:{
    agreed:false,
    loading:false
  },

  /* 勾选协议 */
  toggleAgree:function(){
    this.setData({agreed:!this.data.agreed});
  },

  /* ── 微信标准：按钮 open-type=getPhoneNumber 触发此回调 ── */
  onGetPhoneCode:function(e){
    var t=this;
    if(!t.data.agreed){
      wx.showToast({title:'请先同意用户协议',icon:'none'});return;
    }

    var detail=e.detail||{};
    // 用户拒绝授权
    if(detail.errMsg&&detail.errMsg.indexOf('fail')>=0){
      console.warn('[getPhoneNumber] 用户拒绝:',detail.errMsg);
      wx.showModal({
        title:'提示',
        content:'需要授权手机号才能一键登录，是否使用其它方式？',
        confirmText:'其它方式',
        cancelText:'取消',
        success:function(m){if(m.confirm)t.goOtherLogin();}
      });
      return;
    }
    // 获取到 phoneCode
    var phoneCode=detail.code;
    if(!phoneCode){
      wx.showToast({title:'获取手机号失败，请重试',icon:'none'});return;
    }

    // 已有 phoneCode → 开始登录流程
    t.doPhoneLogin(phoneCode);
  },

  /* 用 phoneCode + loginCode 提交后端 */
  doPhoneLogin:function(phoneCode){
    var t=this;
    if(t.data.loading)return;
    t.setData({loading:true});

    /* 超时保护：15秒 */
    var timeoutTimer=setTimeout(function(){
      if(t.data.loading){
        t.setData({loading:false});
        wx.showToast({title:'��录超时，请重试或用其它方式',icon:'none',duration:2500});
      }
    },15000);

    // Step 1: wx.login 获取 loginCode
    wx.login({
      success:function(loginRes){
        if(!loginRes.code){
          clearTimeout(timeoutTimer);
          t.setData({loading:false});
          wx.showToast({title:'获取登录凭证失败',icon:'none'});return;
        }

        // Step 2: 发给后端
        t.handlePhoneCode(loginRes.code,phoneCode,timeoutTimer);
      },
      fail:function(){
        clearTimeout(timeoutTimer);
        t.setData({loading:false});
        wx.showToast({title:'微信登录失败',icon:'none'});
      }
    });
  },

  /* 处理手机号 code（发给后端换手机号+自动注册/登录）*/
  handlePhoneCode:function(loginCode,phoneCode,timeoutTimer){
    var t=this;
    wx.request({
      url:'https://colour-choice.art/api/auth/phone-login',
      method:'POST',
      data:{
        login_code:loginCode,
        phone_code:phoneCode
      },
      success:function(r){
        clearTimeout(timeoutTimer);
        t.setData({loading:false});
        var d=r.data||{};
        if(d.error){
          wx.showModal({title:'登录失败',content:d.error,showCancel:false});return;
        }

        /* 登录成功：保存状态 */
        var u=d.user||{};
        wx.setStorageSync('token',d.token);
        wx.setStorageSync('user_info',{
          nickName:u.phone_number||u.nickName||'用户',
          avatarUrl:u.avatarUrl||'',
          phone:u.phone_number||''
        });
        wx.setStorageSync('vip_status',u.vip_status||'');
        wx.setStorageSync('member_type',u.membership_type||'');
        wx.setStorageSync('vip_level',u.vip_level||'');
        wx.setStorageSync('vip_expire',u.membership_expires_at||'');
        wx.setStorageSync('is_price_member',!!(u.membership_type==='view_price'));
        wx.setStorageSync('is_certified_store_owner',!!u.store_owner_certified);
        wx.setStorageSync('certified_style',u.certified_style||'');

        /* 全局状态同步 */
        var app=getApp();
        if(app&&app.globalData){
          app.globalData.isPriceMember=!!(u.membership_type==='view_price');
          app.globalData.isCertifiedStoreOwner=!!u.store_owner_certified;
        }

        wx.showToast({title:'登录成功 ✓',icon:'success'});
        setTimeout(function(){wx.navigateBack();},1200);
      },
      fail:function(err){
        clearTimeout(timeoutTimer);
        t.setData({loading:false});
        console.error('[handlePhoneCode] request fail:',err);
        wx.showToast({title:'网络异常，请重试',icon:'none'});
      }
    });
  },

  /* 使用其它方式登录 */
  goOtherLogin:function(){
    wx.navigateTo({url:'/pages/email-login/index'});
  },

  /* 协议链接 */
  goAgreement:function(){
    wx.showModal({
      title:'用户服务协议',
      content:'欢迎使用骆芷蝶智选平台。\n\n本平台为服装批发B2B平台，提供商品浏览、批发价查看、在线下单等服务。\n\n注册/登录即表示您已阅读并同意《用户服务协议》与《隐私政策》。',
      showCancel:false,
      confirmText:'我知道了'
    });
  },

  goPrivacy:function(){
    wx.showModal({
      title:'隐私政策',
      content:'我们重视您的隐私保护。您的手机号仅用于账号识别和订单联系，不会向第三方泄露。\n\n详细隐私条款请访问 colour-choice.art 查看。',
      showCancel:false,
      confirmText:'我知道了'
    });
  },

  goHome:function(){wx.switchTab({url:'/pages/home/index'});},
});
