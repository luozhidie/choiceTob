const ci = require('miniprogram-ci');
const fs = require('fs');
const path = require('path');

var appid = process.env.WECHAT_APPID || '';
var keyPath = './private.key';
var distPath = process.argv[2] || './dist';

function wp(dir, name, wxml, js) {
  var d = path.join(dir, 'pages', name);
  try { fs.mkdirSync(d, { recursive: true }); } catch(e) {}
  fs.writeFileSync(path.join(d, 'index.wxml'), wxml);
  fs.writeFileSync(path.join(d, 'index.js'), js);
  fs.writeFileSync(path.join(d, 'index.json'), '{}');
  fs.writeFileSync(path.join(d, 'index.wxss'), '');
}

if (!fs.existsSync(distPath) || !fs.existsSync(keyPath)) {
  console.error('MISSING FILES');
  process.exit(1);
}

// HOME
wp(distPath, 'home',
  '<view style="background:#f8f7f4;min-height:100vh"><view style="background:#2d1b2e;padding-top:50px;padding-bottom:30px;padding:20px"><text style="font-size:24px;font-weight:bold;color:#fff">骆芷蝶供应链</text><text style="font-size:13px;color:#c4b5a8;margin-top:6px;display:block">服装门店一站式赋能平台</text><view bindtap="goBuyer" style="display:flex;align-items:center;background:rgba(255,255,255,0.12);border-radius:25px;padding:11px 16px;margin-top:24"><text style="font-size:14px;color:#fff">🔍 搜索商品...</text></view></view><view style="display:flex;flex-direction:row;background:#fff;margin:16px;border-radius:16px;padding:20px;margin-top:-16"><view bindtap="goBuyer" style="flex:1;align-items:center;display:flex;flex-direction:column"><text style="font-size:28px">🛍️</text><text style="font-size:11px;color:#666;margin-top:6px">买手选品</text></view><view bindtap="goCourses" style="flex:1;align-items:center;display:flex;flex-direction:colmun"><text style="font-size:28px">📚</text><text style="font-size:11px;color:#666;margin-top:6px">线上课程</text></view><view bindtap="goLooks" style="flex:1;align-items:center;display:flex;flex-direction:column"><text style="font-size:28px">🎨</text><text style="font-size:11px;color:#666;margin-top:6px">每日搭配</text></view><view bindtap="goMy" style="flex:1;align-items:center;display:flex;flex-direction:column"><text style="font-size:28px">👑</text><text style="font-size:11px;color:#666;margin-top:6px">VIP会员</text></view></view><view style="padding:20px;background:#fff;margin-top:12px"><text style="font-size:16px;font-weight:bold;color:#2d1b2e;display:block;margin-bottom:16px">🔥 热门选品</text><block wx:if="{{products.length>0}}"><view style="display:flex;flex-wrap:wrap;justify-content:space-between"><view wx:for="{{products}}" wx:key="id" bindtap="goShop" data-id="{{item.id}}" style="width:47%;background:#f8f7f4;border-radius:12px;overflow:hidden;margin-bottom:10"><image src="{{item.image_url||item.cover_image}}" mode="aspectFill" style="width:100%;height:140px;background:#eee"/><view style="padding:8px"><text style="font-size:12px;color:#333">{{item.name}}</text><text style="font-size:14px;color:#e89a5c;font-weight:bold;display:block;margin-top:4px">¥{{item.pt}}</text></view></view></view></block><block wx:else><view style="padding:40px;text-align:center"><text style="font-size:30px">📦</text><text style="color:#999;font-size:13px;display:block;margin-top:10px">加载中</text></view></block></view><view style="padding:40px;text-align:center;padding-bottom:80px"><text style="font-size:18px;font-weight:bold;color:#2d1b2e">爆款选品·拿货精选</text><text style="font-size:12px;color:#888;margin-top:6px;display:block">骆芷蝶智选·专业推荐</text></view></view>',
  'Page({data:{tags:["全部","服装","护肤","彩妆"],products:[]},onLoad(){var t=this;wx.request({url:"https://colour-choice.art/api/public/products?limit=6",method:"GET",success:function(r){var l=(r.data&&r.data.data)||[];l.forEach(function(p){p.pt=Number(p.price||0).toFixed(2)});t.setData({products:l})}})},goBuyer(){wx.navigateTo({url:"/pages/buyer/index"})},goCourses(){wx.navigateTo({url:"/pages/courses/index"})},goLooks(){wx.navigateTo({url:"/pages/daily-looks/index"})},goMy(){wx.switchTab({url:"/pages/my/index"})},goShop(e){wx.navigateTo({url:"/pages/shop/index?id="+e.currentTarget.dataset.id)}}});'
);

