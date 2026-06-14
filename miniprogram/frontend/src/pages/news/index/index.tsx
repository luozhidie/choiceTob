import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { getNews } from '@/services/api'
import './index.scss'

export default function NewsPage() {
  const [activeTab, setActiveTab] = useState<'blog' | 'magazine' | 'trends'>('blog')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '资讯' })
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // TODO: 对接 API
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const mockNews = [
    { id: 1, title: '2026春夏服装流行色趋势解读', date: '2026-06-10', category: '趋势' },
    { id: 2, title: '色彩搭配技巧：如何找到你的本命色', date: '2026-06-08', category: '搭配' },
    { id: 3, title: '杂志精选：夏日穿搭灵感合集', date: '2026-06-05', category: '杂志' },
    { id: 4, title: '面料知识：真丝 vs 仿真丝怎么分辨', date: '2026-06-03', category: '知识' },
    { id: 5, title: '买手必读：如何从批发市场淘到爆款', date: '2026-06-01', category: '买手' },
  ]

  return (
    <View className="news-page">
      {/* Tab 切换 */}
      <View className="tab-bar">
        {[
          { key: 'blog' as const, label: '博客资讯' },
          { key: 'magazine' as const, label: '杂志' },
          { key: 'trends' as const, label: '时尚趋势' },
        ].map(tab => (
          <View
            key={tab.key}
            className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text>{tab.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView className="content" scrollY>
        <View className="news-list">
          {mockNews.map(item => (
            <View key={item.id} className="news-card" onClick={() => Taro.navigateTo({ url: `/pages/news/detail/index?id=${item.id}` })}>
              <View className="news-card-img">
                <View className="img-placeholder" />
              </View>
              <View className="news-card-info">
                <Text className="news-category">{item.category}</Text>
                <Text className="news-title">{item.title}</Text>
                <Text className="news-date">{item.date}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
