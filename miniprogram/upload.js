const ci = require('miniprogram-ci');
const fs = require('fs');
const path = require('path');

const appid = process.env.WECHAT_APPID || '';
const keyPath = './private.key';
const distPath = process.argv[2] || './dist';

if (!fs.existsSync(distPath) || !fs.existsSync(keyPath) || !fs.existsSync(`${distPath}/app.json`)) {
  console.error('❌ 必要文件不存在!');
  process.exit(1);
}

// ========== 用原生代码替换所有页面（绕过 Taro 渲染 bug）==========

// 首页
fs.writeFileSync(path.join(distPath, 'pages/home/index.wxml'), `<view style="background-color:#f8f7f4;min-height:100vh">
  <!-- Hero -->
  <view style="background-color:#2d1b2e;padding-top:50px;padding-bottom:30px;padding-left:20px;padding-right:20px">
    <text style="font-size:24px;font-weight:bold;color:#ffffff">骆芷蝶供应链</text>
    <text style="font-size:13px;color:#c4b5a8;margin-top:6px;display:block">服装门店一站式赋能平台</text>
    <view bindtap="goBuyer" style="display:flex;flex-direction:row;align-items:center;background-color:rgba(255,255,255,0.12);border-radius:25px;padding-top:11px;padding-bottom:11px;padding-left:16px;padding-right:16px;margin-top:24">
      <text style="font-size:14px;color:#fff">🔍 搜索商品...</text>
    </view>
    <view style="display:flex;flex-direction:row;margin-top:20;flex-wrap:wrap">
      <view wx:for="{{tags}}" wx:key="*this" style="padding-top:6px;padding-bottom:6px;padding-left:14px;padding-right:14px;border-radius:20px;border-width:1px;border-style:solid;border-color:rgba(255,255,255,0.15);margin-right:8;margin-bottom:8"><text style="font-size:11px;color:rgba(255,255,255,0.7)">{{item}}</text></view>
    </view>
  </view>

  <!-- 功能入口 -->
  <view style="display:flex;flex-direction:row;background-color:#ffffff;margin-left:16px;margin-right:16px;border-radius:16px;padding-top:20px;padding-bottom:20px;margin-top:-16">
    <view bindtap="goBuyer" style="flex:1;display:flex;flex-direction:column;align-items:center"><text style="font-size:28px">🛍️</text><text style="font-size:11px;color:#666666;margin-top:6px">买手选品</text></view>
    <view bindtap="goCourses" style="flex:1;display:flex;flex-direction:column;align-items:center"><text style="font-size:28px">📚</text><text style="font-size:11px;color:#666666;margin-top:6px">线上课程</text></view>
    <view bindtap="goLooks" style="flex:1;display:flex;flex-direction:column;align-items:center"><text style="font-size:28px">🎨</text><text style="font-size:11px;color:#666666;margin-top:6px">每日搭配</text></view>
    <view bindtap="goMy" style="flex:1;display:flex;flex-direction:column;align-items:center"><text style="font-size:28px">👑</text><text style="font-size:11px;color:#666666;margin-top:6px">VIP会员</text></view>
  </view>

  <!-- 商品列表 -->
  <view style="padding:20px;background-color:#ffffff;margin-top:12px">
    <text style="font-size:16px;font-weight:bold;color:#2d1b2e;margin-bottom:16px">🔥 热门选品</text>
    <block wx:if="{{products.length > 0}}">
      <view style="display:flex;flex-direction:row;flex-wrap:wrap;justify-content:space-between">
        <view wx:for="{{products}}" wx:key="id" bindtap="goShop" data-id="{{item.id}}" style="width:47%;background-color:#f8f7f4;border-radius:12px;overflow:hidden;margin-bottom:10">
          <image src="{{item.image_url || item.cover_image}}" mode="aspectFill" style="width:100%;height:140px;background-color:#eee"/>
          <view style="padding:8px">
            <text style="font-size:12px;color:#333333">{{item.name || item.title || '商品'}}</text>
            <text style="font-size:14px;color:#e89a5c;font-weight:bold;margin-top:4px;display:block">¥{{item.priceText}}</text>
          </view>
        </view>
      </view>
    </view>
    <block wx:else>
      <view style="padding-top:40px;padding-bottom:40px;display:flex;flex-direction:column;align-items:center">
        <text style="font-size:30px">📦</text>
        <text style="color:#999999;font-size:13px;margin-top:10px">加载中...</text>
      </view>
    </block>
  </view>

  <!-- 底部 -->
  <view style="padding:40px;display:flex;flex-direction:column;align-items:center;padding-bottom:80px">
    <text style="font-size:18px;font-weight:bold;color:#2d1b2e">爆款选品 · 拿货精选</text>
    <text style="font-size:12px;color:#888888;margin-top:6px">骆芷蝶智选 · 专业推荐</text>
  </view>
</view>`);

