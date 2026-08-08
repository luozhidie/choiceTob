Page({
  data:{
    list:[],
    form:{name:'',phone:'',region:'',detail:''},
    showForm:false
  },
  onShow:function(){this.load();},
  load:function(){
    this.setData({list:wx.getStorageSync('address_list')||[]});
  },
  setF:function(k,v){var f=this.data.form;f[k]=v;this.setData({form:f});},
  onName:function(e){this.setF('name',e.detail.value);},
  onPhone:function(e){this.setF('phone',e.detail.value);},
  onRegion:function(e){this.setF('region',e.detail.value.join(' '));},
  onDetail:function(e){this.setF('detail',e.detail.value);},
  toggleForm:function(){this.setData({showForm:!this.data.showForm});},
  save:function(){
    var f=this.data.form;
    if(!f.name||!f.phone||!f.region||!f.detail){wx.showToast({title:'请填写完整地址',icon:'none'});return;}
    var list = this.data.list;
    list.unshift({id:Date.now(),name:f.name,phone:f.phone,region:f.region,detail:f.detail,isDefault:list.length===0});
    wx.setStorageSync('address_list', list);
    this.setData({list:list,showForm:false,form:{name:'',phone:'',region:'',detail:''}});
    wx.showToast({title:'保存成功',icon:'success'});
  },
  del:function(e){
    var id=e.currentTarget.dataset.id;
    var list=this.data.list.filter(function(x){return x.id!==id;});
    wx.setStorageSync('address_list', list);
    this.setData({list:list});
  },
  setDefault:function(e){
    var id=e.currentTarget.dataset.id;
    var list=this.data.list.map(function(x){x.isDefault=(x.id===id);return x;});
    wx.setStorageSync('address_list', list);
    this.setData({list:list});
  }
});
