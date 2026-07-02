const ci = require('miniprogram-ci');
const fs = require('fs');
const path = require('path');

const appid = process.env.WECHAT_APPID || '';
const keyPath = './private.key';
const distPath = process.argv[2] || './dist';

if (!fs.existsSync(distPath) || !fs.existsSync(keyPath) || !fs.existsSync(distPath + '/app.json')) {
  console.error('ERROR: missing files');
  process.exit(1);
}

function writePage(dir, name, wxml, js) {
  var d = path.join(dir, 'pages', name);
  try { fs.mkdirSync(d, { recursive: true }); } catch(e) {}
  fs.writeFileSync(path.join(d, 'index.wxml'), wxml);
  fs.writeFileSync(path.join(d, 'index.js'), js);
  fs.writeFileSync(path.join(d, 'index.json'), '{}');
  fs.writeFileSync(path.join(d, 'index.wxss'), '');
}

// 首页
writePage(distPath, 'home',
  '<view style="background-color:#f8f7f4;min-height:100vh">' +
    '<view style="background-color:#2d1b2e;padding-top:50px;padding-bottom:30px;padding-left:20px;padding-right:20px">' +
      '<text style="font-size:24px;font-weight:bold;color:#fff;display:block">骆芷蝶供应链</text>' +
      '<text style="font-size:13px;color:#c4b5a8;margin-top:6px;display:block">服装门店一站式赋能平台</text>' +
      '<view bindtap="goBuyer" style="display:flex;flex-direction:row;align-items:center;background-color:rgba(255,255,255,0.12);border-radius:25px;padding:11px 16px;margin-top:24"><text style="font-size:14px;color:#fff">🔍 搜索商品...</text></view>' +
      '<view style="display:flex;flex-direction:row;margin-top:20;flex-wrap:wrap">' +
        '<view wx:for="{{tags}}" wx:key="*this" style="padding:6px 14px;border-radius:20px;border:1px solid rgba(255,255,255,0.15);margin-right:8px;margin-bottom:8px"><text style="font-size:11px;color:rgba(255,255,255,0.7)">{{item}}</text></view>' +
      '</view>' +
    '</view>' +
    '<view style="display:flex;flex-direction:row;background:#fff;margin:16px;border-radius:16px;padding:20px;margin-top:-16">' +
      '<view bindtap="goBuyer" style="flex:1;align-items:center;display:flex;flex-direction:column"><text style="font-size:28px">🛍️</text><text style="font-size:11px;color:#666;margin-top:6px">买手选品</text></view>' +
      '<view bindtap="goCourses" style="flex:1;align-items:center;display:flex;flex-direction:column"><text style="font-size:28px">📚</text><text style="font-size:11px;color:#666;margin-top:6px">线上课程</text></view>' +
      '<view bindtap="goLooks" style="flex:1;align-items:center;display:flex;flex-direction:column"><text style="font-size:28px">🎨</text><text style="font-size:11px;color:#666;margin-top:6px">每日搭配</text></view>' +
      '<view bindtap="goMy" style="flex:1;align-items:center;display:flex;flex-direction:column"><text style="font-size:28px">👑</text><text style="font-size:11px;color:#666;margin-top:6px">VIP会员</text></view>' +
    '</view>' +
    '<view style="padding:20px;background:#fff;margin-top:12px">' +
      '<text style="font-size:16px;font-weight:bold;color:#2d1b2e;display:block;margin-bottom:16px">🔥 热门选品</text>' +
      '<block wx:if="{{products.length > 0}}">' +
        '<view style="display:flex;flex-wrap:wrap;justify-content:space-between">' +
          '<view wx:for="{{products}}" wx:key="id" bindtap="goShop" data-id="{{item.id}}" style="width:47%;background:#f8f7f4;border-radius:12px;overflow:hidden;margin-bottom:10">' +
            '<image src="{{item.image_url || item.cover_image}}" mode="aspectFill" style="width:100%;height:140px;background:#eee"/>' +
            '<view style="padding:8px"><text style="font-size:12px;color:#333">{{item.name||item.title}}</text><text style="font-size:14px;color:#e89a5c;font-weight:bold;display:block;margin-top:4px">¥{{item.priceText}}</text></view>' +
          '</view>' +
        '</view>' +
      '</block>' +
      '<block wx:else><view style="padding:40px;text-align:center"><text style="font-size:30px">📦</text><text style="color:#999;font-size:13px;display:block;margin-top:10px">加载中...</text></view></block>' +
    '</view>' +
    '<view style="padding:40px;text-align:center;padding-bottom:80px"><text style="font-size:18px;font-weight:bold;color:#2d1b2e">爆款选品 · 拿货精选</text><text style="font-size:12px;color:#888;margin-top:6px;display:block">骆芷蝶智选 · 专业推荐</text></view>' +
  '</view>',
  'Page({' +
    'data:{tags:["全部","服装","护肤","彩妆"],products:[]},' +
    'onLoad(){var t=this;' +
      'wx.request({url:"https://colour-choice.art/api/public/products?limit=6",method:"GET",' +
        'success:function(r){' +
          'var l=(r.data&&r.data.data)||[];' +
          'l.forEach(function(p){p.priceText=Number(p.price||0).toFixed(2);});' +
          't.setData({products:l});' +
        '}' +
      '});' +
    '},' +
    'goBuyer(){wx.navigateTo({url:"/pages/buyer/index"});},' +
    'goCourses(){wx.navigateTo({url:"/pages/courses/index"});},' +
    'goLooks(){wx.navigateTo({url:"/pages/daily-looks/index"});},' +
    'goMy(){wx.switchTab({url:"/pages/my/index"});},' +
    'goShop(e){wx.navigateTo({url:"/pages/shop/index?id="+e.currentTarget.dataset.id});}' +
  '});'
);

