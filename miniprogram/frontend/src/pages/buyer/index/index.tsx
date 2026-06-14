import { View, Text, ScrollView, Input, Image } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { supabase } from '@/services/supabase'
import './index.scss'

interface BuyerProduct {
  id: string
  title: string
  description: string | null
  cover_image: string | null
  price: number | null
  category: string | null
  is_published: boolean
  sort_order: number
}

/* 套餐数据（春夏/秋冬） */
const buyerPackages = [
  {
    season: '春夏',
    name: '买手爆款样衣·春夏套餐',
    price: 39000,
    count: 50,
    unitPrice: 780,
    period: '不超过12个月',
    features: [
      '买手总监亲自对接风格品类需求',
      '3天内可看版选样衣',
      '国内外加广杭两地市场流行趋势',
      '每周定期提供最新爆款选择',
      '前两季销售数据分析',
      '相当于拥有50人以上的专业买手团队淘爆款',
      '多·快·好·省',
    ],
    tag: '春夏特惠',
    color: 'green',
  },
  {
    season: '秋冬',
    name: '买手爆款样衣·秋冬套餐',
    price: 69000,
    count: 50,
    unitPrice: 1380,
    period: '不超过12个月',
    features: [
      '买手总监亲自对接风格品类需求',
      '3天内可看版选样衣',
      '国内外加广杭两地市场流行趋势',
      '每周定期提供最新爆款选择',
      '前两季销售数据分析',
      '相当于拥有50人以上的专业买手团队淘爆款',
      '多·快·好·省',
    ],
    tag: '秋冬特惠',
    color: 'orange',
  },
]

export default function BuyerPage() {
  const [activeSeason, setActiveSeason] = useState<'春夏' | '秋冬'>('春夏')
  const [products, setProducts] = useState<BuyerProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '买手选品' })
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('buyer_products')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .getList<BuyerProduct>()
    if (data) setProducts(data)
    setLoading(false)
  }

  const filteredProducts = searchTerm
    ? products.filter(p => p.title?.includes(searchTerm) || p.description?.includes(searchTerm))
    : products

  const currentPackage = buyerPackages.find(p => p.season === activeSeason)!

  return (
    <ScrollView className="buyer-page" scrollY>
      {/* Hero */}
      <View className="hero">
        <View className="hero-overlay" />
        <View className="hero-content">
          <Text className="hero-badge">专业买手团队</Text>
          <Text className="hero-title">买手选品</Text>
          <Text className="hero-desc">大数据趋势洞察 × 爆款基因锁定，源头提升选品胜率</Text>
        </View>
      </View>

      {/* 买手爆款样衣套餐 */}
      <View className="section">
        <View className="section-header">
          <Text className="section-label">Buyer Sample</Text>
          <Text className="section-title">买手爆款样衣套餐</Text>
          <Text className="section-desc">50人+专业买手团队，为您淘遍全网爆款</Text>
        </View>

        {/* 季节切换 */}
        <View className="season-tabs">
          <View
            className={`season-tab ${activeSeason === '春夏' ? 'season-tab-active-green' : ''}`}
            onClick={() => setActiveSeason('春夏')}
          >
            <Text>春夏款</Text>
          </View>
          <View
            className={`season-tab ${activeSeason === '秋冬' ? 'season-tab-active-orange' : ''}`}
            onClick={() => setActiveSeason('秋冬')}
          >
            <Text>秋冬款</Text>
          </View>
        </View>

        {/* 套餐卡片 */}
        <View className="package-card">
          <View className={`package-badge package-badge-${currentPackage.color}`}>
            <Text className="badge-text">{currentPackage.tag}</Text>
          </View>
          <View className="package-content">
            <Text className="package-name">{currentPackage.name}</Text>
            <View className="package-price-row">
              <Text className="package-price">¥{currentPackage.price.toLocaleString()}</Text>
            </View>
            <Text className="package-meta">
              {currentPackage.count}款 · 平均¥{currentPackage.unitPrice}/款 · {currentPackage.period}
            </Text>
            <View className="package-features">
              {currentPackage.features.map((f, i) => (
                <View key={i} className="feature-item">
                  <Text className="feature-check">✅</Text>
                  <Text className="feature-text">{f}</Text>
                </View>
              ))}
            </View>
            <View className="package-btn" onClick={() => Taro.navigateTo({ url: '/pages/vip/index' })}>
              <Text className="btn-text">立即开通</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 搜索区 */}
      <View className="section">
        <View className="search-bar">
          <Input
            className="search-input"
            placeholder="搜索买手爆款..."
            value={searchTerm}
            onInput={(e) => setSearchTerm(e.detail.value)}
          />
        </View>

        {/* 商品列表 */}
        {loading ? (
          <View className="loading">加载中...</View>
        ) : filteredProducts.length === 0 ? (
          <View className="empty">
            <Text className="empty-text">暂无买手爆款数据</Text>
            <Text className="empty-hint">数据更新中，敬请期待</Text>
          </View>
        ) : (
          <View className="product-grid">
            {filteredProducts.map(product => (
              <View key={product.id} className="product-card" onClick={() => Taro.navigateTo({ url: `/pages/hot-picks/detail/index?id=${product.id}` })}>
                <View className="product-img-wrap">
                  {product.cover_image ? (
                    <Image className="product-img" src={product.cover_image} mode="aspectFill" />
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

      {/* 供应商入驻 CTA */}
      <View className="cta-section">
        <Text className="cta-title">成为供应商</Text>
        <Text className="cta-desc">入驻平台，让您的爆款被更多人发现</Text>
        <View className="cta-btn" onClick={() => Taro.navigateTo({ url: '/pages/contact/index' })}>
          <Text className="cta-btn-text">立即入驻</Text>
        </View>
      </View>
    </ScrollView>
  )
}
