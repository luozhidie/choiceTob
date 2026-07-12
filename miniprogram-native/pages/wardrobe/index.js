Page({
  data:{
    items:[],
    inputText:''
  },
  onShow:function(){
    this.loadItems();
  },
  loadItems:function(){
    var items = wx.getStorageSync('wardrobe_items') || [];
    this.setData({items:items});
  },
  onInput:function(e){
    this.setData({inputText:e.detail.value});
  },
  addItem:function(){
    var t = this.data.inputText.trim();
    if(!t){wx.showToast({title:'请输入单品名称',icon:'none'});return;}
    var items = this.data.items;
    items.unshift({id:Date.now(),name:t});
    wx.setStorageSync('wardrobe_items', items);
    this.setData({items:items,inputText:''});
    wx.showToast({title:'已添加',icon:'success'});
  },
  removeItem:function(e){
    var id = e.currentTarget.dataset.id;
    var items = this.data.items.filter(function(x){return x.id!==id;});
    wx.setStorageSync('wardrobe_items', items);
    this.setData({items:items});
  }
});
