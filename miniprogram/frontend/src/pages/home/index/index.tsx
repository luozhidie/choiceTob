import { View, Text, ScrollView, Swiper, SwiperItem, Image } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { supabase } from '@/services/supabase'
import './index.scss'

interface SiteImage { key: string; image_url: string | null; title?: string; link_url?: string }
interface Product { id: string; title: string; cover_image: string | null; price: number | null; original_price: number | null; is_published: boolean; category?: string | null }

/* ====== 弹窗广告配置 ====== */
const AD_MODAL = {
  topTag: '南油大仓库®',
  topTagHighlight: '618拿货季',
  badgeText: 'N',
  mainTitle: '仲夏拿货盛典',
  subTitle: 'STOCK-UP SEASON',
  timeLabel: 'TIME：2026年6月13日-6月30日',
  subDesc: '阶梯囤货享礼遇',
  subDetail: '*满额返现+豪赠美背*',
  ctaBtnText: '即刻选购>',
  bgGradient: 'linear-gradient(180deg, #c4d7ed 0%, #a8c8e8 30%, #8fb5de 60%, #7ba9d8 100%)',
}

/*
  第一行：双图大卡片（人物全身图 + 底部胶囊标签）
  第二行：三列小图标卡片（孤品区|热销榜|每日领券）
*/
const DUAL_IMAGE_CARDS = [
  {
    label: '春·季·上·新', subLabel: 'SPRING NEW ARRIVALS',
    bgGradient: 'linear-gradient(180deg, #f5f0e8 0%, #e8dfd0 50%, #d9ccb8 100%)',
    action: () => Taro.switchTab({ url: '/pages/buyer/index/index' }),
  },
  {
    label: '积·分·兑·换', subLabel: 'POINTS REDEMPTION',
    bgGradient: 'linear-gradient(180deg, #eef0f5 0%, #ddd8ea 50%, #cec0db 100%)',
    action: () => Taro.showToast({ title: '积分功能开发中', icon: 'none' }),
  },
]

const TRIPLE_ICON_CARDS = [
  { icon: '🏷️', title: '孤品专区', sub: '持续热卖\nEXCLUSIVE ITEMS', action: () => Taro.showToast({ title: '开发中', icon: 'none' }) },
  { icon: '💼', title: '热销榜单', sub: '三折起\nTHREE-FOLD OPENING', action: () => Taro.switchTab({ url: '/pages/hot-picks/index/index' }) },
  { icon: '%', title: '每日领券', sub: '领券更优惠\nDAILY COUPON', action: () => Taro.showToast({ title: '开发中', icon: 'none' }) },
]

const TOPIC_CARDS = [
  { name: '轻奢通勤季', desc: '高端女装批发市场', btnText: '进入专场', bgGradient: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)' },
  { name: '年末清仓专场', desc: '满300立减40叠享底价狂欢', btnText: '进入专场', bgGradient: 'linear-gradient(135deg, #fffbeb 0%, #fde68a 100%)' },
  { name: '蔻牌高端线', desc: '满减、满送叠加', btnText: '即刻选购', bgGradient: 'linear-gradient(135deg, #fdf4ff 0%, #e879f9 100%)' },
  { name: '丝毛礼服专区', desc: '晚宴年会必备', btnText: '进入专区', bgGradient: 'linear-gradient(135deg, #eff6ff 0%, #93c5fd 100%)' },
  { name: '男装上新', desc: '2026春季新款到店', btnText: '查看详情', bgGradient: 'linear-gradient(135deg, #f0fdfa 0%, #6ee7b7 100%)' },
  { name: '26春季上新', desc: '早春出游系列焕新登场', btnText: '进入专场', bgGradient: 'linear-gradient(135deg, #fff1f2 0%, #fda4af 100%)' },
]

