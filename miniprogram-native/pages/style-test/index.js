var app = getApp();

Page({
  data:{
    /* 当前测试模式：female / male */
    testMode:'female',
    testTitle:'',
    testDesc:'',
    tipText:'所有信息仅用于色彩风格诊断，严格保密',

    /* 测试会员（从风格测试入口购买） */
    isTestMember:false,
    testFeeLabel:'¥99',

    /* 表单数据 — 与电脑版 style-test/page.tsx 完全一致 */
    form:{
      /* 输入题 Q1-Q6 */
      full_name:'',wechat_id:'',age:'',video_course_info:'',look_vs_age:'',height:'',
      /* 选择题 Q7-Q17 */
      q7:'',q8:'',q9:'',q10:'',q11:'',q12:'',q13:'',q14:'',q15:'',q16:'',q17:'',
      /* 照片题 Q18-Q21 */
      photo_note:'',
      img1:'',img2:'',img3:''
    },
    uploadingImg:false,

    canPay:false,

    /* 选择题选项 — 与电脑版完全一致 */
    optQ7:['A. 显高','B. 显矮','C. 正常','D. 不知道'],
    optQ8:['A. 有','B. 没有'],
    optQ9:['A. 正装有气质','B. 休闲装好看','C. 都差不多','D. 不知道'],
    optQ10:['A. 裤装','B. 裙装','C. 都差不多，没区别','D. 不知道'],
    optQ11:['A. 连衣裙','B. 半裙','C. 都差不多','D. 不知道'],
    optQ12:['A. 短款','B. 中款','C. 长款','D. 都差不多'],
    optQ13:['A. 有','B. 没有'],
    optQ14:['A. 有','B. 没有'],
    optQ15:['A. 会早些','B. 正常发育','C. 较晚'],
    optQ16:['A. 会','B. 不会'],
    optQ17:['A. 容易','B. 不容易'],
  },

  onLoad:function(options){
    this.applyMode(options.mode || 'female');
  },

  /* ========== 切换男士/女士模式 ========== */
  applyMode:function(mode){
    var t = '', d = '';
    if(mode==='female'){
      t='女士风格专业诊断';d='17道深度诊断题 + AI 色彩匹配报告 + 专业搭配建议';
    } else {
      t='男士风格专业诊断';d='17道深度诊断题 + AI 色彩匹配报告 + 穿搭建议方案';
    }
    this.setData({testMode:mode,testTitle:t,testDesc:d});
  },
  switchMode:function(e){
    var mode = e.currentTarget.dataset.mode;
    if(mode===this.data.testMode)return;
    this.applyMode(mode);
    this.setData({'isTestMember':false});
  },

  /* ========== 输入题 handlers (Q1-Q6) ========== */
  setF:function(k,v){
    var f=this.data.form;f[k]=v;
    this.setData({form:f});
    this.checkPay();
  },
  onName:function(e){this.setF('full_name',e.detail.value);},
  onWechat:function(e){this.setF('wechat_id',e.detail.value);},
  onAge:function(e){this.setF('age',e.detail.value);},
  onVideoCourse:function(e){this.setF('video_course_info',e.detail.value);},
  onLookVsAge:function(e){this.setF('look_vs_age',e.detail.value);},
  onHeight:function(e){this.setF('height',e.detail.value);},

  /* ========== 选择题 handlers (Q7-Q17) ========== */
  pickQ:function(qKey,e){this.setF(qKey,e.currentTarget.dataset.v);},

  /* ========== Q18 照片说明 ========== */
  onPhotoNote:function(e){this.setF('photo_note',e.detail.value);},

  /* ========== Q19-Q21 图片上传 ========== */
  pickImage:function(idx){
    var t=this;
    wx.chooseImage({
      count:1,
      sizeType:['compressed'],
      sourceType:['album','camera'],
      success:function(res){
        var tempPath=res.tempFilePaths[0];
        t.setData({uploadingImg:true});
        wx.uploadFile({
          url:'https://colour-choice.art/api/upload',
          filePath:tempPath,
          name:'file',
          success:function(upRes){
            t.setData({uploadingImg:false});
            try{
              var d=JSON.parse(upRes.data);
              if(d.error){wx.showToast({title:d.error,icon:'none'});return;}
              var f=t.data.form;
              if(idx===0)f.img1=d.url;
              else if(idx===1)f.img2=d.url;
              else f.img3=d.url;
              t.setData({form:f});
            }catch(ee){
              wx.showToast({title:'上传解析失败',icon:'none'});
            }
          },
          fail:function(){t.setData({uploadingImg:false});wx.showToast({title:'上传失败',icon:'none'});}
        });
      }
    });
  },

  previewImage:function(idx){
    var urls=[];
    if(this.data.form.img1)urls.push(this.data.form.img1);
    if(this.data.form.img2)urls.push(this.data.form.img2);
    if(this.data.form.img3)urls.push(this.data.form.img3);
    if(urls.length===0)return;
    wx.previewImage({current:urls[idx]||urls[0],urls:urls});
  },

  removeImage:function(idx){
    var f=this.data.form;
    if(idx===0)f.img1='';
    else if(idx===1)f.img2='';
    else f.img3='';
    this.setData({form:f});
  },

  /* ========== 校验 & 提交 ========== */
  checkPay:function(){
    var f=this.data.form;
    // 必填：名字、微信号、年龄、身高 + Q7/Q12(上衣长度)
    this.setData({canPay:!!(f.full_name&&f.wechat_id&&f.age&&f.height&&f.q7&&f.q12)});
  },

  submitForm:function(){
    if(!this.data.canPay){wx.showToast({title:'请填写必填项（带*号）',icon:'none'});return;}
    var t=this;
    wx.showLoading({title:'提交中...'});
    app.getOpenid().then(function(openid){
      if(!openid){
        wx.hideLoading();wx.showToast({title:'请先登录',icon:'none'});return;
      }
      var f=t.data.form;
      var payload={
        user_openid:openid,
        full_name:f.full_name,
        wechat_id:f.wechat_id||null,
        age:f.age,
        video_course_info:f.video_course_info||null,
        look_vs_age:f.look_vs_age||null,
        height:f.height||null,
        answers:{
          q7:f.q7,q8:f.q8,q9:f.q9,q10:f.q10,q11:f.q11,q12:f.q12,
          q13:f.q13,q14:f.q14,q15:f.q15,q16:f.q16,q17:f.q17
        },
        photo_note:f.photo_note||null,
        photo_urls_1:f.img1?[f.img1]:[],
        photo_urls_2:f.img2?[f.img2]:[],
        photo_urls_3:f.img3?[f.img3]:[],
        gender:t.data.testMode
      };
      wx.request({
        url:'https://colour-choice.art/api/style-test/submit',
        method:'POST',
        header:{'Content-Type':'application/json'},
        data:payload,
        success:function(r){
          wx.hideLoading();
          if(r.statusCode===401){
            wx.showModal({title:'请先登录',content:'提交前需要先登录账号',showCancel:false});
            return;
          }
          if(r.data&&r.data.success){
            wx.showModal({
              title:'提交成功',
              content:'您的色彩风格诊断问卷已提交，我们将在24小时内通过微信（'+f.wechat_id+'）发送结果通知。\n\n感谢参与！',
              showCancel:false,confirmText:'知道了'
            });
            // 清空表单（保留非敏感字段）
            t.setData({'form.full_name':'','form.wechat_id':'','form.age':'','form.photo_note':'','form.img1':'','form.img2':'','form.img3':''});
          } else {
            wx.showModal({title:'提交失败',content:(r.data&&r.data.error)||'请稍后重试',showCancel:false});
          }
        },
        fail:function(){
          wx.hideLoading();
          wx.showToast({title:'网络错误',icon:'none'});
        }
      });
    }).catch(function(){
      wx.hideLoading();
      wx.showToast({title:'获取用户信息失败',icon:'none'});
    });
  },

  /* ========== 开通测试会员（¥99） ========== */
  buyTestMember:function(){
    var t=this;
    if(!app||!app.getOpenid){wx.showToast({title:'暂不支持',icon:'none'});return;}
    wx.showLoading({title:'调起支付...'});
    app.getOpenid().then(function(openid){
      var isFemale=t.data.testMode==='female';
      var pid=isFemale?'test_female':'test_male';
      var title=isFemale?'女士风格测试会员':'男士风格测试会员';
      wx.request({
        url:'https://colour-choice.art/api/wechat-pay/unified-order',
        method:'POST',
        data:{product_id:pid,product_title:title,total_fee:9900,quantity:1,platform:'mini',openid:openid},
        success:function(r){
          wx.hideLoading();
          var d=r.data||{};
          if(d.error){wx.showModal({title:'下单失败',content:d.error,showCancel:false});return;}
          var p=d.jsapi||d;
          wx.requestPayment({
            timeStamp:p.timeStamp,nonceStr:p.nonceStr,package:p.package,
            signType:p.signType||'MD5',paySign:p.paySign,
            success:function(){wx.showToast({title:'开通成功',icon:'success'});t.setData({isTestMember:true});},
            fail:function(err){if(!(err&&err.errMsg&&err.errMsg.indexOf('cancel')>-1))wx.showToast({title:'支付失败',icon:'none'});}
          });
        },
        fail:function(){wx.hideLoading();wx.showToast({title:'网络错误',icon:'none'});}
      });
    }).catch(function(){wx.hideLoading();wx.showToast({title:'无法调起支付',icon:'none'});});
  },
});