fs.writeFileSync(path.join(distPath, 'pages/home/index.js'), \`Page({
  data: { tags: ['全部','服装','护肤','彩妆'], products: [] },
  onLoad() {
    var that = this;
    wx.request({
      url: 'https://colour-choice.art/api/public/products?limit=6',
      method: 'GET',
      success(res) {
        var list = (res.data && res.data.data) || [];
        list.forEach(function(p) { p.priceText = Number(p.price||0).toFixed(2); });
        that.setData({ products: list });
      }
    });
  },
  goBuyer() { wx.navigateTo({ url: '/pages/buyer/index' }); },
  goCourses() { wx.navigateTo({ url: '/pages/courses/index' }); },
  goLooks() { wx.navigateTo({ url: '/pages/daily-looks/index' }); },
  goMy() { wx.switchTab({ url: '/pages/my/index' }); },
  goShop(e) { wx.navigateTo({ url: '/pages/shop/index?id=' + e.currentTarget.dataset.id }); }
});\`);

fs.writeFileSync(path.join(distPath, 'pages/home/index.json'), '{}');

fs.writeFileSync(path.join(distPath, 'pages/home/index.wxss'), '');

// 买手页
fs.writeFileSync(path.join(distPath, 'pages/buyer/index.wxml'), \`<view style="background-color:#f8f7f4;min-height:100vh;padding-top:50px;padding-left:20px;padding-right:20px">
  <text style="font-size:22px;font-weight:bold;color:#2d1b2e">买手选品</text>
  <view style="display:flex;flex-direction:row;align-items:center;background-color:#fff;border-radius:25px;padding:12px 16px;margin-top:16px;border-width:1px;border-style:solid;border-color:#ddd">
    <input placeholder="搜索商品..." style="flex:1;font-size:14px" confirm-type="search" bindconfirm="onSearch"/>
  </view>
  <view style="display:flex;flex-direction:row;flex-wrap:wrap;margin-top:16px">
    <view wx:for="{{categories}}" wx:key="*this" bindtap="filterCat" data-cat="{{item}}" style="padding:8px 16px;border-radius:20px;margin-right:10px;margin-bottom:10px;background-color:{{activeCat===item?'#e89a5c':'#f0f0f0'}}"><text style="font-size:12px;color:{{activeCat===item?'#fff':'#666'}}">{{item}}</text></view>
  </view>
  <block wx:if="{{filteredProducts.length > 0}}">
    <view style="display:flex;flex-direction:row;flex-wrap:wrap;justify-content:space-between;margin-top:16px">
      <view wx:for="{{filteredProducts}}" wx:key="id" bindtap="goShop" data-id="{{item.id}}" style="width:47%;background-color:#fff;border-radius:12px;overflow:hidden;margin-bottom:10px">
        <image src="{{item.image_url || item.cover_image}}" mode="aspectFill" style="width:100%;height:140px;background-color:#eee"/>
        <view style="padding:8px"><text style="font-size:12px;color:#333">{{item.name||item.title||'商品'}}</text><text style="font-size:14px;color:#e89a5c;font-weight:bold;margin-top:4px;display:block">¥{{item.priceText}}</text></view>
      </view>
    </view>
  </block>
  <block wx:else><view style="padding:60px 20px;text-align:center"><text style="color:#999;font-size:14px">暂无商品</text></view></block>
</view>\`);
fs.writeFileSync(path.join(distPath, 'pages/buyer/index.js'), \`Page({
  data: { categories: ['全部','服装','护肤','彩妆','养生','食品','配饰'], activeCat:'全部', allProducts:[], filteredProducts:[] },
  onLoad() {
    var t = this;
    wx.request({ url: 'https://colour-choice.art/api/public/products?limit=20', method: 'GET',
      success(r) {
        var list = (r.data&&r.data.data)||[];
        list.forEach(function(p){p.priceText=Number(p.price||0).toFixed(2);});
        t.setData({allProducts:list, filteredProducts:list});
      }
    });
  },
  filterCat(e){var c=e.currentTarget.dataset.cat; this.setData({activeCat:c, filteredProducts:c==='全部'?this.data.allProducts:this.data.allProducts.filter(function(p){return p.category===c;})});},
  onSearch(e){console.log('search:',e.detail.value);},
  goShop(e){wx.navigateTo({url:'/pages/shop?id='+e.currentTarget.dataset.id});}
});\`);
fs.writeFileSync(path.join(distPath, 'pages/buyer/index.json'), '{}');
fs.writeFileSync(path.join(distPath, 'pages/buyer/index.wxss'), '');

// 购物车
fs.writeFileSync(path.join(distPath, 'pages/cart/index.wxml'), \`<view style="background-color:#f8f7f4;min-height:100vh;padding-top:50px;padding:20px;text-align:center;padding-top:120px">
  <text style="font-size:40px">🛒</text>
  <text style="color:#999;font-size:15px;margin-top:16px;display:block">购物车是空的</text>
  <text style="color:#bbb;font-size:13px;margin-top:8px;display:block">去选品页逛逛吧~</text>
</view>\`);
fs.writeFileSync(path.join(distPath, 'pages/cart/index.js'), 'Page({})');
fs.writeFileSync(path.join(distPath, 'pages/cart/index.json'), '{}');
fs.writeFileSync(path.join(distPath, 'pages/cart/index.wxss'), '');

// 我的
fs.writeFileSync(path.join(distPath, 'pages/my/index.wxml'), \`<view style="background-color:#f8f7f4;min-height:100vh;padding-top:50px;padding:20px">
  <view style="display:flex;flex-direction:row;align-items:center;padding-bottom:24px;border-bottom-width:1px;border-bottom-style:solid;border-color:#eee">
    <view style="width:60px;height:60px;border-radius:30px;background-color:#2d1b2e;display:flex;justify-content:center;align-items:center"><text style="font-size:24px;color:#fff">骆</text></view>
    <view style="margin-left:16px"><text style="font-size:17px;font-weight:bold;color:#333">骆芷蝶智选</text><text style="font-size:12px;color:#999;margin-top:4px;display:block">点击登录获取VIP权限</text></view>
  </view>
  <view style="margin-top:24px;background-color:#fff;border-radius:16px;overflow:hidden">
    <view wx:for="{{menus}}" wx:key="icon" bindtap="menuTap" data-url="{{item.url}}" style="display:flex;flex-direction:row;align-items:center;padding:18px 20px;border-bottom-width:1px;border-bottom-style:solid;border-color:#f5f5f5">
      <text style="font-size:22px;margin-right:16px">{{item.icon}}</text>
      <text style="font-size:15px;color:#333;flex:1">{{item.label}}</text>
      <text style="color:#ccc;font-size:16px">›</text>
    </view>
  </view>
</view>\`);
fs.writeFileSync(path.join(distPath, 'pages/my/index.js'), \`Page({
  data:{menus:[
    {icon:'📋',label:'我的订单',url:'/pages/order/list'},
    {icon:'📍',label:'收货地址',url:'/pages/address/list'},
    {icon:'👑',label:'VIP会员',url:''},
    {icon:'🎫',label:'我的课程',url:'/pages/courses/index'},
    {icon:'💰',label:'优惠券',url:''},
    {icon:'💬',label:'联系客服',url:''}
  ]},
  menuTap(e){if(e.currentTarget.dataset.url){wx.navigateTo({url:e.currentTarget.dataset.url})}}
});\`);
fs.writeFileSync(path.join(distPath, 'pages/my/index.json'), '{}');
fs.writeFileSync(path.join(distPath, 'pages/my/index.wxss'), '');

// 其他占位页面
for (const pg of ['courses', 'daily-looks', 'shop', 'login']) {
  const p = path.join(distPath, 'pages/' + pg);
  fs.mkdirSync(p, { recursive: true });
  fs.writeFileSync(path.join(p, 'index.wxml'), \`<view style="background:#f8f7f4;min-height:100vh;padding:80px 20px;text-align:center"><text style="font-size:40px">${pg==='shop'?🛍️':pg==='login'?'🔐':'🚧'}</text><text style="color:#999;font-size:15px;margin-top:12px;display:block">${pg.toUpperCase()}</text></view>\`);
  fs.writeFileSync(path.join(p, 'index.js'), 'Page({})');
  fs.writeFileSync(path.join(p, 'index.json'), '{}');
  fs.writeFileSync(path.join(p, 'index.wxss'), '');
}

// 清理 app.wxss（去掉 NaNrpx）
fs.writeFileSync(path.join(distPath, 'app.wxss'), 'page{background-color:#f8f7f4;color:#333;}');

console.log('✅ 所有页面已用原生代码重写！开始上传...');

const project = new ci.Project({ appid, type: 'miniProgram', projectPath: distPath, ignoreDevFiles: true, privateKeyPath: keyPath });

ci.upload({
  project,
  version: process.env.GITHUB_RUN_NUMBER || '1',
  desc: 'auto native v' + (process.env.GITHUB_RUN_NUMBER || '1'),
  setting: { es6: true, es7: true, enhance: true },
  robot: 1
}).then(() => console.log('✅ 上传成功!')).catch(e => { console.error('❌:', e.message); process.exit(1); });
