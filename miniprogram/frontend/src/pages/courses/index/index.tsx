import { View, Text, ScrollView } from '@tarojs/components'
import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

// 核心业务区块 - 6个卡片
const coreServices = [
  {
    id: 'buyer',
    title: '买手选品',
    subtitle: '大数据趋势洞察',
    desc: '爆款基因锁定，源头提升选品胜率',
    color: '#ff6b9d',
    gradient: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
    icon: '🔍',
    url: '/pages/buyer/index/index',
  },
  {
    id: 'planning',
    title: '商品企划',
    subtitle: '科学品类规划',
    desc: '数据驱动的商品企划工具',
    color: '#2d1b2e',
    gradient: 'linear-gradient(135deg, #2d1b2e 0%, #1a0a1b 100%)',
    icon: '📊',
    url: '/pages/planning/index/index',
  },
  {
    id: 'hot-picks',
    title: '爆款货盘',
    subtitle: '爆款基因锁定',
    desc: '热门爆款样衣精选',
    color: '#e53e3e',
    gradient: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
    icon: '🔥',
    url: '/pages/hot-picks/index/index',
  },
  {
    id: 'collocation',
    title: '陈列搭配',
    subtitle: '智能陈列方案',
    desc: '专业搭配灵感推荐',
    color: '#38a169',
    gradient: 'linear-gradient(135deg, #38a169 0%, #276749 100%)',
    icon: '🎨',
    url: '/pages/collocation/index/index',
  },
  {
    id: 'marketing',
    title: '营销策划',
    subtitle: '全渠道营销',
    desc: '营销策略智能生成',
    color: '#ed8936',
    gradient: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
    icon: '📈',
    url: '',
    comingSoon: true,
  },
  {
    id: 'vip',
    title: 'VIP管理',
    subtitle: '会员运营体系',
    desc: '会员专属权益管理',
    color: '#805ad5',
    gradient: 'linear-gradient(135deg, #805ad5 0%, #6b46c1 100%)',
    icon: '👑',
    url: '/pages/vip/index/index',
  },
]

// TabBar 页面路径（需要用 switchTab 跳转）
const tabBarPages = [
  '/pages/home/index/index',
  '/pages/category/index/index',
  '/pages/hot-picks/index/index',
  '/pages/news/index/index',
  '/pages/vip/index/index',
]

export default function CoursesPage() {
  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '课程企划' })
    Taro.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#2d1b2e',
    })
  }, [])

  const handleServiceClick = (service: typeof coreServices[0]) => {
    if (service.comingSoon) {
      Taro.showToast({ title: '开发中，敬请期待', icon: 'none' })
      return
    }
    if (service.url) {
      if (tabBarPages.includes(service.url)) {
        Taro.switchTab({ url: service.url })
      } else {
        Taro.navigateTo({ url: service.url })
      }
    }
  }

  const handleBlogClick = () => {
    Taro.switchTab({ url: '/pages/news/index/index' })
  }

  const handleStyleTestClick = () => {
    Taro.navigateTo({ url: '/pages/vip/style-test/index/index' })
  }

  const handleBuyerClick = () => {
    Taro.navigateTo({ url: '/pages/buyer/index/index' })
  }

  return (
    <ScrollView className="courses-page" scrollY scrollWithAnimation>
      {/* ====== 页面顶部标题区 ====== */}
      <View className="page-header">
        <View className="header-content">
          <Text className="header-title">课程企划</Text>
          <Text className="header-subtitle">COURSE PLANNING</Text>
        </View>
      </View>

      {/* ====== CORE SERVICES 核心业务区块 ====== */}
      <View className="section-block">
        <View className="section-header-row">
          <Text className="section-title">核心业务</Text>
          <Text className="section-subtitle">CORE SERVICES</Text>
        </View>

        <View className="services-grid">
          {coreServices.map((service) => (
            <View
              key={service.id}
              className="service-card"
              style={{ background: service.gradient }}
              onClick={() => handleServiceClick(service)}
            >
              <View className="service-card-content">
                <View className="service-card-top">
                  <Text className="service-icon">{service.icon}</Text>
                  <View className="service-text-wrap">
                    <Text className="service-title">{service.title}</Text>
                    <Text className="service-subtitle">{service.subtitle}</Text>
                  </View>
                </View>
                <Text className="service-desc">{service.desc}</Text>
              </View>
              <View className="service-arrow">
                <Text className="arrow-text">→</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ====== BLOG & INFLUENCER 时尚博主区块 ====== */}
      <View className="section-block">
        <View className="section-header-row">
          <Text className="section-title">时尚博主</Text>
          <Text className="section-subtitle">BLOG & INFLUENCER</Text>
        </View>

        <View className="blog-section">
          <View className="blog-empty" onClick={handleBlogClick}>
            <Text className="blog-empty-icon">📝</Text>
            <Text className="blog-empty-text">暂无博文</Text>
            <Text className="blog-empty-hint">点击查看最新资讯 →</Text>
          </View>
        </View>
      </View>

      {/* ====== 风格测试入口 ====== */}
      <View className="section-block">
        <View className="style-test-card" onClick={handleStyleTestClick}>
          <View className="style-test-content">
            <Text className="style-test-title">风格测试</Text>
            <Text className="style-test-subtitle">STYLE TEST</Text>
            <View className="style-test-divider" />
            <Text className="style-test-desc">
              你是哪种风格？{'\n'}
              14个问题，找到你的专属风格
            </Text>
          </View>
          <View className="style-test-btn">
            <Text className="style-test-btn-text">开始测验</Text>
          </View>
        </View>
      </View>

      {/* ====== BUYER SELECTION 买手选品介绍 ====== */}
      <View className="section-block">
        <View className="buyer-intro-card" onClick={handleBuyerClick}>
          <View className="buyer-intro-bg" />
          <View className="buyer-intro-content">
            <Text className="buyer-intro-label">BUYER SELECTION</Text>
            <Text className="buyer-intro-title">买手选品</Text>
            <Text className="buyer-intro-desc">
              大数据趋势洞察 × 爆款基因锁定{'\n'}
              源头提升选品胜率
            </Text>
            <View className="buyer-intro-btn">
              <Text className="buyer-intro-btn-text">立即体验</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ====== 底部安全区 ====== */}
      <View className="bottom-safe" />
    </ScrollView>
  )
}
