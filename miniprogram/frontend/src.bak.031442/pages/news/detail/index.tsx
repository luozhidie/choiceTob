import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { getNewsDetail } from '@/services/api'
import './index.scss'

export default function NewsDetailPage() {
  const [article, setArticle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const params = Taro.useRouter()?.params

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '资讯详情' })
    if (params?.id) loadDetail(params.id)
  }, [params?.id])

  const loadDetail = async (id: string) => {
    try {
      // const data = await getNewsDetail(id)
      // setArticle(data)
      // 模拟数据
      setArticle({
        title: '2026春夏服装流行色趋势解读',
        date: '2026-06-10',
        category: '趋势',
        content: '本文详细解读2026年春夏服装流行色趋势，包括主要色彩方向、搭配建议和实际应用案例...',
        cover: '',
      })
    } catch (e) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  if (loading || !article) {
    return (
      <View className="loading">
        <Text>加载中...</Text>
      </View>
    )
  }

  return (
    <ScrollView className="news-detail-page" scrollY>
      <View className="article-header">
        <Text className="article-category">{article.category}</Text>
        <Text className="article-title">{article.title}</Text>
        <Text className="article-date">{article.date}</Text>
      </View>
      <View className="article-body">
        <Text className="article-content">{article.content}</Text>
      </View>
    </ScrollView>
  )
}
