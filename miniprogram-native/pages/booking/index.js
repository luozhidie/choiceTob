Page({
  data:{
    form:{name:'',phone:'',date:'',note:''}
  },
  setF:function(k,v){
    var f=this.data.form;f[k]=v;
    this.setData({form:f});
  },
  onName:function(e){this.setF('name',e.detail.value);},
  onPhone:function(e){this.setF('phone',e.detail.value);},
  onDate:function(e){this.setF('date',e.detail.value);},
  onNote:function(e){this.setF('note',e.detail.value);},
  submit:function(){
    var f=this.data.form;
    if(!f.name||!f.phone||!f.date){wx.showToast({title:'请填写姓名、电话和预约时间',icon:'none'});return;}
    var list = wx.getStorageSync('booking_list') || [];
    list.unshift({id:Date.now(),name:f.name,phone:f.phone,date:f.date,note:f.note,status:'待确认'});
    wx.setStorageSync('booking_list', list);
    wx.showToast({title:'预约已提交',icon:'success'});
    this.setData({form:{name:'',phone:'',date:'',note:''}});
  }
});
