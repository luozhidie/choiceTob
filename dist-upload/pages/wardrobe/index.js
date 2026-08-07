Page({
  data:{
    categories:['每期推荐','衣橱管理','添置清单','搭配需求'],
    activeCate:'衣橱管理',
    items:[],
    filteredItems:[],
    outfitCount:0,
    stylingRequests:[],
    showForm:false,
    form:{name:'',cate:'衣橱管理',img:''},
    uploading:false
  },
  onLoad:function(){
    var app = getApp();
    if (app && app.checkAdminAccess && !app.checkAdminAccess()) return;
  },
  onShow:function(){
    var app = getApp();
    if (app && app.checkAdminAccess && !app.checkAdminAccess()) return;
    this.loadItems();
    this.loadOutfitCount();
    this.loadStylingRequests();
  },
  loadItems:function(){
    var items = wx.getStorageSync('wardrobe_items') || [];
    this.setData({items:items});
    this.filterItems(items,this.data.activeCate);
  },
  loadOutfitCount:function(){
    var outfits = wx.getStorageSync('outfits_list') || [];
    this.setData({outfitCount:outfits.length});
  },
  loadStylingRequests:function(){
    var list = wx.getStorageSync('styling_requests') || [];
    this.setData({stylingRequests:list});
  },
  goStylingRequest:function(){wx.navigateTo({url:'/pages/wardrobe/styling-request/index'});},
  filterItems:function(items,cate){
    var filtered = items.filter(function(x){return x.cate===cate;});
    this.setData({filteredItems:filtered});
  },
  switchCate:function(e){
    var cate=e.currentTarget.dataset.cate;
    this.setData({activeCate:cate});
    this.filterItems(this.data.items,cate);
  },
  goOutfits:function(){wx.navigateTo({url:'/pages/wardrobe/outfits/index'});},
  goCreate:function(){wx.navigateTo({url:'/pages/wardrobe/create/index'});},
  onFab:function(){
    if(this.data.activeCate==='衣橱管理'){this.goCreate();}
    else if(this.data.activeCate==='搭配需求'){this.goStylingRequest();}
    else{this.toggleForm();}
  },
  setFormCate:function(e){
    this.setF('cate',e.currentTarget.dataset.cate);
  },
  setF:function(k,v){
    var f=this.data.form;f[k]=v;
    this.setData({form:f});
  },
  onName:function(e){this.setF('name',e.detail.value);},
  toggleForm:function(){this.setData({showForm:!this.data.showForm,form:{name:'',cate:this.data.activeCate,img:''}});},
  chooseImg:function(){
    var t=this;
    wx.chooseImage({count:1,sizeType:['compressed'],sourceType:['album','camera'],
      success:function(res){
        t.setData({uploading:true});
        wx.uploadFile({url:'https://colour-choice.art/api/upload',filePath:res.tempFilePaths[0],name:'file',
          success:function(r){
            t.setData({uploading:false});
            try{var d=JSON.parse(r.data);if(d.url){t.setF('img',d.url);}else{wx.showToast({title:'上传失败',icon:'none'});}}catch(e){wx.showToast({title:'解析失败',icon:'none'});}
          },
          fail:function(){t.setData({uploading:false});wx.showToast({title:'上传失败',icon:'none'});}
        });
      }
    });
  },
  saveItem:function(){
    var f=this.data.form;
    if(!f.name.trim()){wx.showToast({title:'请输入名称',icon:'none'});return;}
    var items = this.data.items;
    items.unshift({id:Date.now(),name:f.name.trim(),cate:f.cate,img:f.img,date:'刚刚'});
    wx.setStorageSync('wardrobe_items', items);
    this.setData({items:items,showForm:false,form:{name:'',cate:this.data.activeCate,img:''}});
    this.filterItems(items,this.data.activeCate);
    wx.showToast({title:'已添加',icon:'success'});
  },
  delItem:function(e){
    var id=e.currentTarget.dataset.id;
    var items=this.data.items.filter(function(x){return x.id!==id;});
    wx.setStorageSync('wardrobe_items', items);
    this.setData({items:items});
    this.filterItems(items,this.data.activeCate);
  }
});