export default function HomePage() {
  const [banners, setBanners] = useState<SiteImage[]>([])
  const [newProducts, setNewProducts] = useState<Product[]>([])
  const [hotProducts, setHotProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  /* 弹窗广告状态 */
  const [showAdModal, setShowAdModal] = useState(false)
  const [adClosing, setAdClosing] = useState(false)

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '骆芷蝶智选' })
    Taro.setNavigationBarColor({ frontColor: '#ffffff', backgroundColor: '#1a1a1a' })

    /* 检查本次会话是否已展示过弹窗 */
    const alreadyShown = Taro.getStorageSync('ad_modal_shown')
    if (!alreadyShown) {
      setTimeout(() => setShowAdModal(true), 350)
    }
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

  /* 关闭弹窗 */
  const handleCloseAd = () => {
    setAdClosing(true)
    setTimeout(() => {
      setShowAdModal(false)
      setAdClosing(false)
      Taro.setStorageSync('ad_modal_shown', '1')
    }, 280)
  }

  const handleAdCta = () => {
    handleCloseAd()
    setTimeout(() => Taro.switchTab({ url: '/pages/buyer/index/index' }), 320)
  }

  /* 商品卡片渲染 */
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

      {/* ================================================================
          🔥 全屏广告弹窗（首次进入时显示）
          ================================================================ */}
      {showAdModal && (
        <View className={`ad-modal-mask ${adClosing ? 'ad-closing' : ''}`}>
          <View className="ad-overlay" onClick={handleCloseAd}></View>
          <View className={`ad-modal-card ${adClosing ? 'ad-card-out' : ''}`}>
            <View className="ad-close-btn" onClick={handleCloseAd}>
              <Text className="ad-close-icon">✕</Text>
            </View>
            <View className="ad-content" style={{ background: AD_MODAL.bgGradient }}>
              <View className="ad-tag-row">
                <Text className="ad-brand">{AD_MODAL.topTag}</Text>
                <Text className="ad-season-tag">{AD_MODAL.topTagHighlight}</Text>
              </View>
              <View className="ad-title-area">
                {AD_MODAL.badgeText && (
                  <View className="ad-badge-pill"><Text className="ad-badge-text">{AD_MODAL.badgeText}</Text></View>
                )}
                <Text className="ad-main-title">{AD_MODAL.mainTitle}</Text>
                <Text className="ad-sub-title">{AD_MODAL.subTitle}</Text>
                <View className="ad-time-bar"><Text className="ad-time-text">{AD_MODAL.timeLabel}</Text></View>
              </View>
              <View className="ad-image-area">
                <View className="ad-product-showcase">
                  <Text className="ad-showcase-icon">🛋️</Text>
                  <Text className="ad-showcase-hint">活动商品展示</Text>
                </View>
              </View>
              <View className="ad-bottom-info">
                <Text className="ad-sub-desc">{AD_MODAL.subDesc}</Text>
                <Text className="ad-sub-detail">{AD_MODAL.subDetail}</Text>
              </View>
              <View className="ad-cta-wrapper">
                <View className="ad-cta-btn" onClick={handleAdCta}>
                  <Text className="ad-cta-text">{AD_MODAL.ctaBtnText}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ================================================================
          正常页面内容
          ================================================================ */}
      <ScrollView className="home-page" scrollY scrollWithAnimation>

        {/* ====== 顶部导航栏 ====== */}
        <View className="top-nav-bar">
          <View className="nav-search-wrap" onClick={() => Taro.showToast({ title: '搜索功能开发中', icon: 'none' })}>
            <Text className="nav-search-icon">🔍</Text>
            <Text className="nav-search-hint">搜索款式、品类...</Text>
          </View>
          <View className="nav-brand">
            <Text className="nav-brand-main">骆芷蝶智选</Text>
          </View>
          <View className="nav-right-icons">
            <View className="nav-icon-btn" onClick={() => Taro.navigateTo({ url: '/pages/vip/login/index' })}>
              <Text className="nav-icon-text">👤</Text>
            </View>
          </View>
        </View>

        {/* ====== 大图轮播（满屏） ====== */}
        <View className="banner-section">
          {banners.length > 0 ? (
            <Swiper className="mega-swiper" indicatorDots indicatorColor="rgba(255,255,255,0.35)" indicatorActiveColor="#fff" autoplay circular interval={4500} duration={500}>
              {banners.map((b, i) => (
                <SwiperItem key={i}>
                  <View className="mega-banner-item" onClick={() => b.link_url ? Taro.navigateTo({ url: b.link_url! }) : Taro.switchTab({ url: '/pages/buyer/index/index' })}>
                    <Image className="mega-banner-img" src={b.image_url!} mode="aspectFill" />
                    <View className="mega-banner-overlay">
                      <Text className="mega-banner-title">{b.title || '骆芷蝶智选'}</Text>
                      <Text className="mega-banner-desc">专业买手 · 精准选品</Text>
                    </View>
                  </View>
                </SwiperItem>
              ))}
            </Swiper>
          ) : (
            <Swiper className="mega-swiper" indicatorDots indicatorColor="rgba(255,255,255,0.35)" indicatorActiveColor="#fff" autoplay circular interval={4500} duration={550}>
              <SwiperItem>
                <View className="mega-banner-placeholder mega-bg-1" onClick={() => Taro.switchTab({ url: '/pages/buyer/index/index' })}>
                  <Text className="mega-badge">CHOICETOB</Text>
                  <Text className="mega-title">骆芷蝶智选</Text>
                  <Text className="mega-sub">专业买手选品平台</Text>
                  <Text className="mega-tagline">大数据趋势洞察 × 爆款基因锁定</Text>
                  <View className="mega-cta-btn"><Text className="mega-cta-text">立即选购 →</Text></View>
                </View>
              </SwiperItem>
              <SwiperItem>
                <View className="mega-banner-placeholder mega-bg-2" onClick={() => Taro.switchTab({ url: '/pages/buyer/index/index' })}>
                  <Text className="mega-season">2026 春夏系列</Text>
                  <Text className="mega-title">SPRING / SUMMER</Text>
                  <Text className="mega-sub">新品上架 · 限时特惠</Text>
                  <View className="mega-cta-btn"><Text className="mega-cta-text">立即选购 →</Text></View>
                </View>
              </SwiperItem>
              <SwiperItem>
                <View className="mega-banner-placeholder mega-bg-3" onClick={() => Taro.switchTab({ url: '/pages/vip/index/index' })}>
                  <Text className="mega-badge-sm">VIP MEMBER</Text>
                  <Text className="mega-title">开通会员</Text>
                  <Text className="mega-sub">解锁全部权益 · 专属服务</Text>
                  <View className="mega-cta-btn mega-cta-outline"><Text className="mega-cta-text">了解详情 →</Text></View>
                </View>
              </SwiperItem>
            </Swiper>
          )}
        </View>

        {/* ================================================================
          🎯 核心区域 — 完全按竞品设计
          ================================================================ */}

        {/* ---- 第一行：左右双大图（人物图 + 底部胶囊标签） ---- */}
        <View className="dual-hero-row">
          {DUAL_IMAGE_CARDS.map((card, idx) => (
            <View
              key={idx}
              className={`dual-hero-card ${idx === 0 ? 'hero-left' : 'hero-right'}`}
              style={{ background: card.bgGradient }}
              onClick={card.action}
            >
              {/* 人物图片占位区（大图，能展示完整人物） */}
              <View className="hero-img-area">
                <View className="hero-figure-placeholder">
                  <Text className="hero-figure-char">{card.label.charAt(0)}</Text>
                </View>
              </View>
              {/* 底部胶囊标签 */}
              <View className="hero-label-pill">
                <Text className="hero-label-main">{card.label}</Text>
                <Text className="hero-label-sub">{card.subLabel}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ---- 第二行：三列小图标卡片 ---- */}
        <View className="triple-icon-row">
          {TRIPLE_ICON_CARDS.map((card, idx) => (
            <View key={idx} className="triple-card" onClick={card.action}>
              <View className="triple-icon-wrap">
                <Text className="triple-icon">{card.icon}</Text>
              </View>
              <Text className="triple-title">{card.title}</Text>
              <Text className="triple-sub">{card.sub.replace('\n', ' ')}</Text>
            </View>
          ))}
        </View>

        {/* ================================================================
          🎯 第三行：活动专区 EVENT ZONE
          大图（人物全身）+ 文字叠加 + 底部双按钮
          ================================================================ */}
        <View className="event-zone-section">
          {/* 大图区域 — 人物展示 + 文字叠加 */}
          <View className="event-hero-area" style={{ background: 'linear-gradient(180deg, #f5f0e8 0%, #ede4d3 40%, #ddd0b8 100%)' }}>
            <View className="event-hero-visual">
              <View className="event-figure-wrap">
                <Text className="event-figure-char">👤</Text>
              </View>
            </View>

            {/* 左上角品牌文字 */}
            <View className="event-brand-tag">
              <Text className="event-brand-text">"Magazzino Massivo Nanýo"</Text>
            </View>

            {/* 右上角标签 */}
            <View className="event-top-labels">
              <Text className="event-label-en">NEW PRODUCT</Text>
              <Text className="event-label-season">SPRING/SUMMER 2026</Text>
              <Text className="event-label-collection">MAIN COLLECTION</Text>
            </View>
          </View>

          {/* 活动标题区 */}
          <View className="event-title-bar">
            <Text className="event-main-title">EVENT ZONE</Text>
            <Text className="event-sub-title">活动专区</Text>
          </View>

          {/* 双按钮行 */}
          <View className="event-dual-btn-row">
            <View className="event-btn-card event-btn-left" onClick={() => Taro.showToast({ title: '分享功能开发中', icon: 'none' })}>
              <Text className="event-btn-title">邀请好友</Text>
              <Text className="event-btn-sub">得500积分</Text>
              <Text className="event-btn-en">INVITE FRIENDS</Text>
            </View>
            <View className="event-btn-card event-btn-right" onClick={() => Taro.showToast({ title: '分享功能开发中', icon: 'none' })}>
              <Text className="event-btn-title">分享到群</Text>
              <Text className="event-btn-sub">免费送积分</Text>
              <Text className="event-btn-en">SHARE TO GROUP</Text>
            </View>
          </View>
        </View>

        {/* 品牌条幅分隔 */}
        <View className="brand-divider" onClick={() => Taro.switchTab({ url: '/pages/buyer/index/index' })}>
          <Text className="brand-name-lg">骆芷蝶智选</Text>
          <Text className="brand-slogan-sm">Magazzino Massivo Nanýo · 南油大仓库®</Text>
        </View>

        {/* 新品推荐 */}
        <View className="section-container">
          <View className="section-header">
            <Text className="section-title">NEW PRODUCT</Text>
            <Text className="section-subtitle">春季上新</Text>
          </View>
          <View className="product-grid-2col">{newProducts.slice(0, 6).map(p => renderProductCard(p))}</View>
          <View className="view-more-btn" onClick={() => Taro.switchTab({ url: '/pages/buyer/index/index' })}><Text className="view-more-text">点击查看更多 →</Text></View>
        </View>

        {/* 本周爆款 */}
        <View className="section-container">
          <View className="section-header">
            <Text className="section-title">BEST SELLERS</Text>
            <Text className="section-subtitle">本周爆款</Text>
          </View>
          <View className="product-grid-2col">{hotProducts.slice(0, 6).map(p => renderProductCard(p))}</View>
          <View className="view-more-btn" onClick={() => Taro.switchTab({ url: '/pages/hot-picks/index/index' })}><Text className="view-more-text">点击查看更多 →</Text></View>
        </View>

        {/* 专题卡片 — 左右两列网格 */}
        <View className="topic-section">
          <View className="topic-grid">
            {TOPIC_CARDS.map(t => (
              <View key={t.name} className="topic-card-grid" style={{ background: t.bgGradient }} onClick={() => Taro.switchTab({ url: '/pages/buyer/index/index' })}>
                <View className="topic-visual">
                  <Text className="topic-visual-char">{t.name.charAt(0)}</Text>
                </View>
                <View className="topic-info">
                  <Text className="topic-name">{t.name}</Text>
                  <Text className="topic-desc">{t.desc}</Text>
                  <View className="topic-btn"><Text className="topic-btn-text">{t.btnText}</Text></View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className="bottom-safe"></View>
      </ScrollView>
    </View>
  )
}
