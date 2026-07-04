Page({
  data:{
    /* 模式：free / female / male */
    testMode:'free',
    testTitle:'免费色彩风格问卷',
    testDesc:'13道基础题 · 免费 · 结果 same day 微信通知',
    tipText:'提示：免费问卷提供基础风格建议，专业版含 17 道深度诊断 + AI 色彩匹配报告',

    /* 免费问卷 */
    form:{
      name:'',wechat:'',age:'',group:'',
      q5:'',q7:'',q8:'',q9:'',q10:'',q11:'',q12:'',q13:'',q14:'',height:''
    },
    canSubmit:false,

    /* 女士测试 */
    fForm:{
      name:'',wechat:'',age:'',
      q5:'',height:'',q8:'',q9:'',q10:'',q14:''
    },

    /* 男士测试 */
    mForm:{
      name:'',wechat:'',age:'',
      q5:'',height:'',q8:'',q9:''
    },

    canPay:false,   // 付费表单是否可提交

    /* 公共选项 */
    optAgeLook:['显老','差不多','显年轻'],
    optHeightVisual:['A. 显高','B. 显矮','C. 正常'],
    optBodyType:['偏瘦','标准','偏胖','丰满'],
    optFaceType:['圆脸','方脸','鹅蛋脸','长脸','瓜子脸'],
    optSkinColor:['白皙','自然黄','小麦色','暗沉'],
    optDevlop:['会早些','正常发育','较晚'],
    optSkinAfterWash:['会','不会'],
    optBlush:['容易','不容易'],
    optStylePref:['简约中性','甜美可爱','知性优雅','时尚前卫','运动休闲','复古文艺'],
    optStylePrefMale:['简约干净','商务正装','街头潮流','运动休闲','工装硬汉','复古文艺'],
  },

  /* ========== 模式切换 ========== */
  swMode:function(e){
    var m = e.currentTarget.dataset.m;
    var t = '', d = '', tip = '';
    if(m==='free'){t='免费色彩风格问卷';d='13道基础题 · 免费 · 结果 same day 微信通知';tip='提示：免费问卷提供基础风格建议，专业版含 17 道深度诊断 + AI 色彩匹配报告';}
    if(m==='female'){t='女士风格专业诊断';d='17道深度诊断题 · ¥99 · 含 AI 色彩匹配报告';tip='提示：专业诊断含体型/脸型/肤色/发育综合分析，结果 24h 内微信通知';}
    if(m==='male'){t='男士风格专业诊断';d='14道深度诊断题 · ¥99 · 含穿搭建议方案';tip='提示：男士版专注体型/身高/风格偏好，结果 24h 内微信通知';}
    this.setData({testMode:m,testTitle:t,testDesc:d,tipText:tip});
  },

  /* ========== 免费问卷 handlers ========== */
  onName:function(e){this.setF('name',e.detail.value);},
  onWechat:function(e){this.setF('wechat',e.detail.value);},
  onAge:function(e){this.setF('age',e.detail.value);},
  onGroup:function(e){this.setF('group',e.detail.value);},
  onHeight:function(e){this.setF('height',e.detail.value);},

  setF:function(k,v){
    var f=this.data.form;f[k]=v;
    this.setData({form:f});
    this.checkSubmit();
  },

  pickQ5:function(e){this.setF('q5',e.currentTarget.dataset.v);},
  pickQ7:function(e){this.setF('q7',e.currentTarget.dataset.v);},
  pickQ8:function(e){this.setF('q8',e.currentTarget.dataset.v);},
  pickQ9:function(e){this.setF('q9',e.currentTarget.dataset.v);},
  pickQ10:function(e){this.setF('q10',e.currentTarget.dataset.v);},
  pickQ11:function(e){this.setF('q11',e.currentTarget.dataset.v);},
  pickQ12:function(e){this.setF('q12',e.currentTarget.dataset.v);},
  pickQ13:function(e){this.setF('q13',e.currentTarget.dataset.v);},
  pickQ14:function(e){this.setF('q14',e.currentTarget.dataset.v);},

  checkSubmit:function(){
    var f=this.data.form;
    this.setData({
      canSubmit:!!(f.name&&f.wechat&&f.age&&f.group&&f.q5&&f.q7&&f.height&&f.q11&&f.q12&&f.q13)
    });
  },

  submitQuiz:function(){
    if(!this.data.canSubmit){wx.showToast({title:'请填写必填项',icon:'none'});return;}
    wx.showLoading({title:'提交中...'});
    var t=this;
    setTimeout(function(){
      wx.hideLoading();
      wx.showModal({
        title:'提交成功',
        content:'我们将在24小时内通过微信（'+t.data.form.wechat+'）发送你的色彩风格诊断结果\n\n感谢参与！',
        showCancel:false,confirmText:'知道了',
        success:function(){t.resetForm();}
      });
    },800);
  },

  resetForm:function(){
    this.setData({
      form:{name:'',wechat:'',age:'',group:'',q5:'',q7:'',q8:'',q9:'',q10:'',q11:'',q12:'',q13:'',q14:'',height:''},
      canSubmit:false
    });
  },

  /* ========== 女士测试 handlers ========== */
  onFName:function(e){this.setFF('name',e.detail.value);},
  onFWechat:function(e){this.setFF('wechat',e.detail.value);},
  onFAge:function(e){this.setFF('age',e.detail.value);},
  onFHeight:function(e){this.setFF('height',e.detail.value);},

  setFF:function(k,v){
    var f=this.data.fForm;f[k]=v;
    this.setData({fForm:f});
    this.checkPay();
  },

  pickFQ5:function(e){this.setFF('q5',e.currentTarget.dataset.v);},
  pickFQ8:function(e){this.setFF('q8',e.currentTarget.dataset.v);},
  pickFQ9:function(e){this.setFF('q9',e.currentTarget.dataset.v);},
  pickFQ10:function(e){this.setFF('q10',e.currentTarget.dataset.v);},
  pickFQ14:function(e){this.setFF('q14',e.currentTarget.dataset.v);},

  checkPay:function(){
    var f=this.data.fForm;
    this.setData({canPay:!!(f.name&&f.wechat&&f.age&&f.q5&&f.height&&f.q8&&f.q9&&f.q10&&f.q14)});
  },

  submitFemale:function(){
    if(!this.data.canPay){wx.showToast({title:'请填写必填项',icon:'none'});return;}
    this.requestPay('test_female', 9900, this.data.fForm);
  },

  /* ========== 男士测试 handlers ========== */
  onMName:function(e){this.setFM('name',e.detail.value);},
  onMWechat:function(e){this.setFM('wechat',e.detail.value);},
  onMAge:function(e){this.setFM('age',e.detail.value);},
  onMHeight:function(e){this.setFM('height',e.detail.value);},

  setFM:function(k,v){
    var f=this.data.mForm;f[k]=v;
    this.setData({mForm:f});
    this.checkPayMale();
  },

  pickMQ5:function(e){this.setFM('q5',e.currentTarget.dataset.v);},
  pickMQ8:function(e){this.setFM('q8',e.currentTarget.dataset.v);},
  pickMQ9:function(e){this.setFM('q9',e.currentTarget.dataset.v);},

  checkPayMale:function(){
    var f=this.data.mForm;
    this.setData({canPay:!!(f.name&&f.wechat&&f.age&&f.q5&&f.height&&f.q8&&f.q9)});
  },

  submitMale:function(){
    if(!this.data.canPay){wx.showToast({title:'请填写必填项',icon:'none'});return;}
    this.requestPay('test_male', 9900, this.data.mForm);
  },

  /* ========== 微信支付 ========== */
  requestPay:function(planId, amount, formData){
    var t = this;
    wx.showLoading({title:'发起支付...'});

    wx.request({
      url:'https://colour-choice.art/api/wechat-pay/unified-order',
      method:'POST',
      header:{'Content-Type':'application/json'},
      data:{
        plan_id:planId,
        total_fee:amount,
        body: t.data.testMode==='female' ? '女士风格专业诊断' : '男士风格专业诊断',
        platform:'mini',
        openid: wx.getStorageSync('openid') || '',
        form_data: formData
      },
      success:function(res){
        wx.hideLoading();
        var d = res.data;
        if(d && d.payParams){
          wx.requestPayment({
            timeStamp:d.payParams.timeStamp,
            nonceStr:d.payParams.nonceStr,
            package:d.payParams.package,
            signType:d.payParams.signType,
            paySign:d.payParams.paySign,
            success:function(){
              wx.showModal({
                title:'支付成功',
                content:'我们将在24小时内通过微信发送你的专业风格诊断报告\n\n请留意微信消息',
                showCancel:false,confirmText:'知道了'
              });
            },
            fail:function(err){
              if(err.errMsg && err.errMsg.indexOf('cancel')>-1) return;
              wx.showToast({title:'支付失败',icon:'none'});
            }
          });
        } else {
          wx.showToast({title:d&&d.error||'支付发起失败',icon:'none'});
        }
      },
      fail:function(){wx.hideLoading();wx.showToast({title:'网络错误',icon:'none'});}
    });
  },
});
