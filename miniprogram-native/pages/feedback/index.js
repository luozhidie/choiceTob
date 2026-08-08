Page({
  data:{
    form:{type:'建议',content:'',contact:''}
  },
  setF:function(k,v){var f=this.data.form;f[k]=v;this.setData({form:f});},
  onType:function(e){this.setF('type',e.detail.value);},
  onContent:function(e){this.setF('content',e.detail.value);},
  onContact:function(e){this.setF('contact',e.detail.value);},
  submit:function(){
    var f=this.data.form;
    if(!f.content){wx.showToast({title:'请填写内容',icon:'none'});return;}
    var list = wx.getStorageSync('feedback_list') || [];
    list.unshift({id:Date.now(),type:f.type,content:f.content,contact:f.contact,time:new Date().toLocaleString()});
    wx.setStorageSync('feedback_list', list);
    wx.showToast({title:'提交成功',icon:'success'});
    this.setData({form:{type:'建议',content:'',contact:''}});
  }
});
