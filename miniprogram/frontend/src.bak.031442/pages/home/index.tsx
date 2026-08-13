import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { getHomeData } from '@/services/api'
import './index.scss'

export default function HomePage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '骆芷蝶智选' })
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // TODO: 对接网页版首页 API
      // const data = await getHomeData()
    } catch (e) {
      console.error('加载首页失败', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView className="home-page" scrollY>
      {/* Hero Banner */}
      <View className="hero">
        <View className="hero-overlay" />
        <View className="hero-content">
          <Text className="hero-title">骆芷蝶智选</Text>
          <Text className="hero-subtitle">CMB色彩形象顾问 · 专业服装搭配与选品服务</Text>
          <View className="hero-btns">
            <View className="btn-primary" onClick={() => Taro.navigateTo({ url: '/pages/courses/index' })}>
              <Text>开始学习</Text>
            </View>
            <View className="btn-outline" onClick={() => Taro.navigateTo({ url: '/pages/hot-picks/index' })}>
              <Text>查看爆款</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 核心服务 */}
      <View className="section">
        <Text className="section-title">核心服务</Text>
        <View className="services-grid">
          {[
            { title: '色彩测试', desc: '专业CMB色彩诊断', path: '/pages/vip/style-test/index' },
            { title: '风格测试', desc: '14道题精准定位', path: '/pages/vip/style-test/index' },
            { title: '买手选品', desc: '一站式选品服务', path: '/pages/buyer/index' },
            { title: '商品企划', desc: '数据驱动企划', path: '/pages/planning/index' },
          ].map((s, i) => (
            <View key={i} className="service-card" onClick={() => Taro.navigateTo({ url: s.path })}>
              <Text className="service-title">{s.title}</Text>
              <Text className="service-desc">{s.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 爆款样衣预览 */}
      <View className="section">
        <View className="section-header">
          <Text className="section-title">爆款样衣</Text>
          <Text className="section-more" onClick={() => Taro.switchTab({ url: '/pages/hot-picks/index' })}>查看更多 ›</Text>
        </View>
        <Text className="section-desc">开通¥998/月会员，查看高清图片、价格与商品详情</Text>
        <View className="hot-picks-preview">
          {[1,2,3].map(i => (
            <View key={i} className="hot-pick-card">
              <View className="hot-pick-img-placeholder" />
              <Text className="hot-pick-name">样衣预览 {i}</Text>
              <Text className="hot-pick-price">¥---</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 最新资讯 */}
      <View className="section">
        <View className="section-header">
          <Text className="section-title">最新资讯</Text>
          <Text className="section-more" onClick={() => Taro.switchTab({ url: '/pages/news/index' })}>查看更多 ›</Text>
        </View>
        {[1,2,3].map(i => (
          <View key={i} className="news-item" onClick={() => Taro.navigateTo({ url: '/pages/news/detail/index?id=' + i })}>
            <View className="news-item-img-placeholder" />
            <View className="news-item-info">
              <Text className="news-item-title">资讯标题 {i}</Text>
              <Text className="news-item-date">2026-06-11</Text>
            </View>
          </View>
        ))}
      </View>

      {/* 联系客服 */}
      <View className="section contact-section">
        <Text className="section-title">联系我们</Text>
        <View className="contact-info">
          <Text className="contact-item">📞 Tel：13925997776</Text>
          <Text className="contact-item">💬 WX：luozhidie666</Text>
        </View>
      </View>
    </ScrollView>
  )
}
