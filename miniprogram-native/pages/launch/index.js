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
    launchTabs:[
      {key:'now',label:'今日新款'},
      {key:'all',label:'看订阅风格'},
      {key:'price',label:'销量'},
      {key:'filter',label:'批发价'},
      {key:'筛',label:'筛选'}
    ],
    styleChips:[],
    lcStyleSel:'',
    lcSubscribed:[],
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
        t.buildTabs(c);
        t.loadSubscribed();
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
  buildTabs:function(c){
    var t=this;
    var defs=[
      {key:'now',label:'今日新款'},
      {key:'all',label:'看订阅风格'},
      {key:'price',label:'销量'},
      {key:'filter',label:'批发价'},
      {key:'筛',label:'筛选'}
    ];
    var raw=(c&&c.newSection&&c.newSection.tabs)||[];
    if(raw&&raw.length){
      var tabs=defs.map(function(d,i){
        return {key:d.key, label:(raw[i]&&raw[i].trim())?raw[i].trim():d.label};
      });
      t.setData({launchTabs:tabs});
    }
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
          var priceText='\u00A5'+price;
          var priceHint='';
          // 心愿收集（盲盒）模式：1 手=5 件，按件数解锁档位
          if(p.wishlist_mode){
            var lhands=Number(p.wish_count)||0;
            var lwp=Number(p.wholesale_price)||0;if(lwp>=100)lwp=Math.round(lwp/100);
            var lbp=Number(p.bulk_price)||0;if(lbp>=100)lbp=Math.round(lbp/100);
            var W_PIECES=5,B_PIECES=25;
            if(lhands>=B_PIECES){
              var lb=lbp>0?lbp:(lwp>0?lwp:price);
              priceText='\u00A5'+(lb%1===0?lb:lb.toFixed(2)); priceHint='已开批量价';
            } else if(lhands>=W_PIECES){
              var lw=lwp>0?lwp:price;
              priceText='\u00A5'+(lw%1===0?lw:lw.toFixed(2)); priceHint='已开拿货价';
            } else {
              var lteaser=lwp>0?lwp:price;
              if(lteaser>0){ var ls=String(lteaser); var lmask=new Array(Math.max(0,ls.length-1)+1).join('?'); priceText='\u00A5'+lmask+ls.slice(-1); priceHint='再集'+(W_PIECES-lhands)+'件开拿货价'; }
              else { priceText='价格待定'; priceHint='盲盒集单'; }
            }
          }
          return {
            id:p.id,
            image:safeImg(p.image_url||p.cover_image||(p.images&&p.images[0])),
            title:(p.name||p.title||'商品'),
            price:price,
            priceText:priceText,
            priceHint:priceHint,
            sales:Number(p.sales)||0,
            style_type:p.style_type||'',
            badge:(p.is_new?'新品':(p.is_hot?'热卖':'')),
            link:'/pages/shop/index?id='+p.id
          };
        });
        t.setData({launchProducts:list});
        t.buildStyleChips();
        t.applyView();
      }
    });
  },
  applyView:function(){
    var t=this;
    var list=t.data.launchProducts||[];
    var tab=t.data.lcNewTab||'now';
    // 看订阅风格：按风格筛选（含「我的订阅」）
    if(tab==='all'){
      var sel=t.data.lcStyleSel||'';
      if(sel==='__sub__'){
        var sub=t.data.lcSubscribed||[];
        list=list.filter(function(p){return sub.indexOf(p.style_type||'')>=0;});
      } else if(sel){
        list=list.filter(function(p){return (p.style_type||'')===sel;});
      }
    }
    list=list.slice();
    if(tab==='price'){
      // 销量：按销量降序
      list.sort(function(a,b){return (b.sales||0)-(a.sales||0);});
    } else if(tab==='filter'){
      // 批发价：按拿货价升序（拿货价为空排末尾）
      list.sort(function(a,b){
        var wa=Number(a.wholesale_price)||0, wb=Number(b.wholesale_price)||0;
        if(wa===0&&wb===0) return 0;
        if(wa===0) return 1;
        if(wb===0) return -1;
        return wa-wb;
      });
    }
    t.setData({launchProductsView:list});
  },
  buildStyleChips:function(){
    var t=this;
    var map={};
    (t.data.launchProducts||[]).forEach(function(p){
      var s=p.style_type||'';
      if(s) map[s]=true;
    });
    var sub=t.data.lcSubscribed||[];
    var chips=Object.keys(map).map(function(s){return {key:s,label:s,subscribed:sub.indexOf(s)>=0};});
    chips.unshift({key:'',label:'全部风格',subscribed:false});
    if(sub.length){
      chips.unshift({key:'__sub__',label:'★我的订阅',subscribed:true});
    }
    t.setData({styleChips:chips});
  },
  loadSubscribed:function(){
    var t=this;
    try{
      var sub=wx.getStorageSync('lzd_lc_sub')||[];
      if(Array.isArray(sub)) t.setData({lcSubscribed:sub});
    }catch(e){}
  },
  swLcNewTab:function(e){
    var tab=(e&&e.currentTarget&&e.currentTarget.dataset&&e.currentTarget.dataset.t)||'now';
    if(tab==='筛'){ this.openFilterSheet(); return; }
    this.setData({lcNewTab:tab, lcStyleSel:''});
    this.applyView();
  },
  swLcStyle:function(e){
    var key=(e&&e.currentTarget&&e.currentTarget.dataset&&e.currentTarget.dataset.s)||'';
    var t=this;
    if(key && key!=='__sub__'){
      var sub=t.data.lcSubscribed||[];
      if(sub.indexOf(key)<0){
        sub=sub.concat([key]);
        t.setData({lcSubscribed:sub});
        try{ wx.setStorageSync('lzd_lc_sub', sub); }catch(err){}
        t.buildStyleChips();
      }
    }
    t.setData({lcStyleSel:key});
    t.applyView();
  },
  openFilterSheet:function(){
    var t=this;
    wx.showActionSheet({
      itemList:['新品优先','销量优先','批发价 低→高','批发价 高→低'],
      success:function(res){
        var map=['newest','price','filter_asc','filter_desc'];
        t.applyFilterMode(map[res.tapIndex]);
      }
    });
  },
  applyFilterMode:function(mode){
    var t=this;
    var list=(t.data.launchProducts||[]).slice();
    if(mode==='price'){
      list.sort(function(a,b){return (b.sales||0)-(a.sales||0);});
    } else if(mode==='filter_asc'){
      list.sort(function(a,b){var wa=Number(a.wholesale_price)||0,wb=Number(b.wholesale_price)||0; if(wa===0&&wb===0)return 0; if(wa===0)return 1; if(wb===0)return -1; return wa-wb;});
    } else if(mode==='filter_desc'){
      list.sort(function(a,b){var wa=Number(a.wholesale_price)||0,wb=Number(b.wholesale_price)||0; if(wa===0&&wb===0)return 0; if(wa===0)return 1; if(wb===0)return -1; return wb-wa;});
    }
    t.setData({launchProductsView:list, lcNewTab:'筛'});
  },
  goSubtitle:function(){
    var t=this;
    t.setData({lcNewTab:'now', lcStyleSel:''});
    t.applyView();
    wx.pageScrollTo({selector:'.lc-new', duration:300});
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
    if(s.link){ wx.navigateTo({url:s.link}); return; }
    if(s.brand){ wx.navigateTo({url:'/pages/search/index?keyword='+encodeURIComponent(s.brand)}); return; }
    wx.showToast({title:(s.brand||'直播')+' '+(s.time||'即将开始'),icon:'none'});
  },
  goLaunchBrand:function(e){
    var b=(e&&e.currentTarget&&e.currentTarget.dataset&&e.currentTarget.dataset.brand)||{};
    if(b.link){ wx.navigateTo({url:b.link}); return; }
    if(b.name){ wx.navigateTo({url:'/pages/search/index?keyword='+encodeURIComponent(b.name)}); return; }
    wx.showToast({title:'更多好货陆续上新 · 先看今日新款',icon:'none'});
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
