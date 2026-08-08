import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { supabase } from '@/services/supabase'
import './index.scss'

interface Product {
  id: string
  title: string
  description: string | null
  image_urls: string[] | null
  price: number | null
  is_published: boolean
}

interface OutfitMatch {
  id: string
  title: string
  description: string | null
  product_ids: string[]
  style_tags: string[] | null
  season_tags: string[] | null
  occasion: string | null
  is_published: boolean
  published_at: string | null
}

export default function CollocationPage() {
  const [activeTab, setActiveTab] = useState<'inspiration' | 'hot'>('inspiration')
  const [products, setProducts] = useState<Product[]>([])
  const [outfits, setOutfits] = useState<OutfitMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    // 并行请求：products + outfits
    const [pRes, oRes] = await Promise.all([
      supabase.from('products').select('id,title,description,image_urls,price,is_published').eq('is_published', true).order('created_at', { ascending: false }).limit(20).getList<Product>(),
      supabase.from('outfit_matches').select('*').eq('is_published', true).order('published_at', { ascending: false }).limit(20).getList<OutfitMatch>(),
    ])
    if (pRes.data) setProducts(pRes.data)
    if (oRes.data) setOutfits(oRes.data)
    setLoading(false)
  }

  return (
    <ScrollView className="collocation-page" scrollY>
      {/* Hero */}
      <View className="page-hero">
        <Text className="hero-title">陈列搭配</Text>
        <Text className="hero-desc">搭配灵感 + 爆款选品</Text>
      </View>

      {/* Tab 切换 */}
      <View className="tab-bar">
        <View
          className={`tab-item ${activeTab === 'inspiration' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('inspiration')}
        >
          <Text>搭配灵感</Text>
        </View>
        <View
          className={`tab-item ${activeTab === 'hot' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('hot')}
        >
          <Text>爆款选品</Text>
        </View>
      </View>

      {/* 搭配灵感 Tab */}
      {activeTab === 'inspiration' && (
        <View className="tab-content">
          {loading ? (
            <View className="loading-wrap">
              <Text>加载中...</Text>
            </View>
          ) : outfits.length === 0 ? (
            <View className="empty-wrap">
              <Text className="empty-icon">💡</Text>
              <Text className="empty-text">暂无搭配灵感</Text>
              <Text className="empty-hint">搭配方案生成中，敬请期待</Text>
            </View>
          ) : (
            <View className="outfit-list">
              {outfits.map(outfit => (
                <View key={outfit.id} className="outfit-card" onClick={() => Taro.navigateTo({ url: `/pages/collocation/detail/index?id=${outfit.id}` })}>
                  <View className="outfit-preview">
                    <Text className="preview-emoji">👗</Text>
                    <Text className="preview-label">搭配方案预览</Text>
                  </View>
                  <View className="outfit-info">
                    <Text className="outfit-title">{outfit.title}</Text>
                    {outfit.description && <Text className="outfit-desc">{outfit.description}</Text>}
                    <View className="outfit-tags">
                      {outfit.style_tags?.map(tag => <Text key={tag} className="tag tag-style">{tag}</Text>)}
                      {outfit.season_tags?.map(tag => <Text key={tag} className="tag tag-season">{tag}</Text>)}
                      {outfit.occasion && <Text className="tag tag-occasion">{outfit.occasion}</Text>}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* 爆款选品 Tab */}
      {activeTab === 'hot' && (
        <View className="tab-content">
          {loading ? (
            <View className="loading-wrap">
              <Text>加载中...</Text>
            </View>
          ) : products.length === 0 ? (
            <View className="empty-wrap">
              <Text className="empty-icon">🛍️</Text>
              <Text className="empty-text">暂无爆款</Text>
              <Text className="empty-hint">选品数据更新中</Text>
            </View>
          ) : (
            <View className="product-list">
              {products.map(product => (
                <View key={product.id} className="product-card" onClick={() => Taro.navigateTo({ url: `/pages/hot-picks/detail/index?id=${product.id}` })}>
                  <View className="product-img-wrap">
                    {product.image_urls && product.image_urls[0] ? (
                      <Image className="product-img" src={product.image_urls[0]} mode="aspectFill" />
                    ) : (
                      <View className="product-img-placeholder">
                        <Text>📦</Text>
                      </View>
                    )}
                  </View>
                  <View className="product-info">
                    <Text className="product-title">{product.title}</Text>
                    {product.description && <Text className="product-desc">{product.description}</Text>}
                    {product.price && <Text className="product-price">¥{product.price}</Text>}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  )
}
