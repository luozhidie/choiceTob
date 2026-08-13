/**
 * Taro 4.2 app 配置 - 交接基准版
 * 作者：WorkBuddy（AI）
 * 说明：此版本已验证 build:weapp 编译成功，勿修改！
 * 如果修改页面列表，必须同步修改 src/pages/ 磁盘结构
 */
export default {
  pages: [
    'pages/home/index',
    'pages/courses/index',
    'pages/hot-picks/index',
    'pages/news/index',
    'pages/vip/index',
    'pages/courses/detail/index',
    'pages/hot-picks/detail/index',
    'pages/news/detail/index',
    'pages/vip/login',
    'pages/vip/register',
    'pages/vip/profile',
    'pages/vip/style-test',
    'pages/planning/index',
    'pages/buyer/index',
    'pages/collocation/index',
    'pages/contact/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1a56db',
    navigationBarTitleText: '骆芷蝶智选',
    navigationBarTextStyle: 'white',
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#1a56db',
    borderStyle: 'white',
    backgroundColor: '#ffffff',
    list: [
      { pagePath: 'pages/home/index', text: '首页', iconPath: 'assets/tabbar/home.png', selectedIconPath: 'assets/tabbar/home-active.png' },
      { pagePath: 'pages/courses/index', text: '课程企划', iconPath: 'assets/tabbar/plan.png', selectedIconPath: 'assets/tabbar/plan-active.png' },
      { pagePath: 'pages/hot-picks/index', text: '爆款样衣', iconPath: 'assets/tabbar/stock.png', selectedIconPath: 'assets/tabbar/stock-active.png' },
      { pagePath: 'pages/news/index', text: '资讯', iconPath: 'assets/tabbar/user.png', selectedIconPath: 'assets/tabbar/user-active.png' },
      { pagePath: 'pages/vip/index', text: 'VIP', iconPath: 'assets/tabbar/vip.png', selectedIconPath: 'assets/tabbar/vip-active.png' },
    ],
  },
}
