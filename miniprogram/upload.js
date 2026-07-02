const ci = require('miniprogram-ci');
const fs = require('fs');
const path = require('path');

var appid = process.env.WECHAT_APPID || '';
var keyPath = './private.key';
var distPath = './dist';

// 确保 dist 目录存在
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

// ============ 生成原生小程序项目结构 ===========
// app.json
fs.writeFileSync(path.join(distPath, 'app.json'), JSON.stringify({
  pages: [
    'pages/home/index',
    'pages/buyer/index',
    'pages/cart/index',
    'pages/my/index'
  ],
  window: {
    navigationBarBackgroundColor: '#2d1b2e',
    navigationBarTitleText: '骆芷蝶智选',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#2d1b2e',
    backgroundColor: '#ffffff',
    list: [
      { pagePath: 'pages/home/index', text: '首页', iconPath: 'assets/tabbar/home.png', selectedIconPath: 'assets/tabbar/home-active.png' },
      { pagePath: 'pages/buyer/index', text: '选品', iconPath: 'assets/tabbar/stock.png', selectedIconPath: 'assets/tabbar/stock-active.png' },
      { pagePath: 'pages/cart/index', text: '购物车', iconPath: 'assets/tabbar/cart.png', selectedIconPath: 'assets/tabbar/cart-active.png' },
      { pagePath: 'pages/my/index', text: '我的', iconPath: 'assets/tabbar/user.png', selectedIconPath: 'assets/tabbar/user-active.png' }
    ]
  }
}, null, 2));

// app.wxss
fs.writeFileSync(path.join(distPath, 'app.wxss'), `
page { background-color: #f8f7f4; color: #333333; font-size: 14px; }
`);

// pages/home/index.wxml
var homeWxml = `
<view style="background:#f8f7f4;min-height:100vh">
  <view style="background:#2d1b2e;padding:50px 20px 30px 20px">
    <text style="font-size:24px;font-weight:bold;color:#fff;display:block">骆芷蝶供应链</text>
    <text style="font-size:13px;color:#c4b5a8;margin-top:6px;display:block">服装门店一站式赋能平台</text>
    <view bindtap="goBuyer" style="display:flex;align-items:center;background:rgba(255,255,255,0.12);border-radius:25px;padding:11px 16px;margin-top:24px">
      <text style="font-size:14px;color:#fff">🔍 搜索商品...</text>
    </view>
  </view>
  <view style="display:flex;background:#fff;margin:0 16px;border-radius:16px;padding:20px;margin-top:-16px">
    <view bindtap="goBuyer" style="flex:1;display:flex;flex-direction:column;align-items:center">
      <text style="font-size:28px">🛍️</text>
      <text style="font-size:11px;color:#666;margin-top:6px">买手选品</text>
    </view>
    <view bindtap="goCourses" style="flex:1;display:flex;flex-direction:column;align-items:center">
      <text style="font-size:28px">📚</text>
      <text style="font-size:11px;color:#666;margin-top:6px">线上课程</text>
    </view>
    <view bindtap="goLooks" style="flex:1;display:flex;flex-direction:column;align-items:center">
      <text style="font-size:28px">🎨</text>
      <text style="font-size:11px;color:#666;margin-top:6px">每日搭配</text>
    </view>
    <view bindtap="goMy" style="flex:1;display:flex;flex-direction:column;align-items:center">
      <text style="font-size:28px">👑</text>
      <text style="font-size:11px;color:#666;margin-top:6px">VIP会员</text>
    </view>
  </view>
  <view style="padding:20px;background:#fff;margin-top:12px">
    <text style="font-size:16px;font-weight:bold;color:#2d1b2e;display:block;margin-bottom:16px">🔥 热门选品</text>
    <block wx:if="{{products.length > 0}}">
      <view style="display:flex;flex-wrap:wrap;justify-content:space-between">
        <view wx:for="{{products}}" wx:key="id" bindtap="goShop" data-id="{{item.id}}" style="width:47%;background:#f8f7f4;border-radius:12px;overflow:hidden;margin-bottom:10px">
          <image src="{{item.image_url || item.cover_image}}" mode="aspectFill" style="width:100%;height:140px;background:#eee"/>
          <view style="padding:8px">
            <text style="font-size:12px;color:#333">{{item.name || item.title || '商品'}}</text>
            <text style="font-size:14px;color:#e89a5c;font-weight:bold;display:block;margin-top:4px">¥{{item.priceText}}</text>
          </view>
        </view>
      </view>
    </block>
    <block wx:else>
      <view style="padding:40px 0;text-align:center">
        <text style="font-size:30px">📦</text>
        <text style="color:#999;font-size:13px;display:block;margin-top:10px">暂无商品数据</text>
      </view>
    </block>
  </view>
  <view style="padding:40px;text-align:center;padding-bottom:80px">
    <text style="font-size:18px;font-weight:bold;color:#2d1b2e">爆款选品 · 拿货精选</text>
    <text style="font-size:12px;color:#888;margin-top:6px;display:block">骆芷蝶智选 · 专业推荐</text>
  </view>
</view>`;

