// 小程序页面文案默认值（会员中心 / 新客页 / 虚拟试衣系列）
// 与后台 /admin/page-copy 及 SQL 种子保持一致；后台改了实时覆盖此处。
module.exports = {
  member: {
    badge: "🛡 会员专享服务中心",
    title: "骆芷蝶智选 · 会员中心",
    subtitle: "整合VIP服务、商品企划、爆款样衣、营销策划的一站式赋能平台",
    userCard: {
      vipActive: "✓ VIP 已激活",
      vipInactive: "未开通VIP",
      defaultName: "会员用户",
      openBtn: "开通"
    },
    sectionTitle: "会员专享功能",
    cards: [
      { tag: "热门", icon: "VIP", name: "VIP 会员服务", desc: "专属选品权、设计稿优先、大数据爆款推荐", btn: "立即进入 →" },
      { tag: "AI驱动", icon: "企", name: "商品企划中心", desc: "AI驱动的商品开发决策、96格货盘矩阵、采购清单生成", btn: "立即进入 →" },
      { tag: "独家", icon: "爆", name: "爆款样衣展厅", desc: "精选市场最新爆款样衣，会员可查看详情与价格，看中即咨询下单", btn: "立即进入 →" },
      { tag: "智能", icon: "营", name: "营销策划工具", desc: "AI营销方案生成、推广策略建议、投放效果预估", btn: "立即进入 →" }
    ],
    modals: {
      plan: { title: "商品企划中心", content: "AI驱动的商品开发决策\n96格货盘矩阵\n采购清单生成\n\n开发中，敬请期待" },
      marketing: { title: "营销策划工具", content: "AI营销方案生成\n推广策略建议\n投放效果预估\n\n开发中，敬请期待" }
    }
  },
  newcustomer: {
    heroTag: "新人专享",
    heroTitle: "首单 4 重福利",
    heroSub: "下单即享，限时放送，错过不再有",
    benefits: [
      { icon: "📦", title: "满199包邮", desc: "首单满199全国包邮，偏远同享" },
      { icon: "🧥", title: "首单搭配指导", desc: "免费一次一衣多搭指导" },
      { icon: "🧧", title: "满399减30", desc: "注册即领新人专享红包" },
      { icon: "⚡", title: "优先发货", desc: "新人订单优先拣货极速发" }
    ],
    stepsTitle: "如何领取",
    steps: [
      "注册并登录骆芷蝶智选账号",
      "浏览专场 / 分类，加入购物车",
      "结算时自动抵扣福利，优先发货"
    ],
    cta: "一键领取新客红包 ›",
    toast: "新客红包已放入卡券包",
    shelf: {
      title: "新客下单专栏货架",
      sub: "精选好物 · 新人专享价",
      hint: "进入「专场」或「分类」挑选新人专享好货",
      btn: "去逛新人专享 ›"
    }
  },
  tryon: {
    aiTag: "AI生成",
    aiText: "本页内容由人工智能生成，仅供参考，请以实物与专业判断为准",
    promo: {
      tag: "骆芷蝶智选 · 云衣橱•AI虚拟试衣",
      title: "先试再买\n穿上身再决定",
      sub: "上传你的照片，AI 把衣服「穿」到你身上。好不好看，一眼就知道。",
      badges: ["9.9元首单", "30 秒出图", "隐私保护"],
      ctaMain: "新人首单 ¥9.9 试穿",
      ctaSub: "12 次普通试穿 · 限时",
      stepsTitle: "三步，看见上身效果",
      steps: [
        { t: "上传照片", d: "正面半身照，仅用于本次合成" },
        { t: "挑选衣服", d: "从店铺商品里选，或 AI 推荐" },
        { t: "生成上身图", d: "AI 合成真实穿着效果" }
      ],
      entryTitle: "选择你的试衣方式",
      entries: [
        { emoji: "👕", name: "普通版", sub: "快速看上身 · ¥99/月 120 次" },
        { emoji: "✨", name: "专业版", sub: "诊断+搭配 · ¥998/100 次" },
        { emoji: "📖", name: "怎么用", sub: "一步步图文教程" },
        { emoji: "❓", name: "常见问题", sub: "隐私/效果/退订" }
      ]
    },
    guide: {
      title: "怎么用 · 4 步穿上身",
      sub: "不用学，跟着走一遍就会。整个过程约 1 分钟。",
      steps: [
        { n: "1", t: "上传照片", d: "拍一张正面半身照。照片只用于本次 AI 合成，不会留存或公开。", tip: "光线均匀、背景干净，效果更准" },
        { n: "2", t: "挑选衣服", d: "从店铺里挑想试的款，或让 AI 按你的风格推荐。也能上传自己的衣服图。", tip: "一次可多选几件对比" },
        { n: "3", t: "生成上身图", d: "点「试穿」，AI 把衣服「穿」到你身上，约 30 秒出图。", tip: "普通版一键合成，专业版带风格诊断" },
        { n: "4", t: "看效果做决定", d: "上身图、颜色、版型一眼可见，喜欢再下单，不踩雷。", tip: "专业版还能看 AI 搭配建议" }
      ],
      ctaTip: "看懂了？去试一件看看",
      ctaBtn: "进入试衣台"
    },
    faq: {
      title: "常见问题",
      sub: "还有疑问？这里先答。",
      faqs: [
        { q: "照片会被保存或公开吗？", a: "不会。照片仅用于本次 AI 试衣合成，处理后不保留、不公开。" },
        { q: "试衣效果能当真实试穿看吗？", a: "AI 合成效果仅供参考，帮助你判断款式、颜色是否适合自己。" },
        { q: "专业版可以随时取消吗？", a: "可以。到期不续费自动回到基础版，已购权益不受影响。" },
        { q: "普通版和专业版能同时用吗？", a: "能。专业版包含普通版全部功能，开通专业版后两者权益合并计算。" }
      ]
    },
    normal: {
      title: "普通版",
      sub: "快速看上身 · 不想研究搭配选这个",
      includeTitle: "包含",
      excludeTitle: "不含",
      include: ["上传自己的人像照片", "上传想试穿的衣服照片", "一键 AI 合成上身效果", "从店铺挑选商品试穿"],
      exclude: ["风格诊断", "AI 智能搭配 / 买手推荐"],
      pkgFirstTitle: "首单体验",
      pkgFirstSub: "12 次普通试穿",
      pkgFirstPriceLabel: "¥9.9",
      pkgFirstBtn: "购买 ¥9.9",
      pkgMonthTitle: "普通月卡",
      pkgMonthSub: "30 天 120 次普通试穿",
      pkgMonthPriceLabel: "¥99",
      pkgMonthBtn: "购买 ¥99"
    },
    pro: {
      title: "专业版",
      sub: "诊断 + 搭配",
      sub2: "在普通版基础上，加 14 题风格诊断与 AI 智能搭配。",
      features: ["普通版全部功能", "14 题穿衣风格诊断", "AI 按风格自动生成造型", "风格匹配 + 场合搭配建议"],
      pkgTitle: "专业版",
      pkgSub: "100 次专业诊断 · 含 14 题风格测试 / 八大风格真人试穿",
      pkgPriceLabel: "¥998",
      pkgBtn: "购买 ¥998"
    }
  },

  agent: {
    recruit: {
      done: {
        title: "提交成功",
        desc: "我们已收到你的代理申请，专属顾问会在 1-2 个工作日内联系你",
        btn: "返回首页"
      },
      hero: {
        badge: "JOIN AGENT",
        title: "成为销售代理",
        desc: "共享时尚产业红利，预存货款享会员价，邀好友再得返利"
      },
      advantages: {
        label: "ADVANTAGES",
        title: "权益优势",
        cards: [
          { icon: "📈", title: "数据驱动", desc: "AI 选品 + 销售预测，降低压货风险" },
          { icon: "🎨", title: "设计支持", desc: "专业设计团队，季度更新 300+ 款" },
          { icon: "📦", title: "直采货源", desc: "广州/杭州直采，价格优势明显" },
          { icon: "🎓", title: "培训体系", desc: "从零到专业买手的全链路培训" }
        ]
      },
      conditions: {
        label: "CONDITIONS",
        title: "升级条件",
        items: [
          "认同品牌理念，遵纪守法",
          "有实体渠道或线上销售渠道",
          "具备一定资金实力与抗风险能力",
          "愿接受平台统一管理及培训",
          "有良好商业信誉与服务意识"
        ]
      },
      apply: {
        label: "APPLY NOW",
        title: "立即报名",
        submitText: "提交报名",
        submittingText: "提交中...",
        tip: "提交即表示同意我们与你联系，信息仅用于代理审核"
      }
    },
    shop: {
      loading: "加载中…",
      empty: { emoji: "🔗", title: "链接无效", desc: "链接不存在或未激活", btn: "回到首页" },
      shopHead: { badge: "专属精选店", nameSuffix: " 的精选店", desc: "先试再买 · 由专属买手为你服务" },
      tryBar: { emoji: "👗", title: "云衣橱 · AI 虚拟试衣", desc: "上传照片，先看上身效果再决定", btn: "去试衣 ›" },
      product: { buyBtn: "立即买", tryBtn: "试穿 ›" },
      tip: "价格由店铺设定",
      paySheet: { addrEmpty: "＋ 选择收货地址", payPrefix: "微信支付 ¥" }
    }
  },

  certify: {
    intro: {
      badge: "认证会员 · 开通会员价",
      title: "填写资料，即刻开通会员价查看权",
      benefitTitle: "认证后可享 4 大权益",
      benefits: [
        { icon: "价", name: "会员价查看权", desc: "认证即可查看所有商品会员价" },
        { icon: "退", name: "退换额度", desc: "充值后享阶梯退换额度" },
        { icon: "新", name: "新款抢先看", desc: "当季新品提前浏览推荐" },
        { icon: "荐", name: "精准推荐", desc: "基于店铺画像匹配款式" }
      ],
      btn: "开始填写 →"
    },
    steps: {
      identity: "1/4 店铺基本信息",
      profile: "2/4 经营画像",
      extra: "3/4 补充信息"
    },
    sections: {
      basic: { icon: "🏪", title: "基本信息", hint: "*全项必填" },
      market: { icon: "🚛", title: "主要采购渠道", hint: "*至少选1个" },
      freq: { icon: "📅", title: "月均采购频次", hint: "*" },
      category: { icon: "👗", title: "主营品类", hint: "*至少选1个" },
      style: { icon: "🎨", title: "风格偏好", hint: "*至少选1个" },
      target: { icon: "👥💰", title: "目标客群", hint: "*" },
      location: { icon: "📍", title: "店铺位置", hint: "*" },
      photos: { icon: "📷", title: "店铺照片", hint: "*各1张" },
      proof: { icon: "🧾", title: "购物凭证", hint: "*" },
      bizData: { icon: "📊", title: "经营数据", hint: "选填" },
      notes: { icon: "📝", title: "备注 / 需求说明", hint: "选填" }
    },
    photos: {
      frontTitle: "点击上传门头照", frontTip: "展示招牌/店招", frontLabel: "* 店铺门头照",
      interiorTitle: "点击上传陈列照", interiorTip: "展示店内陈列/货架", interiorLabel: "* 店内陈列照",
      proofTitle: "点击上传购物凭证", proofTip: "拍照或相册选取近期购物凭证", proofLabel: "* 上传购物凭证（必填）"
    },
    btns: {
      nextIdentity: "下一步：经营画像 →",
      nextProfile: "下一步：补充信息 →",
      submit: "提交认证，开通会员价 🛡",
      submitting: "提交中...",
      goBuyer: "去看款选购",
      goMy: "前往个人中心"
    },
    done: {
      crown: "👑",
      tit: "认证成功！🎉",
      sub: "会员价已开启 · 信息已同步至后台",
      items: [
        { b: "会员价已解锁", t: "全店商品可看会员价" },
        { b: "退换额度", t: "开通充值会员后生效" },
        { b: "新款抢先看", t: "当季新品提前推荐" },
        { b: "精准款式推荐", t: "按店铺画像匹配" }
      ]
    },
    login: {
      tit: "请先登录",
      dsc: "认证会员需先登录账号",
      btn: "去登录",
      back: "返回首页"
    }
  }
};
