import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { getHotPickDetail, getProfile } from '@/services/api'
import './index.scss'

/* ============ 商品接口 ============ */
interface HotProduct {
  id: string
  name: string
  description?: string
  details?: string
  price: number
  original_price?: number
  tags?: string[]
  images?: string[]
  category?: string
  season?: string
  is_members_only?: boolean
  fabric?: string
  collocation?: string
}

/* ============ 推荐搭配示例数据 ============ */
const recommendCollocations = [
  { name: '优雅通勤风', desc: '衬衫+高腰西裤+小香风外套' },
  { name: '休闲周末风', desc: '卫衣+牛仔半裙+运动鞋' },
  { name: '浪漫约会风', desc: '碎花连衣裙+针织开衫+单鞋' },
]

export default function HotPicksDetailPage() {
  const [product, setProduct] = useState<HotProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    const id = params?.id
    if (id) {
      loadDetail(id)
    }
    checkMember()
  }, [])

  const checkMember = async () => {
    try {
      const token = Taro.getStorageSync('auth_token')
      if (!token) return
      const res = await getProfile()
      if (res?.isHotPicksMember) setIsMember(true)
    } catch (_e) {
      // 未登录
    }
  }

  const loadDetail = async (id: string) => {
    try {
      const data = await getHotPickDetail(id)
      setProduct(data)
    } catch (_e) {
      // 接口异常时使用示例数据
      setProduct({
        id,
        name: '春夏新款法式浪漫连衣裙',
        description: '采用高质感的雪纺面料，A字版型，腰线收束显瘦，搭配精致碎花印花，清新优雅，适合通勤、约会等多场景穿着。',
        details: '面料：100%聚酯纤维（雪纺）\n版型：A字中长款\n颜色：米白碎花 / 藏蓝碎花\n尺码：S/M/L/XL\n洗涤方式：建议手洗或干洗\n产地：中国\n\n温馨提示：\n1. 实物颜色可能因显示器不同略有差异\n2. 建议按日常码数选择，偏胖可选大一码\n3. 模特身高165cm，穿S码',
        price: 29900,
        original_price: 39900,
        category: '连衣裙',
        season: '春夏',
        is_members_only: true,
        tags: ['爆款', '新款'],
        images: [],
        fabric: '100%聚酯纤维（雪纺），轻薄透气，手感丝滑',
        collocation: '可搭配针织开衫、小香风外套、高跟鞋、凉鞋等',
      })
    } finally {
      setLoading(false)
    }
  }

  const goToContact = () => {
    Taro.navigateTo({ url: '/pages/contact/index' })
  }

  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString()
  }

  if (loading) {
    return (
      <View className="detail-page">
        <View className="loading-wrap">
          <Text className="loading-text">加载中...</Text>
        </View>
      </View>
    )
  }

  if (!product) {
    return (
      <View className="detail-page">
        <View className="empty-wrap">
          <Text className="empty-icon">😕</Text>
          <Text className="empty-text">商品不存在或已下架</Text>
        </View>
      </View>
    )
  }

  const locked = !isMember && product.is_members_only
  const images = product.images && product.images.length > 0 ? product.images : []
  const tags = product.tags || []
  const hasDiscount = product.original_price && product.original_price > product.price

  return (
    <View className="detail-page">
      <ScrollView scrollY className="detail-scroll">
        {/* ====== 商品大图 ====== */}
        <View className="detail-image-section">
          {images.length > 0 ? (
            <View className="detail-image-swiper">
              <Image
                className={`detail-main-image ${locked ? 'detail-image-blur' : ''}`}
                src={images[currentImageIndex]}
                mode="aspectFill"
              />
              {/* 图片指示器 */}
              {images.length > 1 && (
                <View className="image-indicator">
                  <Text className="image-indicator-text">{currentImageIndex + 1}/{images.length}</Text>
                </View>
              )}
              {/* 缩略图 */}
              <View className="image-thumbs">
                {images.map((img, idx) => (
                  <View
                    key={idx}
                    className={`image-thumb ${idx === currentImageIndex ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(idx)}
                  >
                    <Image className="image-thumb-img" src={img} mode="aspectFill" />
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View className="detail-image-placeholder">
              <Text className="detail-image-placeholder-icon">🛍️</Text>
            </View>
          )}

          {/* 非会员遮罩 */}
          {locked && (
            <View className="detail-lock-overlay">
              <Text className="detail-lock-icon">🔒</Text>
              <Text className="detail-lock-text">会员专属内容</Text>
              <View className="detail-lock-btn" onClick={goToContact}>
                <Text className="detail-lock-btn-text">联系客服开通</Text>
              </View>
            </View>
          )}
        </View>

        {/* ====== 商品信息 ====== */}
        <View className="detail-info-section">
          {/* 标签 + 季节 */}
          <View className="detail-tags-row">
            {tags.map((tag, idx) => (
              <View key={idx} className="detail-tag">
                <Text className="detail-tag-text">{tag}</Text>
              </View>
            ))}
            {product.season && (
              <View className="detail-tag detail-tag-accent">
                <Text className="detail-tag-text">{product.season}</Text>
              </View>
            )}
          </View>

          {/* 商品名称 */}
          <Text className="detail-name">{product.name}</Text>

          {/* 商品描述 */}
          {product.description && (
            <Text className="detail-desc">{product.description}</Text>
          )}

          {/* 价格 */}
          {!locked ? (
            <View className="detail-price-row">
              <Text className="detail-price">¥{formatPrice(product.price)}</Text>
              {hasDiscount && (
                <Text className="detail-original-price">¥{formatPrice(product.original_price!)}</Text>
              )}
              {hasDiscount && (
                <View className="detail-discount-tag">
                  <Text className="detail-discount-text">优惠</Text>
                </View>
              )}
            </View>
          ) : (
            <View className="detail-price-locked">
              <Text className="detail-price-lock-icon">🔒</Text>
              <Text className="detail-price-lock-text">开通会员后查看价格与商品详情</Text>
            </View>
          )}
        </View>

        {/* ====== 面料说明 ====== */}
        {(!locked || !product.is_members_only) && product.fabric && (
          <View className="detail-section-card">
            <View className="detail-section-header">
              <Text className="detail-section-icon">🧵</Text>
              <Text className="detail-section-title">面料说明</Text>
            </View>
            <Text className="detail-section-content">{product.fabric}</Text>
          </View>
        )}

        {/* ====== 商品详情 ====== */}
        {(!locked || !product.is_members_only) && product.details && (
          <View className="detail-section-card">
            <View className="detail-section-header">
              <Text className="detail-section-icon">📋</Text>
              <Text className="detail-section-title">商品详情</Text>
            </View>
            <Text className="detail-section-content detail-details-text">{product.details}</Text>
          </View>
        )}

        {/* ====== 推荐搭配 ====== */}
        <View className="detail-section-card">
          <View className="detail-section-header">
            <Text className="detail-section-icon">👗</Text>
            <Text className="detail-section-title">推荐搭配</Text>
          </View>

          {/* 如果商品有搭配说明 */}
          {product.collocation && (
            <Text className="detail-section-content">{product.collocation}</Text>
          )}

          {/* 推荐搭配列表 */}
          <View className="recommend-list">
            {recommendCollocations.map((item, idx) => (
              <View key={idx} className="recommend-item">
                <View className="recommend-img-placeholder">
                  <Text className="recommend-img-icon">👘</Text>
                </View>
                <View className="recommend-info">
                  <Text className="recommend-name">{item.name}</Text>
                  <Text className="recommend-desc">{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ====== 底部占位 ====== */}
        <View className="detail-bottom-spacer" />
      </ScrollView>

      {/* ====== 底部操作栏 ====== */}
      <View className="detail-bottom-bar">
        <View className="bottom-action-home" onClick={() => Taro.switchTab({ url: '/pages/home/index' })}>
          <Text className="bottom-action-icon">🏠</Text>
          <Text className="bottom-action-label">首页</Text>
        </View>
        <View className="bottom-action-contact" onClick={() => Taro.navigateTo({ url: '/pages/contact/index' })}>
          <Text className="bottom-action-icon">💬</Text>
          <Text className="bottom-action-label">客服</Text>
        </View>
        <View className="bottom-consult-btn" onClick={goToContact}>
          <Text className="bottom-consult-text">立即咨询</Text>
        </View>
      </View>
    </View>
  )
}