// pages/home/index.js
var homeJs = `
Page({
  data: { products: [] },
  onLoad: function() {
    var that = this;
    wx.request({
      url: 'https://colour-choice.art/api/public/products?limit=6',
      method: 'GET',
      success: function(res) {
        var list = (res.data && res.data.data) || [];
        list.forEach(function(p) { p.priceText = Number(p.price || 0).toFixed(2); });
        that.setData({ products: list });
      }
    });
  },
  goBuyer: function() { wx.navigateTo({ url: '/pages/buyer/index' }); },
  goCourses: function() { wx.navigateTo({ url: '/pages/courses/index' }); },
  goLooks: function() { wx.navigateTo({ url: '/pages/daily-looks/index' }); },
  goMy: function() { wx.switchTab({ url: '/pages/my/index' }); },
  goShop: function(e) { wx.navigateTo({ url: '/pages/shop/index?id=' + e.currentTarget.dataset.id }); }
});
`;

// 写首页文件
var homeDir = path.join(distPath, 'pages/home');
fs.mkdirSync(homeDir, { recursive: true });
fs.writeFileSync(path.join(homeDir, 'index.wxml'), homeWxml);
fs.writeFileSync(path.join(homeDir, 'index.js'), homeJs);
fs.writeFileSync(path.join(homeDir, 'index.json'), '{}');
fs.writeFileSync(path.join(homeDir, 'index.wxss'), '');

// 写买家页
var buyerDir = path.join(distPath, 'pages/buyer');
fs.mkdirSync(buyerDir, { recursive: true });
fs.writeFileSync(path.join(buyerDir, 'index.wxml'), '<view style="background:#f8f7f4;min-height:100vh;padding:20px"><text style="font-size:22px;font-weight:bold;color:#2d1b2e">买手选品</text><view style="padding:60px 0;text-align:center"><text style="color:#999;font-size:14px">页面开发中...</text></view></view>');
fs.writeFileSync(path.join(buyerDir, 'index.js'), 'Page({})');
fs.writeFileSync(path.join(buyerDir, 'index.json'), '{}');
fs.writeFileSync(path.join(buyerDir, 'index.wxss'), '');

// 写购物车页
var cartDir = path.join(distPath, 'pages/cart');
fs.mkdirSync(cartDir, { recursive: true });
fs.writeFileSync(path.join(cartDir, 'index.wxml'), '<view style="background:#f8f7f4;height:100vh;display:flex;align-items:center;justify-content:center"><text style="font-size:40px">🛒</text><text style="color:#999;font-size:15px;display:block;margin-top:16px">购物车是空的</text></view>');
fs.writeFileSync(path.join(cartDir, 'index.js'), 'Page({})');
fs.writeFileSync(path.join(cartDir, 'index.json'), '{}');
fs.writeFileSync(path.join(cartDir, 'index.wxss'), '');

// 写我的页
var myDir = path.join(distPath, 'pages/my');
fs.mkdirSync(myDir, { recursive: true });
fs.writeFileSync(path.join(myDir, 'index.wxml'), '<view style="background:#f8f7f4;min-height:100vh;padding:20px;padding-top:50px"><view style="display:flex;align-items:center;padding-bottom:24px;border-bottom:1px solid #eee"><view style="width:60px;height:60px;border-radius:30px;background:#2d1b2e;display:flex;justify-content:center;align-items:center"><text style="font-size:24px;color:#fff">骆</text></view><view style="margin-left:16px"><text style="font-size:17px;font-weight:bold;color:#333">骆芷蝶智选</text><text style="font-size:12px;color:#999;margin-top:4px;display:block">点击登录获取VIP权限</text></view></view></view>');
fs.writeFileSync(path.join(myDir, 'index.js'), 'Page({})');
fs.writeFileSync(path.join(myDir, 'index.json'), '{}');
fs.writeFileSync(path.join(myDir, 'index.wxss'), '');

// 复制 tabbar 图标
var assetsDir = path.join(distPath, 'assets/tabbar');
fs.mkdirSync(assetsDir, { recursive: true });
var srcAssets = path.join('.', 'assets/tabbar');
if (fs.existsSync(srcAssets)) {
  var files = fs.readdirSync(srcAssets);
  files.forEach(function(f) {
    fs.copyFileSync(path.join(srcAssets, f), path.join(assetsDir, f));
  });
}

console.log('✅ 原生小程序代码已生成，开始上传...');

// 上传
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
  setting: { es6: true, es7: true, enhance: true, compileHotReload: false, autoAudit: false },
  robot: 1
}).then(function() {
  console.log('✅ 上传成功！');
}).catch(function(e) {
  console.error('❌ 上传失败:', e.message);
  process.exit(1);
});
