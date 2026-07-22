function isValidImgUrl(url){
  if(!url || typeof url !== 'string') return false;
  var lower = url.toLowerCase();
  if(lower.indexOf('http://') !== 0 && lower.indexOf('https://') !== 0) return false;
  if(lower.indexOf('example.com') >= 0 || lower.indexOf('placeholder.com') >= 0 || lower.indexOf('localhost') >= 0 || lower.indexOf('127.0.0.1') >= 0 || lower.indexOf('dummy') >= 0) return false;
  return true;
}
function safeImg(url){ return isValidImgUrl(url) ? url : ''; }

function calcLaunchCountdown(endTime){
  var zero={d:'00',h:'00',m:'00',s:'00'};
  if(!endTime) return zero;
  var end=new Date(endTime).getTime();
  if(isNaN(end)) return zero;
  var diff=Math.floor((end-Date.now())/1000);
  if(diff<=0) return zero;
  var d=Math.floor(diff/86400);
  var h=Math.floor((diff%86400)/3600);
  var m=Math.floor((diff%3600)/60);
  var s=diff%60;
  function pad(n){return n<10?('0'+n):(''+n);}
  return {d:pad(d),h:pad(h),m:pad(m),s:pad(s)};
}

Page({
  data:{
    bid:'',
    c:{},
    endTime:'',
    countdown:{d:'00',h:'00',m:'00',s:'00'},
    launchMediaPool:[],
    launchMediaLen:0,
    launchProducts:[],
    launchProductsView:[],
    lcNewTab:'now',
    lcNewCat:''
  },
  onLoad:function(q){
    var id=(q&&q.id)||'';
    var t=this;
    wx.request({
      url:'https://colour-choice.art/api/public/blocks',
      method:'GET',
      success:function(r){
        if(!r.data||!r.data.success) return;
        var all=r.data.data||[];
        var b=all.find(function(x){return x.type==='launch_campaign' && (!id || x.id===id);});
        if(!b) b=all.find(function(x){return x.type==='launch_campaign';});
        if(!b){
          wx.showToast({title:'活动已下架',icon:'none'});
          return;
        }
        var c=b.content||{};
        t.setData({
          bid:b.id,
          c:c,
          endTime:(c.couponSection&&c.couponSection.endTime)||''
        });
        t.startCountdown();
        t.loadMedia();
        t.loadNew();
      },
      fail:function(){
        wx.showToast({title:'网络错误',icon:'none'});
      }
    });
  },
  onUnload:function(){ this.stopCountdown(); },
  startCountdown:function(){
    this.stopCountdown();
    var t=this;
    if(!t.data.endTime) return;
    var tick=function(){ t.setData({countdown:calcLaunchCountdown(t.data.endTime)}); };
    tick();
    this._lcTimer=setInterval(tick,1000);
  },
  stopCountdown:function(){
    if(this._lcTimer){ clearInterval(this._lcTimer); this._lcTimer=null; }
  },
  loadMedia:function(){
    var t=this;
    wx.request({
      url:'https://colour-choice.art/api/public/products?limit=40',
      method:'GET',
      success:function(r){
        var l=[];
        if(r.data&&r.data.success&&r.data.data) l=r.data.data||[];
        else if(Array.isArray(r.data)) l=r.data;
        var pool=l.map(function(p){return safeImg(p.image_url||p.cover_image||(p.images&&p.images[0]));}).filter(function(u){return !!u;});
        t.setData({launchMediaPool:pool, launchMediaLen:pool.length});
      }
    });
  },
  loadNew:function(){
    var t=this;
    wx.request({
      url:'https://colour-choice.art/api/public/products?limit=24',
      method:'GET',
      success:function(r){
        var l=[];
        if(r.data&&r.data.success&&r.data.data) l=r.data.data||[];
        else if(Array.isArray(r.data)) l=r.data;
        var list=l.map(function(p){
          var price=Number(p.price)||0; if(price>=100) price=Math.round(price/100);
          return {
            id:p.id,
            image:safeImg(p.image_url||p.cover_image||(p.images&&p.images[0])),
            title:(p.name||p.title||'商品'),
            price:price,
            badge:(p.is_new?'新品':(p.is_hot?'热卖':'')),
            link:'/pages/shop/index?id='+p.id
          };
        });
        t.setData({launchProducts:list});
        t.applyView();
      }
    });
  },
  applyView:function(){
    var t=this;
    var list=t.data.launchProducts||[];
    if(t.data.lcNewTab==='price'){
      list=list.slice().sort(function(a,b){return (b.price||0)-(a.price||0);});
    }
    t.setData({launchProductsView:list});
  },
  swLcNewTab:function(e){
    var tab=(e&&e.currentTarget&&e.currentTarget.dataset&&e.currentTarget.dataset.t)||'now';
    this.setData({lcNewTab:tab});
    this.applyView();
  },
  swLcNewCat:function(e){
    var c=(e&&e.currentTarget&&e.currentTarget.dataset&&e.currentTarget.dataset.c)||'';
    this.setData({lcNewCat:c});
  },
  goLaunchCoupon:function(e){
    var tier=(e&&e.currentTarget&&e.currentTarget.dataset&&e.currentTarget.dataset.tier)||{};
    wx.showToast({title:'满'+tier.threshold+'减¥'+tier.amount+' 活动详情',icon:'none'});
  },
  goLaunchLive:function(e){
    var s=(e&&e.currentTarget&&e.currentTarget.dataset&&e.currentTarget.dataset.stream)||{};
    wx.showToast({title:(s.brand||'直播')+' '+s.time,icon:'none'});
  },
  goLaunchBrand:function(e){
    var b=(e&&e.currentTarget&&e.currentTarget.dataset&&e.currentTarget.dataset.brand)||{};
    if(b.link){ wx.navigateTo({url:b.link}); return; }
    wx.switchTab({url:'/pages/buyer/index'});
  },
  goLaunchProduct:function(e){
    var p=(e&&e.currentTarget&&e.currentTarget.dataset&&e.currentTarget.dataset.product)||{};
    if(p.link){ wx.navigateTo({url:p.link}); return; }
    wx.switchTab({url:'/pages/buyer/index'});
  },
  goBack:function(){
    var pages=getCurrentPages();
    if(pages&&pages.length>1){ wx.navigateBack(); }
    else { wx.switchTab({url:'/pages/home/index'}); }
  }
});
