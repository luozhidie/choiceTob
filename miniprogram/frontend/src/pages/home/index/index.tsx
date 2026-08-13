import { View, Text, ScrollView, Swiper, SwiperItem, Image } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { supabase } from '@/services/supabase'
import './index.scss'

interface SiteImage { key: string; image_url: string | null; title?: string; link_url?: string }
interface Product { id: string; title: string; cover_image: string | null; price: number | null; original_price: number | null; is_published: boolean; category?: string | null }

/* ====== 顶部功能Tab ====== */
const FUNCTION_TABS = [
  { label: '设计', icon: '✨', path: '/pages/collocation/index/index' },
  { label: '买手', icon: '🛍️', page: '/pages/buyer/index/index' },
  { label: '企划', icon: '📋', path: '/pages/planning/index/index' },
  { label: '陈列', icon: '🎪', action: () => Taro.showToast({ title: '陈列功能开发中', icon: 'none' }) },
  { label: '营销', icon: '📢', action: () => Taro.showToast({ title: '营销功能开发中', icon: 'none' }) },
]

/* ====== 分类标签 ====== */
const CATEGORY_TAGS = ['潮品', '美妆', '护肤', '穿搭', '家居', '鞋包', '配饰', '新品']

/* ====== Banner 双按钮配置 ====== */
const BANNER_BTNS = [
  { label: '本月上新', sub: 'NEW ARRIVALS', style: 'outline', action: 'new' as const },
  { label: '爆款安利', sub: 'HOT PICKS', style: 'solid' as const, action: 'hot' as const },
]

