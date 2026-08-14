var SERVICES = {
  buyer_group: {
    key: 'buyer_group',
    label: '买手选品',
    icon: '🛒',
    slogan: '从市场趋势到货品结构的专业决策',
    theory: [
      '流行趋势分析与爆款预判',
      '目标客群定位与需求拆解',
      '品类规划、价格带与 SKU 宽度深度',
      '供应商评估与成本控制'
    ],
    service: [
      '当季趋势解读与选品建议',
      '货品结构优化方案',
      '爆款/基本款/形象款配比',
      '供应商资源对接支持'
    ],
    course: '买手选品实战训练营'
  },
  plan: {
    key: 'plan',
    label: '商品企划',
    icon: '📋',
    slogan: '全季度商品策略与上市节奏',
    theory: [
      '主题企划与系列故事线',
      '波段上市与生命周期管理',
      '销售目标拆解与库存周转',
      '数据复盘与企划迭代'
    ],
    service: [
      '季度商品企划案输出',
      '上市波段表与订货计划',
      '月度销售目标拆解',
      '库存预警与补货建议'
    ],
    course: '商品企划系统课'
  },
  display: {
    key: 'display',
    label: '陈列搭配',
    icon: '🪟',
    slogan: '视觉销售与空间叙事',
    theory: [
      'VP/PP/IP 三级陈列逻辑',
      '色彩搭配与场景化组货',
      '动线设计与磁石点设置',
      '橱窗主题与季节换装'
    ],
    service: [
      '店铺陈列方案设计',
      '搭配手册与穿搭模板',
      '橱窗/中岛场景设计',
      '陈列培训与执行督导'
    ],
    course: '陈列搭配师认证课'
  },
  marketing: {
    key: 'marketing',
    label: '营销策划',
    icon: '📣',
    slogan: '品牌传播与流量转化',
    theory: [
      '内容营销与品牌故事',
      '私域运营与社群裂变',
      '活动策划与促销节奏',
      'KOL/达人合作与投放'
    ],
    service: [
      '年度营销日历制定',
      '主题活动策划方案',
      '朋友圈/小红书文案包',
      '私域 SOP 与转化链路'
    ],
    course: '服装品牌营销实战课'
  },
  sales: {
    key: 'sales',
    label: '销售服务',
    icon: '💡',
    slogan: '终端销售与客户关系',
    theory: [
      '销售话术与异议处理',
      '客户分层与精准推荐',
      '连带销售与客单价提升',
      '会员权益与复购激活'
    ],
    service: [
      '销售话术手册定制',
      '门店业绩诊断',
      '客户跟进 SOP',
      '连带搭配销售培训'
    ],
    course: '金牌店长销售课'
  },
  vip: {
    key: 'vip',
    label: 'VIP管理',
    icon: '⭐',
    slogan: '高价值客户运营与复购提升',
    theory: [
      '客户分层与 RFM 模型',
      'VIP 专属服务设计',
      '私域社群与情感连接',
      '复购周期与流失预警'
    ],
    service: [
      'VIP 运营方案设计',
      '客户画像与标签体系',
      '复购/唤醒活动策划',
      '专属搭配顾问服务'
    ],
    course: 'VIP 客户管理课'
  },
  design: {
    key: 'design',
    label: '服装设计',
    icon: '✏️',
    slogan: '从灵感到成衣的设计落地',
    theory: [
      '趋势灵感板与主题开发',
      '款式图与工艺单制作',
      '面辅料选择与成本控制',
      '版型调整与样衣跟进'
    ],
    service: [
      '系列款式开发',
      '款式图/工艺单输出',
      '面辅料推荐',
      '打版样衣跟进支持'
    ],
    course: '服装设计实战课'
  }
};

Page({
  data: {
    service: null
  },

  onLoad: function (options) {
    var key = options && options.service;
    var svc = SERVICES[key] || SERVICES.buyer_group;
    wx.setNavigationBarTitle({ title: svc.label });
    this.setData({ service: svc });
  },

  goBack: function () {
    wx.navigateBack();
  },

  goCourse: function () {
    wx.navigateTo({ url: '/pages/courses/index' });
  },

  goAIAssist: function () {
    var key = this.data.service && this.data.service.key;
    wx.navigateTo({ url: '/pages/fashion-stylist/index?service=' + key });
  }
});