// BUYER
wp(distPath, 'buyer',
  '<view style="background:#f8f7f4;min-height:100vh;padding-top:50px;padding:20px"><text style="font-size:22px;font-weight:bold;color:#2d1b2e">买手选品</text><input placeholder="搜索商品..." style="background:#fff;border-radius:25px;padding:12px 16px;margin-top:16px;border:1px solid #ddd;font-size:14px"/><view style="margin-top:16px"></view></view>',
  'Page({data:{list:[]},onLoad(){var t=this;wx.request({url:"https://colour-choice.art/api/public/products?limit=20",method:"GET",success:function(r){t.setData({list:(r.data&&r.data.data)||[]})}})}});'
);

// CART
wp(distPath, 'cart',
  '<view style="background:#f8f7f4;height:100vh;display:flex;align-items:center;justify-content:center"><text style="font-size:40px">🛒</text><text style="color:#999;font-size:15px;display:block;margin-top:16px">购物车是空的</text></view>',
  'Page({})'
);

// MY
wp(distPath, 'my',
  '<view style="background:#f8f7f4;min-height:100vh;padding:20px;padding-top:50px"><view style="display:flex;align-items:center;padding-bottom:24px;border-bottom:1px solid #eee"><view style="width:60px;height:60px;border-radius:30px;background:#2d1b2e;display:flex;justify-content:center;align-items:center"><text style="font-size:24px;color:#fff">骆</text></view><view style="margin-left:16px"><text style="font-size:17px;font-weight:bold;color:#333">骆芷蝶智选</text></view></view><view style="margin-top:24px;background:#fff;border-radius:16px;padding:0"><view wx:for="{{[1,2,3,4,5]}}" style="display:flex;align-items:center;padding:18px 20px;border-bottom:1px solid #f5f5f5"><text style="font-size:22px;margin-right:16px">📋</text><text style="font-size:15px;color:#333;flex:1">菜单项</text></view></view></view>',
  'Page({})'
);

// PLACEHOLDERS
['courses','daily-looks','shop','login'].forEach(function(pg) {
  wp(distPath, pg,
    '<view style="background:#f8f7f4;height:100vh;display:flex;align-items:center;justify-content:center"><text style="font-size:40px">🚧</text><text style="color:#999;font-size:15px;display:block;margin-top:12px">' + pg.toUpperCase() + '</text></view>',
    'Page({})'
  );
});

fs.writeFileSync(distPath + '/app.wxss', 'page{background-color:#f8f7f4;color:#333;}');

console.log('OK native pages written');

ci.upload({
  project: new ci.Project({appid:appid,type:'miniProgram',projectPath:distPath,ignoreDevFiles:true,privateKeyPath:keyPath}),
  version:String(process.env.GITHUB_RUN_NUMBER||'1'),
  desc:'native v'+(process.env.GITHUB_RUN_NUMBER||'1'),
  setting:{es6:true,es7:true,enhance:true},
  robot:1
}).then(function(){console.log('UPLOAD OK')}).catch(function(e){console.error('FAIL:',e.message);process.exit(1)});
