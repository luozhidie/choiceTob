import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { supabase } from '@/services/supabase'
import './index.scss'

/* 左侧分类数据 */
const LEFT_CATEGORIES = [
  { id: 'all', name: '全部' },
  { id: 'spring-summer', name: '春夏爆款' },
  { id: 'autumn-winter', name: '秋冬爆款' },
  { id: 'new-arrival', name: '今日上新' },
  { id: 'recommend', name: '推荐款' },
  { id: 'dress', name: '连衣裙' },
  { id: 'top', name: '上装' },
  { id: 'bottom', name: '下装' },
  { id: 'set', name: '套装' },
  { id: 'accessory', name: '配饰' },
]

/* 场合分类标签 */
const OCCASION_TAGS = [
  { id: 'all', name: '全部' },
  { id: 'work', name: '职场通勤' },
  { id: 'date', name: '约会聚会' },
  { id: 'casual', name: '休闲日常' },
  { id: 'banquet', name: '高端宴会' },
]

interface Product {
  id: string
  title: string
  cover_image: string | null
  price: number
  original_price?: number
  category: string | null
  occasion?: string | null  // 场合字段
  is_published: boolean
  sort_order: number
}

export default function CategoryPage() {
  const [activeLeftCat, setActiveLeftCat] = useState('all')
  const [activeOccasion, setActiveOccasion] = useState('all')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '分类' })
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('hot_products')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
      if (data) setProducts(data as Product[])
    } catch (err) {
      console.error('加载商品失败', err)
    } finally {
      setLoading(false)
    }
  }

  // 过滤逻辑：先按左侧分类，再按场合标签
  const filteredProducts = products.filter(p => {
    // 左侧分类过滤
    if (activeLeftCat !== 'all') {
      if (p.category !== activeLeftCat) return false
    }
    // 场合标签过滤
    if (activeOccasion !== 'all') {
      if (p.occasion !== activeOccasion) return false
    }
    return true
  })

  return (
    <View className="category-page">
      {/* 左侧分类栏 */}
      <ScrollView className="left-nav" scrollY scrollWithAnimation>
        {LEFT_CATEGORIES.map(cat => (
          <View
            key={cat.id}
            className={`nav-item ${activeLeftCat === cat.id ? 'nav-item-active' : ''}`}
            onClick={() => setActiveLeftCat(cat.id)}
          >
            <Text className={`nav-text ${activeLeftCat === cat.id ? 'nav-text-active' : ''}`}>
              {cat.name}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* 右侧内容区 */}
      <View className="right-content-wrap">
        {/* 场合分类标签栏 */}
        <ScrollView className="occasion-tags" scrollX enableFlex>
          {OCCASION_TAGS.map(tag => (
            <View
              key={tag.id}
              className={`tag-item ${activeOccasion === tag.id ? 'tag-active' : ''}`}
              onClick={() => setActiveOccasion(tag.id)}
            >
              <Text className={`tag-text ${activeOccasion === tag.id ? 'tag-text-active' : ''}`}>
                {tag.name}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* 商品网格 */}
        <ScrollView className="right-content" scrollY scrollWithAnimation>
          {loading ? (
            <View className="loading">加载中...</View>
          ) : filteredProducts.length === 0 ? (
            <View className="empty">
              <Text className="empty-text">暂无商品</Text>
            </View>
          ) : (
            <View className="product-grid-3col">
              {filteredProducts.map(product => {
                const isLoggedIn = !!Taro.getStorageSync('auth_token')
                return (
                  <View
                    key={product.id}
                    className="product-card"
                    onClick={() => {
                      if (!isLoggedIn) {
                        Taro.navigateTo({ url: '/pages/vip/login/index' })
                        return
                      }
                      Taro.navigateTo({ url: `/pages/hot-picks/detail/index?id=${product.id}` })
                    }}
                  >
                    <View className="product-img-wrap">
                      {product.cover_image ? (
                        <Image 
                          className={`product-img ${!isLoggedIn ? 'product-img-blur' : ''}`} 
                          src={product.cover_image} 
                          mode="aspectFill" 
                        />
                      ) : (
                        <View className="product-img-placeholder">
                          <Text>📦</Text>
                        </View>
                      )}
                      
                      {/* 未登录遮罩 */}
                      {!isLoggedIn && (
                        <View className="product-lock-overlay">
                          <Text className="lock-icon">🔒</Text>
                          <Text className="lock-text">登录查看</Text>
                        </View>
                      )}
                    </View>
                    <View className="product-info">
                      <Text className="product-title">{product.title}</Text>
                      {isLoggedIn && product.price && (
                        <Text className="product-price">¥{product.price}</Text>
                      )}
                      {!isLoggedIn && (
                        <Text className="product-price-locked">会员可见</Text>
                      )}
                    </View>
                  </View>
                )
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  )
}
