Page({
  data:{
    /* 当前测试模式：female / male */
    testMode:'female',
    testTitle:'',
    testDesc:'',
    tipText:'所有信息仅用于色彩风格诊断，严格保密',

    /* 女士表单 (17题) */
    fForm:{
      name:'',wechat:'',age:'',
      q5:'',q7:'',height:'',q8:'',q9:'',q10:'',q11:'',q12:'',q13:'',q14:''
    },

    /* 男士表单 (14题) */
    mForm:{
      name:'',wechat:'',age:'',
      q5:'',height:'',q8:'',q9:''
    },

    canPay:false,

    /* 选项列表 */
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

  onLoad:function(options){
    var mode = options.mode || 'female';
    var t = '', d = '';
    if(mode==='female'){
      t='女士风格专业诊断';d='17道深度诊断题 + AI 色彩匹配报告 + 专业搭配建议';
    } else {
      t='男士风格专业诊断';d='14道深度诊断题 + AI 色彩匹配报告 + 穿搭建议方案';
    }
    this.setData({testMode:mode,testTitle:t,testDesc:d});
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
  pickFQ7:function(e){this.setFF('q7',e.currentTarget.dataset.v);},
  pickFQ8:function(e){this.setFF('q8',e.currentTarget.dataset.v);},
  pickFQ9:function(e){this.setFF('q9',e.currentTarget.dataset.v);},
  pickFQ10:function(e){this.setFF('q10',e.currentTarget.dataset.v);},
  pickFQ11:function(e){this.setFF('q11',e.currentTarget.dataset.v);},
  pickFQ12:function(e){this.setFF('q12',e.currentTarget.dataset.v);},
  pickFQ13:function(e){this.setFF('q13',e.currentTarget.dataset.v);},
  pickFQ14:function(e){this.setFF('q14',e.currentTarget.dataset.v);},

  checkPay:function(){
    if(this.data.testMode==='female'){
      var f=this.data.fForm;
      this.setData({canPay:!!(f.name&&f.wechat&&f.age&&f.q5&&f.height&&f.q7&&f.q8&&f.q11&&f.q12&&f.q13)});
    } else {
      var m=this.data.mForm;
      this.setData({canPay:!!(m.name&&m.wechat&&m.age&&m.q5&&m.height&&m.q8)});
    }
  },

  submitFemale:function(){
    if(!this.data.canPay){wx.showToast({title:'请填写必填项',icon:'none'});return;}
    wx.showLoading({title:'提交中...'});
    var t=this;
    setTimeout(function(){
      wx.hideLoading();
      wx.showModal({
        title:'提交成功',
        content:'我们将在24小时内通过微信（'+t.data.fForm.wechat+'）发送你的女士风格专业诊断报告\n\n感谢参与！',
        showCancel:false,confirmText:'知道了'
      });
    },800);
  },

  /* ========== 男士测试 handlers ========== */
  onMName:function(e){this.setFM('name',e.detail.value);},
  onMWechat:function(e){this.setFM('wechat',e.detail.value);},
  onMAge:function(e){this.setFM('age',e.detail.value);},
  onMHeight:function(e){this.setFM('height',e.detail.value);},

  setFM:function(k,v){
    var f=this.data.mForm;f[k]=v;
    this.setData({mForm:f});
    this.checkPay();
  },

  pickMQ5:function(e){this.setFM('q5',e.currentTarget.dataset.v);},
  pickMQ8:function(e){this.setFM('q8',e.currentTarget.dataset.v);},
  pickMQ9:function(e){this.setFM('q9',e.currentTarget.dataset.v);},

  submitMale:function(){
    if(!this.data.canPay){wx.showToast({title:'请填写必填项',icon:'none'});return;}
    wx.showLoading({title:'提交中...'});
    var t=this;
    setTimeout(function(){
      wx.hideLoading();
      wx.showModal({
        title:'提交成功',
        content:'我们将在24小时内通过微信（'+t.data.mForm.wechat+'）发送你的男士风格专业诊断报告\n\n感谢参与！',
        showCancel:false,confirmText:'知道了'
      });
    },800);
  },
});