export default function HomePage() {
  const [banners, setBanners] = useState<SiteImage[]>([])
  const [newProducts, setNewProducts] = useState<Product[]>([])
  const [hotProducts, setHotProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFuncTab, setActiveFuncTab] = useState(0)
  const [showGiftFloat, setShowGiftFloat] = useState(false)

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '骆芷蝶智选' })
    Taro.setNavigationBarColor({ frontColor: '#ffffff', backgroundColor: '#1a1a1a' })

    /* 延迟显示浮动按钮 */
    setTimeout(() => setShowGiftFloat(true), 2000)

    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [bRes, nPRes, hPRes] = await Promise.all([
        supabase.from('site_assets').select('*').ilike('key', '%home_banner%').getList<SiteImage>(),
        supabase.from('products').select('id,title,cover_image,price,original_price,is_published,category').eq('is_published', true).order('created_at', { ascending: false }).limit(10).getList<Product>(),
        supabase.from('hot_products').select('id,name as title,images,price,original_price,is_members_only,category').eq('is_published', true).limit(10).getList<any>(),
      ])
      if (bRes.data) setBanners(bRes.data.filter((b: any) => b.image_url))
      if (nPRes.data) setNewProducts(nPRes.data)
      if (hPRes.data) setHotProducts(hPRes.data.map((p: any) => ({
        id: p.id, title: p.title, cover_image: p.images?.[0] || null,
        price: p.price, original_price: p.original_price, is_published: true, category: p.category,
      })))
    } catch (err) { console.error('[home]', err) }
    finally { setLoading(false) }
  }

  /* 功能Tab点击 */
  const handleFuncTabClick = (tab: typeof FUNCTION_TABS[0], index: number) => {
    setActiveFuncTab(index)
    if (tab.page) {
      // TabBar页面用 switchTab
      Taro.switchTab({ url: tab.page })
    } else if (tab.path) {
      Taro.navigateTo({ url: tab.path })
    } else if (tab.action) {
      tab.action()
    }
  }

  /* 分类标签点击 */
  const handleCategoryTag = (tag: string) => {
    Taro.switchTab({ url: '/pages/category/index/index' })
  }

  /* Banner按钮点击 */
  const handleBannerBtn = (action: string) => {
    if (action === 'new') Taro.switchTab({ url: '/pages/buyer/index/index' })
    else if (action === 'hot') Taro.switchTab({ url: '/pages/hot-picks/index/index' })
  }

  /* 商品卡片 */
  const renderProductCard = (p: Product) => {
    const isLoggedIn = !!Taro.getStorageSync('auth_token')
    return (
      <View key={p.id} className="product-grid-item" onClick={() => {
        if (!isLoggedIn) { Taro.navigateTo({ url: '/pages/vip/login/index' }); return }
        Taro.navigateTo({ url: `/pages/hot-picks/detail/index?id=${p.id}` })
      }}>
        <View className="product-grid-img-wrap">
          {p.cover_image ? (
            <Image className={`product-grid-img ${!isLoggedIn ? 'product-img-blur' : ''}`} src={p.cover_image} mode="aspectFill" />
          ) : <View className="product-grid-img-placeholder"><Text>📦</Text></View>}
          {!isLoggedIn && (
            <View className="product-lock-overlay"><Text className="lock-icon">🔒</Text><Text className="lock-text">登录查看</Text></View>
          )}
        </View>
        <View className="product-grid-info">
          <Text className="product-grid-title">{p.title.length > 14 ? p.title.slice(0, 14) + '...' : p.title}</Text>
          <View className="product-grid-price-row">
            {isLoggedIn ? (<>
              <Text className="product-grid-price">¥{((p.price || 0) / 100).toFixed(0)}</Text>
              {p.original_price && <Text className="product-grid-original">¥{((p.original_price || 0) / 100).toFixed(0)}</Text>}
            </>) : <Text className="product-grid-price-locked">会员可见</Text>}
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className="home-page-wrap">
      <ScrollView className="home-page" scrollY scrollWithAnimation>

        {/* ================================================================
          顶部功能Tab：设计 | 买手 | 企划 | 陈列 | 营销
          ================================================================ */}
        <View className="func-tabs-bar">
          {FUNCTION_TABS.map((tab, idx) => (
            <View
              key={idx}
              className={`func-tab-item ${activeFuncTab === idx ? 'func-tab-active' : ''}`}
              onClick={() => handleFuncTabClick(tab, idx)}
            >
              <Text className={`func-tab-text ${activeFuncTab === idx ? 'func-tab-text-active' : ''}`}>{tab.label}</Text>
            </View>
          ))}
          <View className="func-tab-indicator" style={{ transform: `translateX(${activeFuncTab * 100}%)` }} />
        </View>

        {/* ================================================================
          Banner 区域 — 分类标签 + 大图轮播 + 文字叠加 + 双按钮
          ================================================================ */}
        <View className="banner-section-v2">
          {/* 分类标签栏（横向滚动） */}
          <ScrollView scrollX className="category-tags-scroll" showScrollbar={false}>
            <View className="category-tags-inner">
              {CATEGORY_TAGS.map((tag, i) => (
                <View key={i} className="category-tag-pill" onClick={() => handleCategoryTag(tag)}>
                  <Text className="category-tag-text">{tag}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* 大图轮播 */}
          <Swiper className="banner-swiper-v2" indicatorDots indicatorColor="rgba(255,255,255,0.35)" indicatorActiveColor="#fff" autoplay circular interval={4500} duration={500}>
            {banners.length > 0 ? (
              banners.map((b, i) => (
                <SwiperItem key={i}>
                  <View className="banner-slide-v2" onClick={() => b.link_url ? Taro.navigateTo({ url: b.link_url! }) : Taro.switchTab({ url: '/pages/buyer/index/index' })}>
                    <Image className="banner-bg-img" src={b.image_url!} mode="aspectFill" />
                    {/* 文字叠加层 */}
                    <View className="banner-overlay-v2">
                      <Text className="banner-brand-name">骆芷蝶智选 · 好物推荐</Text>
                      <Text className="banner-sub-slogan">不自用 不分享</Text>
                      {/* 双按钮 */}
                      <View className="banner-btn-row">
                        {BANNER_BTNS.map((btn, bi) => (
                          <View
                            key={bi}
                            className={`banner-action-btn ${btn.style === 'solid' ? 'btn-solid' : 'btn-outline'}`}
                            onClick={(e) => { e.stopPropagation(); handleBannerBtn(btn.action) }}
                          >
                            <Text className="banner-btn-label">{btn.label}</Text>
                            <Text className="banner-btn-sub">{btn.sub}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </SwiperItem>
              ))
            ) : (
              /* 默认渐变背景轮播 */
              <>
                <SwiperItem>
                  <View className="banner-slide-default banner-default-1" onClick={() => Taro.switchTab({ url: '/pages/buyer/index/index' })}>
                    <View className="banner-overlay-v2">
                      <Text className="banner-brand-name">骆芷蝶智选 · 好物推荐</Text>
                      <Text className="banner-sub-slogan">不自用 不分享</Text>
                      <View className="banner-btn-row">
                        <View className="banner-action-btn btn-outline" onClick={(e) => { e.stopPropagation(); handleBannerBtn('new') }}><Text className="banner-btn-label">本月上新</Text><Text className="banner-btn-sub">NEW ARRIVALS</Text></View>
                        <View className="banner-action-btn btn-solid" onClick={(e) => { e.stopPropagation(); handleBannerBtn('hot') }}><Text className="banner-btn-label">爆款安利</Text><Text className="banner-btn-sub">HOT PICKS</Text></View>
                      </View>
                    </View>
                  </View>
                </SwiperItem>
                <SwiperItem>
                  <View className="banner-slide-default banner-default-2" onClick={() => Taro.switchTab({ url: '/pages/hot-picks/index/index' })}>
                    <View className="banner-overlay-v2">
                      <Text className="banner-brand-name">2026春夏系列</Text>
                      <Text className="banner-sub-slogan">SPRING / SUMMER NEW IN</Text>
                      <View className="banner-btn-row">
                        <View className="banner-action-btn btn-solid" onClick={(e) => { e.stopPropagation(); handleBannerBtn('hot') }}><Text className="banner-btn-label">爆款安利</Text><Text className="banner-btn-sub">HOT PICKS</Text></View>
                        <View className="banner-action-btn btn-outline" onClick={(e) => { e.stopPropagation(); handleBannerBtn('new') }}><Text className="banner-btn-label">本月上新</Text><Text className="banner-btn-sub">NEW ARRIVALS</Text></View>
                      </View>
                    </View>
                  </View>
                </SwiperItem>
                <SwiperItem>
                  <View className="banner-slide-default banner-default-3" onClick={() => Taro.navigateTo({ url: '/pages/vip/index/index' })}>
                    <View className="banner-overlay-v2">
                      <Text className="banner-brand-name">开通VIP会员</Text>
                      <Text className="banner-sub-slogan">解锁全部权益 · 专属服务</Text>
                      <View className="banner-btn-row">
                        <View className="banner-action-btn btn-solid btn-gold" onClick={(e) => { e.stopPropagation(); Taro.navigateTo({ url: '/pages/vip/index/index' }) }}><Text className="banner-btn-label">立即开通</Text><Text className="banner-btn-sub">JOIN VIP</Text></View>
                        <View className="banner-action-btn btn-outline" onClick={(e) => { e.stopPropagation(); handleBannerBtn('new') }}><Text className="banner-btn-label">了解权益</Text><Text className="banner-btn-sub">BENEFITS</Text></View>
                      </View>
                    </View>
                  </View>
                </SwiperItem>
              </>
            )}
          </Swiper>

          {/* 右下角浮动按钮 - 收藏有礼 */}
          {showGiftFloat && (
            <View className="gift-float-btn" onClick={() => Taro.showToast({ title: '收藏有礼功能开发中', icon: 'none' })}>
              <View className="gift-icon-wrap">
                <Text className="gift-icon-text">🎁</Text>
                <Text className="gift-badge">新</Text>
              </View>
              <Text className="gift-label">收藏有礼</Text>
            </View>
          )}
        </View>

        {/* ================================================================
          会员积分条
          ================================================================ */}
        <View className="points-bar" onClick={() => Taro.navigateTo({ url: '/pages/vip/index/index' })}>
          <View className="points-left">
            <Text className="points-icon">🔊</Text>
            <Text className="points-text">会员享积分，积分当钱花</Text>
          </View>
          <Text className="points-arrow">›</Text>
        </View>

        {/* ================================================================
          新用户专享横幅
          ================================================================ */}
        <View className="promo-banner-strip" onClick={() => Taro.switchTab({ url: '/pages/buyer/index/index' })}>
          <Text className="promo-banner-text">新用户专属优惠卷</Text>
        </View>

        {/* ================================================================
          本月新品
          ================================================================ */}
        <View className="section-container">
          <View className="section-header-row">
            <Text className="section-title-cn">本月新品</Text>
            <Text className="section-more" onClick={() => Taro.switchTab({ url: '/pages/buyer/index/index' })}>更多 ›</Text>
          </View>
          <View className="product-grid-2col">{newProducts.slice(0, 6).map(p => renderProductCard(p))}</View>
        </View>

        {/* ================================================================
          爆款推荐
          ================================================================ */}
        <View className="section-container">
          <View className="section-header-row">
            <Text className="section-title-cn">爆款推荐</Text>
            <Text className="section-more" onClick={() => Taro.switchTab({ url: '/pages/hot-picks/index/index' })}>更多 ›</Text>
          </View>
          <View className="product-grid-2col">{hotProducts.slice(0, 6).map(p => renderProductCard(p))}</View>
        </View>

        {/* ================================================================
          底部品牌区
          ================================================================ */}
        <View className="brand-footer-bar" onClick={() => Taro.switchTab({ url: '/pages/buyer/index/index' })}>
          <Text className="brand-footer-main">骆芷蝶智选</Text>
          <Text className="brand-footer-sub">CHOICETOB · 专业买手选品平台</Text>
        </View>

        <View className="bottom-safe"></View>
      </ScrollView>
    </View>
  )
}