// 买家
writePage(distPath, 'buyer',
  '<view style="background:#f8f7f4;min-height:100vh;padding-top:50px;padding:20px">' +
    '<text style="font-size:22px;font-weight:bold;color:#2d1b2e">买手选品</text>' +
    '<input placeholder="搜索商品..." style="background:#fff;border-radius:25px;padding:12px 16px;margin-top:16px;border:1px solid #ddd;font-size:14px" confirm-type="search"/>' +
    '<view style="display:flex;flex-wrap:wrap;margin-top:16px">' +
      '<view wx:for="{{cats}}" wx:key="*this" style="padding:8px 16px;border-radius:20px;margin-right:10px;margin-bottom:10px;background:' + "'{{activeCat===item?\"#e89a5c\":\"#f0f0f0\"}}'" + '"><text style="font-size:12px;color:' + "'{{activeCat===item?\"#fff\":\"#666\"}}'" + '">{{item}}</text></view>' +
    '</view>' +
    '<block wx:if="{{list.length>0}}"><view style="display:flex;flex-wrap:wrap;justify-content:space-between;margin-top:16px">' +
      '<view wx:for="{{list}}" wx:key="id" style="width:47%;background:#fff;border-radius:12px;overflow:hidden;margin-bottom:10">' +
        '<image src="{{item.image_url||item.cover_image}}" mode="aspectFill" style="width:100%;height:140px;background:#eee"/>' +
        '<view style="padding:8px"><text style="font-size:12px;color:#333">{{item.name||item.title}}</text><text style="font-size:14px;color:#e89a5c;font-weight:bold;display:block;margin-top:4px">¥{{item.pt}}</text></view></view>' +
    '</view></block>' +
    '<block wx:else><view style="padding:60px 20px;text-align:center"><text style="color:#999;font-size:14px">暂无商品</text></view></block>' +
  '</view>',
  'Page({data:{cats:["全部","服装","护肤","彩妆"],activeCat:"全部",list:[],all:[]},onLoad(){var t=this;wx.request({url:"https://colour-choice.art/api/public/products?limit=20",method:"GET",success:function(r){var l=(r.data&&r.data.data)||[];l.forEach(function(p){p.pt=Number(p.price||0).toFixed(2)});t.setData({all:l,list:l});}});},'
});

// 购物车
writePage(distPath, 'cart',
  '<view style="background:#f8f7f4;height:100vh;display:flex;align-items:center;justify-content:center"><text style="font-size:40px">🛒</text><text style="color:#999;font-size:15px;display:block;margin-top:16px">购物车是空的</text><text style="color:#bbb;font-size:13px;display:block;margin-top:8px">去选品页逛逛吧~</text></view>',
  'Page({})'
);

// 我的
writePage(distPath, 'my',
  '<view style="background:#f8f7f4;min-height:100vh;padding:20px;padding-top:50px">' +
    '<view style="display:flex;align-items:center;padding-bottom:24px;border-bottom:1px solid #eee">' +
      '<view style="width:60px;height:60px;border-radius:30px;background:#2d1b2e;display:flex;justify-content:center;align-items:center"><text style="font-size:24px;color:#fff">骆</text></view>' +
      '<view style="margin-left:16px"><text style="font-size:17px;font-weight:bold;color:#333">骆芷蝶智选</text><text style="font-size:12px;color:#999;margin-top:4px;display:block">点击登录获取VIP权限</text></view>' +
    '</view>' +
    '<view style="margin-top:24px;background:#fff;border-radius:16px;overflow:hidden">' +
      '<view wx:for="{{menus}}" wx:key="icon" style="display:flex;align-items:center;padding:18px 20px;border-bottom:1px solid #f5f5f5"><text style="font-size:22px;margin-right:16px">{{item.icon}}</text><text style="font-size:15px;color:#333;flex:1">{{item.label}}</text><text style="color:#ccc;font-size:18px">›</text></view>' +
    '</view>' +
  '</view>',
  'Page({data:{menus:[{icon:"📋",label:"我的订单"},{icon:"📍",label:"收货地址"},{icon:"👑",label:"VIP会员"},{icon:"🎫",label:"我的课程"},{icon:"💰",label:"优惠券"},{icon:"💬",label:"联系客服"}]}})'
);

// 占位页面
var placeholders = ['courses','daily-looks','shop','login'];
var icons = {courses:'🚧','daily-looks:'🚧',shop:'🛍️',login:'🔐'};
placeholders.forEach(function(pg) {
  writePage(distPath, pg,
    '<view style="background:#f8f7f4;height:100vh;display:flex;align-items:center;justify-content:center"><text style="font-size:40px">' + (icons[pg]||'📄') + '</text><text style="color:#999;font-size:15px;display:block;margin-top:12px">' + pg.toUpperCase() + '</text></view>',
    'Page({})'
  );
});

// 清理 app.wxss
fs.writeFileSync(distPath + '/app.wxss', 'page{background-color:#f8f7f4;color:#333;}');

console.log('OK: all pages replaced with native code');

var project = new ci.Project({
  appid: appid,
  type: 'miniProgram',
  projectPath: distPath,
  ignoreDevFiles: true,
  privateKeyPath: keyPath
});

ci.upload({
  project: project,
  version: process.env.GITHUB_RUN_NUMBER || '1',
  desc: 'native v' + (process.env.GITHUB_RUN_NUMBER || '1'),
  setting: { es6: true, es7: true, enhance: true },
  robot: 1
}).then(function() {
  console.log('UPLOAD OK!');
}).catch(function(e) {
  console.error('UPLOAD FAIL:', e.message);
  process.exit(1);
});
