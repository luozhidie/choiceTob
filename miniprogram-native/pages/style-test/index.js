Page({
  data:{
    form:{
      name:'',wechat:'',age:'',group:'',
      q5:'',q7:'',q8:'',q9:'',q10:'',q11:'',q12:'',q13:'',q14:''
    },
    canSubmit:false,
  },

  /* 输入 */
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
        showCancel:false,
        confirmText:'知道了',
        success:function(){
          /* 清空表单 */
          t.setData({
            form:{name:'',wechat:'',age:'',group:'',q5:'',q7:'',q8:'',q9:'',q10:'',q11:'',q12:'',q13:'',q14:'',height:''},
            canSubmit:false
          });
        }
      });
    },800);
  },

  goTestFem:function(){wx.showToast({title:'女士风格测试 ¥99 开发中',icon:'none'});},
  goTestMale:function(){wx.showToast({title:'男士风格测试 ¥99 开发中',icon:'none'});},
});
