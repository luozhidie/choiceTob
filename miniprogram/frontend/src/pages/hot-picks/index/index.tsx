import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState, useEffect, useCallback } from 'react'
import Taro from '@tarojs/taro'
import { getHotPicks, getProfile } from '@/services/api'
import './index.scss'

/* ============ Tab 定义 ============ */
type TabKey = 'hot' | 'buyer' | 'rental' | 'designer' | 'collocation' | 'cooperation'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'hot', label: '爆款样衣' },
  { key: 'buyer', label: '买手爆款' },
  { key: 'rental', label: '样衣租赁' },
  { key: 'designer', label: '设计稿' },
  { key: 'collocation', label: '搭配稿' },
  { key: 'cooperation', label: '合作模式' },
]

/* ============ 买手爆款样衣套餐 ============ */
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
  },
]

/* ============ 样衣租赁套餐 ============ */
const rentalPackages = [
  { name: '体验套餐', price: 54800, count: 220, period: '12个月', highlight: false, icon: '⭐' },
  { name: '黄金套餐', price: 88000, count: 400, period: '24个月', highlight: false, icon: '💎' },
  { name: '钻石套餐', price: 168000, count: 840, period: '36个月', highlight: true, icon: '👑' },
  { name: '至尊套餐', price: 388000, count: 2580, period: '48个月', highlight: false, icon: '🏆' },
]

/* ============ 设计稿服务 - 品类价格表 ============ */
const categoryPrices = [
  { category: 'T恤/卫衣/毛衣', basePrice: 550, withPattern: 650, withSample: 750 },
  { category: '衬衫/针织衫', basePrice: 550, withPattern: 650, withSample: 800 },
  { category: '连衣裙/半裙/裤装', basePrice: 550, withPattern: 700, withSample: 850 },
  { category: '外套/风衣/大衣', basePrice: 650, withPattern: 800, withSample: 1000 },
  { category: '羽绒服/棉服', basePrice: 880, withPattern: 680, withSample: 800 },
  { category: '礼服/高定', basePrice: 880, withPattern: 1500, withSample: 2000 },
]

/* ============ 设计稿服务 - L1-L5 套餐 ============ */
const serviceTiers = [
  { level: 'L1', name: '原创设计图稿', desc: '纯设计图，适合有板房/工厂配合打板的客户', price: '¥550-880/件', features: ['原创设计图稿（含款式图+工艺说明+面料建议）', '1轮修改', '源文件交付'], highlight: false },
  { level: 'L2', name: '设计图稿 + 纸样', desc: '适合有板房或工厂的客户', price: '¥650-1500/件', features: ['L1全部内容', '工业纸样（含放码）', '纸样审核'], highlight: false },
  { level: 'L3', name: '设计图稿 + 纸样 + 成品样衣', desc: '适合没有供应链配合的客户', price: '¥750-2000/件', features: ['L2全部内容', '白胚样衣制作', '成品样衣制作', '样衣瑕疵修复'], highlight: true },
  { level: 'L4', name: '原创样衣设计 + FOB生产供货', desc: '适合没有供应链的电商/外省客户', price: '面议', features: ['L3全部内容', 'FOB生产供货', '大货跟单', '质检服务'], highlight: false },
  { level: 'L5', name: '产品顾问（外聘设计总监）', desc: '适合自有设计团队但能力弱的客户', price: '面议', features: ['L4全部内容', '外聘设计总监1v1服务', '季度商品企划', '设计团队培训'], highlight: false },
]

/* ============ 搭配稿服务 - 春夏价格 ============ */
const springSummerCollocation = [
  { name: '搭配稿尊享包', desc: '100套搭配', price: 30000, count: 100, unitPrice: 300, period: '不超过12个月' },
  { name: '搭配稿尊享特惠包', desc: '100套搭配+20款爆款样衣', price: 74600, count: 120, unitPrice: 622, period: '不超过12个月' },
  { name: '搭配稿至尊包', desc: '200个设计稿', price: 100000, count: 200, unitPrice: 500, period: '不超过24个月' },
  { name: '纸样体验包', desc: '68个设计稿+8款纸样', price: 66600, count: 68, unitPrice: 980, period: '不超过6个月' },
  { name: '纸样VIP包', desc: '100个设计稿+100款纸样', price: 93000, count: 100, unitPrice: 930, period: '不超过12个月' },
  { name: '胚样体验包', desc: '68款胚样', price: 93800, count: 68, unitPrice: 1380, period: '不超过6个月' },
  { name: '胚样钻石包', desc: '100个设计稿+100款纸样+100款胚样', price: 128000, count: 100, unitPrice: 1280, period: '不超过12个月' },
]

const springSummerSample = [
  { name: '样衣体验包', desc: '30款样衣', price: 78000, count: 30, unitPrice: 2600, period: '不超过3个月' },
  { name: '样衣黄金包', desc: '68款样衣', price: 170000, count: 68, unitPrice: 2500, period: '不超过6个月' },
  { name: '样衣钻石包', desc: '100款样衣', price: 238000, count: 100, unitPrice: 2380, period: '不超过12个月' },
]

/* ============ 搭配稿服务 - 秋冬价格 ============ */
const autumnWinterCollocation = [
  { name: '搭配稿尊享包', desc: '100套搭配', price: 35000, count: 100, unitPrice: 350, period: '不超过12个月' },
  { name: '搭配稿尊享特惠包', desc: '100套搭配+20款爆款样衣', price: 85000, count: 120, unitPrice: 708, period: '不超过12个月' },
  { name: '搭配稿至尊包', desc: '200个设计稿', price: 120000, count: 200, unitPrice: 600, period: '不超过24个月' },
  { name: '纸样体验包', desc: '68个设计稿+8款纸样', price: 75000, count: 68, unitPrice: 1103, period: '不超过6个月' },
  { name: '纸样VIP包', desc: '100个设计稿+100款纸样', price: 110000, count: 100, unitPrice: 1100, period: '不超过12个月' },
  { name: '胚样体验包', desc: '68款胚样', price: 105000, count: 68, unitPrice: 1544, period: '不超过6个月' },
  { name: '胚样钻石包', desc: '100个设计稿+100款纸样+100款胚样', price: 145000, count: 100, unitPrice: 1450, period: '不超过12个月' },
]

const autumnWinterSample = [
  { name: '样衣体验包', desc: '30款样衣', price: 88000, count: 30, unitPrice: 2933, period: '不超过3个月' },
  { name: '样衣黄金包', desc: '68款样衣', price: 195000, count: 68, unitPrice: 2868, period: '不超过6个月' },
  { name: '样衣钻石包', desc: '100款样衣', price: 275000, count: 100, unitPrice: 2750, period: '不超过12个月' },
]

/* ============ 合作模式 - L1-L5 ============ */
const cooperationModes = [
  { level: 'L1', name: '原创设计图稿', price: '¥550-880/件', desc: '纯设计图，适合有板房/工厂配合打板的客户', features: ['原创设计图稿（含款式图+工艺说明+面料建议）', '1轮修改', '源文件交付'], suitable: '有自设板房或有工厂配合打板、车板的客户，比较节省成本', badgeColor: '#2d1b2e' },
  { level: 'L2', name: '设计图稿 + 纸样', price: '¥650-1500/件', desc: '适合有板房或工厂的客户', features: ['L1全部内容', '工业纸样（含放码）', '纸样审核'], suitable: '适合只有车板师的或有工厂配合车板车板的客户，比较节省成本', badgeColor: '#16a34a' },
  { level: 'L3', name: '设计图稿 + 纸样 + 成品样衣', price: '¥750-2000/件', desc: '适合没有供应链配合的客户', features: ['L2全部内容', '白胚样衣制作', '成品样衣制作', '样衣瑕疵修复'], suitable: '适合没有供应链协助打板车板的客户，直接看到样衣比较直观', badgeColor: '#ea580c' },
  { level: 'L4', name: '原创样衣设计 + FOB生产供货', price: '面议', desc: '适合没有供应链的电商/外省客户', features: ['L3全部内容', 'FOB生产供货', '大货跟单', '质检服务'], suitable: '适合没有供应链协助的、如电商、外省供应链缺乏的客户', badgeColor: '#9333ea' },
  { level: 'L5', name: '产品顾问（外聘设计总监）', price: '面议', desc: '适合自有设计团队但能力弱的客户', features: ['L4全部内容', '外聘设计总监1v1服务', '季度商品企划', '设计团队培训'], suitable: '适合自有设计团队，但研发能力比较弱的客户', badgeColor: '#dc2626' },
]

/* ============ 合作流程 ============ */
const flowSteps = [
  { title: '客户需求', desc: '明确风格定位、品类需求、预算范围' },
  { title: '清晰沟通', desc: '一对一沟通，确认设计方向' },
  { title: '签约合作', desc: '签订合同，明确交付标准' },
  { title: '确认无忧', desc: '支付定金，正式启动项目' },
  { title: '研发方案', desc: '设计师团队制定方案' },
  { title: '定向设计', desc: '根据方案进行原创设计' },
  { title: '满意交付', desc: '客户确认，交付成果' },
  { title: '客户选款', desc: '挑选满意款式' },
]

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
}

/* ============ 格式化价格 ============ */
function formatPrice(price: number): string {
  return (price / 100).toLocaleString()
}

function formatPriceWhole(price: number): string {
  return price.toLocaleString()
}

/* ============ 主页面 ============ */
export default function HotPicksPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('hot')
  const [designerSubTab, setDesignerSubTab] = useState<'pricing' | 'tiers'>('pricing')
  const [collocationSeason, setCollocationSeason] = useState<'ss' | 'aw'>('ss')

  // 会员 & 商品数据
  const [isMember, setIsMember] = useState(false)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<HotProduct[]>([])
  const [selectedCategory, setSelectedCategory] = useState('全部')

  // 检查登录状态和会员状态
  const checkMember = useCallback(async () => {
    try {
      const token = Taro.getStorageSync('auth_token')
      if (!token) {
        setIsMember(false)
        return
      }
      const res = await getProfile()
      if (res?.isHotPicksMember) setIsMember(true)
    } catch (_e) {
      // 未登录或接口错误，默认非会员
    }
  }, [])

  // 跳转联系客服
  const goToContact = () => {
    Taro.showToast({ title: '客服功能开发中', icon: 'none' })
    // 实际应该跳转到客服页面或拨打客服电话
    // Taro.makePhoneCall({ phoneNumber: '400-xxx-xxxx' })
  }

  // 加载爆款样衣列表
  const loadProducts = useCallback(async () => {
    try {
      const data = await getHotPicks()
      if (data?.list) setProducts(data.list)
      else if (Array.isArray(data)) setProducts(data)
    } catch (_e) {
      // 接口异常时使用示例数据
      setProducts([
        { id: '1', name: '春夏新款连衣裙', price: 29900, original_price: 39900, category: '连衣裙', season: '春夏', is_members_only: true, tags: ['爆款', '新款'], images: [] },
        { id: '2', name: '法式浪漫碎花裙', price: 25900, category: '连衣裙', season: '春夏', is_members_only: true, tags: ['热销'], images: [] },
        { id: '3', name: '高腰修身西装裤', price: 19900, category: '裤装', season: '春夏', is_members_only: true, tags: ['百搭'], images: [] },
        { id: '4', name: '简约通勤衬衫', price: 15900, category: '上衣', season: '春夏', is_members_only: false, tags: ['新款'], images: [] },
        { id: '5', name: '轻奢羊毛大衣', price: 59900, original_price: 79900, category: '外套', season: '秋冬', is_members_only: true, tags: ['秋冬', '品质'], images: [] },
        { id: '6', name: '休闲卫衣套装', price: 22900, category: '上衣', season: '秋冬', is_members_only: false, tags: ['休闲'], images: [] },
      ])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkMember()
    loadProducts()
  }, [checkMember, loadProducts])

  // 分类列表
  const categories = ['全部', ...Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[]]
  const filteredProducts = selectedCategory === '全部'
    ? products
    : products.filter(p => p.category === selectedCategory)

  // 搭配稿季节数据
  const collocationData = collocationSeason === 'ss' ? springSummerCollocation : autumnWinterCollocation
  const sampleData = collocationSeason === 'ss' ? springSummerSample : autumnWinterSample

  // 跳转详情
  const goToDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/hot-picks/detail/index?id=${id}` })
  }

  return (
    <View className="hot-picks-page">
      {/* ====== Hero ====== */}
      <View className="hero">
        <View className="hero-overlay" />
        <View className="hero-content">
          <View className="hero-badge">
            <Text className="hero-badge-text">专业爆款样衣</Text>
          </View>
          <Text className="hero-title">爆款样衣</Text>
          <Text className="hero-subtitle">大数据选款 + 专业买手团队，为您提供市场最新爆款样衣</Text>
        </View>
      </View>

      {/* ====== Tab 切换 ====== */}
      <ScrollView className="tabs-bar" scrollX enableFlex>
        {tabs.map(tab => (
          <View
            key={tab.key}
            className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text className="tab-text">{tab.label}</Text>
            {activeTab === tab.key && <View className="tab-indicator" />}
          </View>
        ))}
      </ScrollView>

      {/* ====== 爆款样衣 Tab ====== */}
      {activeTab === 'hot' && (
        <View>
          {/* 未开通会员提示 */}
          {!isMember && (
            <View className="member-banner">
              <View className="banner-icon-wrap">
                <Text className="banner-icon">👑</Text>
              </View>
              <View className="banner-content">
                <Text className="banner-title">开通爆款样衣会员</Text>
                <Text className="banner-desc">¥998/月，查看高清图片、价格与商品详情</Text>
              </View>
              <View className="banner-btn" onClick={() => Taro.navigateTo({ url: '/pages/vip/index' })}>
                <Text className="banner-btn-text">立即开通</Text>
              </View>
            </View>
          )}

          {/* 爆款样衣列表 */}
          <View className="section">
            <View className="section-header-center">
              <Text className="section-label">HOT PRODUCTS</Text>
              <Text className="section-title-center">爆款样衣展示</Text>
              <Text className="section-desc-center">精选市场最新爆款样衣，会员可查看完整详情与价格</Text>
            </View>

            {/* 分类筛选 */}
            {categories.length > 1 && (
              <ScrollView className="filter-bar" scrollX enableFlex>
                {categories.map(cat => (
                  <View
                    key={cat}
                    className={`filter-item ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    <Text className="filter-text">{cat}</Text>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* 商品列表 */}
            {loading ? (
              <View className="loading-wrap">
                <Text className="loading-text">加载中...</Text>
              </View>
            ) : filteredProducts.length === 0 ? (
              <View className="empty-wrap">
                <Text className="empty-icon">🛍️</Text>
                <Text className="empty-text">暂无爆款样衣，敬请期待</Text>
              </View>
            ) : (
              <View className="product-grid">
                {filteredProducts.map(product => {
                  const isLoggedIn = !!Taro.getStorageSync('auth_token')
                  const locked = !isLoggedIn || (!isMember && product.is_members_only)
                  return (
                    <View
                      key={product.id}
                      className="product-card"
                      onClick={() => {
                        if (!isLoggedIn) {
                          Taro.navigateTo({ url: '/pages/vip/login/index' })
                          return
                        }
                        goToDetail(product.id)
                      }}
                    >
                      {/* 图片区域 */}
                      <View className="product-img-wrap">
                        {product.images && product.images.length > 0 ? (
                          <Image
                            className={`product-img ${locked ? 'product-img-blur' : ''}`}
                            src={product.images[0]}
                            mode="aspectFill"
                          />
                        ) : (
                          <View className="product-img-placeholder">
                            <Text className="placeholder-icon">🛍️</Text>
                          </View>
                        )}

                        {/* 未登录/非会员遮罩 */}
                        {locked && (
                          <View className="product-lock-overlay">
                            <Text className="lock-icon">🔒</Text>
                            {!Taro.getStorageSync('auth_token') ? (
                              <>
                                <Text className="lock-text">登录查看</Text>
                                <Text className="lock-sub">点击登录查看详情</Text>
                              </>
                            ) : (
                              <>
                                <Text className="lock-text">会员专属</Text>
                                <Text className="lock-sub">开通会员查看详情</Text>
                              </>
                            )}
                          </View>
                        )}

                        {/* 标签 */}
                        {product.tags && product.tags.length > 0 && (
                          <View className="product-tags">
                            {product.tags.slice(0, 2).map((tag, idx) => (
                              <View key={idx} className="product-tag">
                                <Text className="product-tag-text">{tag}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* 季节标签 */}
                        {product.season && (
                          <View className="product-season">
                            <Text className="product-season-text">{product.season}</Text>
                          </View>
                        )}
                      </View>

                      {/* 信息区域 */}
                      <View className="product-info">
                        <Text className="product-name">{product.name}</Text>
                        {product.description && (
                          <Text className="product-desc">{product.description}</Text>
                        )}

                        {/* 价格 */}
                        {!locked ? (
                          <View className="product-price-row">
                            <Text className="product-price">¥{formatPrice(product.price)}</Text>
                            {product.original_price && product.original_price > product.price && (
                              <Text className="product-original-price">¥{formatPrice(product.original_price)}</Text>
                            )}
                          </View>
                        ) : (
                          <View className="product-price-locked">
                            <Text className="price-lock-icon">🔒</Text>
                            <Text className="price-lock-text">会员可见价格</Text>
                          </View>
                        )}

                        {/* 咨询按钮 */}
                        <View className="product-consult-btn" onClick={(e) => { e.stopPropagation(); goToContact() }}>
                          <Text className="product-consult-text">立即咨询</Text>
                        </View>
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </View>
        </View>
      )}

      {/* ====== 买手爆款样衣 Tab ====== */}
      {activeTab === 'buyer' && (
        <View className="section">
          <View className="section-header-center">
            <Text className="section-label">BUYER SAMPLE</Text>
            <Text className="section-title-center">买手爆款样衣套餐</Text>
            <Text className="section-desc-center">50人+专业买手团队，为您淘遍全网爆款</Text>
          </View>

          {buyerPackages.map((pkg, idx) => (
            <View key={idx} className={`buyer-card ${pkg.season === '春夏' ? 'buyer-card-spring' : 'buyer-card-autumn'}`}>
              <View className={`buyer-tag ${pkg.season === '春夏' ? 'buyer-tag-spring' : 'buyer-tag-autumn'}`}>
                <Text className="buyer-tag-text">{pkg.tag}</Text>
              </View>
              <Text className="buyer-name">{pkg.name}</Text>
              <Text className="buyer-price">¥{formatPriceWhole(pkg.price)}</Text>
              <Text className="buyer-meta">{pkg.count}款 · 平均¥{pkg.unitPrice}/款 · {pkg.period}</Text>
              <View className="buyer-features">
                {pkg.features.map((f, i) => (
                  <View key={i} className="buyer-feature-item">
                    <Text className="buyer-feature-check">✓</Text>
                    <Text className="buyer-feature-text">{f}</Text>
                  </View>
                ))}
              </View>
              <View className="buyer-consult-btn" onClick={goToContact}>
                <Text className="buyer-consult-text">立即咨询</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ====== 样衣租赁 Tab ====== */}
      {activeTab === 'rental' && (
        <View className="section">
          <View className="section-header-center">
            <Text className="section-label">SAMPLE RENTAL</Text>
            <Text className="section-title-center">样衣租赁套餐</Text>
            <Text className="section-desc-center">海量爆款样衣库，随时挑选最新款</Text>
          </View>

          {rentalPackages.map((pkg, idx) => (
            <View key={idx} className={`rental-card ${pkg.highlight ? 'rental-card-highlight' : ''}`}>
              {pkg.highlight && (
                <View className="rental-recommend">
                  <Text className="rental-recommend-text">推荐</Text>
                </View>
              )}
              <Text className="rental-icon">{pkg.icon}</Text>
              <Text className="rental-name">{pkg.name}</Text>
              <Text className={`rental-price ${pkg.highlight ? 'rental-price-accent' : ''}`}>¥{formatPriceWhole(pkg.price)}</Text>
              <Text className="rental-meta">{pkg.count}款 · 有效期{pkg.period}</Text>
              <View className={`rental-consult-btn ${pkg.highlight ? 'rental-consult-accent' : 'rental-consult-default'}`} onClick={goToContact}>
                <Text className="rental-consult-text">立即咨询</Text>
              </View>
            </View>
          ))}

          {/* 样衣来源 */}
          <View className="info-card">
            <Text className="info-card-title">ℹ️ 样衣来源</Text>
            <View className="info-card-list">
              <View className="info-card-item">
                <Text className="info-card-item-title">1. 设计款样衣</Text>
                <Text className="info-card-item-desc">根据时尚资讯、最新资源、自主研发的新品样衣</Text>
              </View>
              <View className="info-card-item">
                <Text className="info-card-item-title">2. 数据样衣</Text>
                <Text className="info-card-item-desc">智能科技大数据分析 + 人为筛选的全网爆款、潜在爆款</Text>
              </View>
              <View className="info-card-item">
                <Text className="info-card-item-title">3. 线下批发市场爆款样衣</Text>
                <Text className="info-card-item-desc">通过国内外知名买手全球采购实时收集批发市场爆款</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ====== 设计稿服务 Tab ====== */}
      {activeTab === 'designer' && (
        <View>
          {/* 设计稿 Hero */}
          <View className="sub-hero">
            <View className="sub-hero-overlay" />
            <View className="sub-hero-content">
              <View className="sub-hero-badge">
                <Text className="sub-hero-badge-text">原创设计师平台</Text>
              </View>
              <Text className="sub-hero-title">专业设计团队</Text>
              <Text className="sub-hero-title">按需定制</Text>
              <Text className="sub-hero-desc">从设计图稿到成品样衣，从单款设计到季度企划，一站式服务</Text>
            </View>
          </View>

          {/* 设计稿子 Tab */}
          <View className="sub-tabs">
            <View
              className={`sub-tab-item ${designerSubTab === 'pricing' ? 'active' : ''}`}
              onClick={() => setDesignerSubTab('pricing')}
            >
              <Text className="sub-tab-text">按品类定价</Text>
            </View>
            <View
              className={`sub-tab-item ${designerSubTab === 'tiers' ? 'active' : ''}`}
              onClick={() => setDesignerSubTab('tiers')}
            >
              <Text className="sub-tab-text">套餐服务 L1-L5</Text>
            </View>
          </View>

          {/* 按品类定价 */}
          {designerSubTab === 'pricing' && (
            <View className="section">
              <View className="section-header-center">
                <Text className="section-label">CATEGORY PRICING</Text>
                <Text className="section-title-center">按品类定价</Text>
                <Text className="section-desc-center">根据服装品类复杂度定价，支持灵活选择</Text>
              </View>

              {categoryPrices.map((item, idx) => (
                <View key={idx} className="category-price-card">
                  <View className="category-price-header">
                    <Text className="category-name">{item.category}</Text>
                    <View className="category-base-price">
                      <Text className="category-base-price-value">¥{item.basePrice}</Text>
                      <Text className="category-base-price-unit">起/件</Text>
                    </View>
                  </View>
                  <View className="category-price-row">
                    <View className="category-price-item category-price-design">
                      <Text className="category-price-label">仅设计稿</Text>
                      <Text className="category-price-val">¥{item.basePrice}</Text>
                    </View>
                    <View className="category-price-item category-price-pattern">
                      <Text className="category-price-label-blue">+纸样</Text>
                      <Text className="category-price-val-blue">¥{item.withPattern}</Text>
                    </View>
                    <View className="category-price-item category-price-sample">
                      <Text className="category-price-label-accent">+样衣</Text>
                      <Text className="category-price-val-accent">¥{item.withSample}</Text>
                    </View>
                  </View>
                </View>
              ))}

              <Text className="price-note">ℹ️ 价格仅供参考，具体以设计师报价为准</Text>
            </View>
          )}

          {/* 套餐服务 L1-L5 */}
          {designerSubTab === 'tiers' && (
            <View className="section">
              <View className="section-header-center">
                <Text className="section-label">SERVICE TIERS</Text>
                <Text className="section-title-center">套餐服务 L1-L5</Text>
                <Text className="section-desc-center">从纯设计稿到产品顾问，覆盖不同客户需求</Text>
              </View>

              {serviceTiers.map(tier => (
                <View key={tier.level} className={`tier-card ${tier.highlight ? 'tier-card-highlight' : ''}`}>
                  {tier.highlight && (
                    <View className="tier-recommend">
                      <Text className="tier-recommend-text">推荐</Text>
                    </View>
                  )}
                  <Text className={`tier-level ${tier.highlight ? 'tier-level-accent' : ''}`}>{tier.level}</Text>
                  <Text className="tier-name">{tier.name}</Text>
                  <Text className="tier-desc">{tier.desc}</Text>
                  <Text className={`tier-price ${tier.highlight ? 'tier-price-accent' : ''}`}>{tier.price}</Text>
                  <View className="tier-features">
                    {tier.features.map((f, i) => (
                      <View key={i} className="tier-feature-item">
                        <Text className="tier-feature-check">✓</Text>
                        <Text className="tier-feature-text">{f}</Text>
                      </View>
                    ))}
                  </View>
                  <View className={`tier-consult-btn ${tier.highlight ? 'tier-consult-accent' : 'tier-consult-default'}`} onClick={goToContact}>
                    <Text className="tier-consult-text">咨询详情</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* CTA */}
          <View className="cta-section">
            <Text className="cta-title">需要定制化设计服务？</Text>
            <Text className="cta-desc">联系我们的设计顾问，为您量身定制最适合的设计方案</Text>
            <View className="cta-btn" onClick={goToContact}>
              <Text className="cta-btn-text">立即咨询</Text>
            </View>
          </View>
        </View>
      )}

      {/* ====== 搭配稿服务 Tab ====== */}
      {activeTab === 'collocation' && (
        <View>
          {/* 搭配稿 Hero */}
          <View className="sub-hero">
            <View className="sub-hero-overlay" />
            <View className="sub-hero-content">
              <View className="sub-hero-badge">
                <Text className="sub-hero-badge-text">专业搭配服务</Text>
              </View>
              <Text className="sub-hero-title">搭配稿设计</Text>
              <Text className="sub-hero-desc">从搭配方案到样衣成品，为您的品牌打造完整的产品线</Text>
            </View>
          </View>

          {/* 季节切换 */}
          <View className="sub-tabs">
            <View
              className={`sub-tab-item ${collocationSeason === 'ss' ? 'active' : ''}`}
              onClick={() => setCollocationSeason('ss')}
            >
              <Text className="sub-tab-text">春夏款</Text>
            </View>
            <View
              className={`sub-tab-item ${collocationSeason === 'aw' ? 'active' : ''}`}
              onClick={() => setCollocationSeason('aw')}
            >
              <Text className="sub-tab-text">秋冬款</Text>
            </View>
          </View>

          {/* 搭配稿套餐 */}
          <View className="section">
            <View className="section-header-center">
              <Text className="section-label">COLLOCATION DRAFT</Text>
              <Text className="section-title-center">搭配稿套餐</Text>
              <Text className="section-desc-center">从搭配方案到设计稿、纸样、胚样，灵活选择</Text>
            </View>

            {collocationData.map((pkg, idx) => (
              <View key={idx} className="collocation-card">
                <View className="collocation-card-header">
                  <Text className="collocation-card-icon">⭐</Text>
                  <Text className="collocation-card-name">{pkg.name}</Text>
                </View>
                <Text className="collocation-card-desc">{pkg.desc}</Text>
                <Text className="collocation-card-price">¥{formatPriceWhole(pkg.price)}</Text>
                <Text className="collocation-card-meta">共{pkg.count}款 · 平均¥{pkg.unitPrice}/款 · {pkg.period}</Text>
                <View className="collocation-consult-btn" onClick={goToContact}>
                  <Text className="collocation-consult-text">立即咨询</Text>
                </View>
              </View>
            ))}
          </View>

          {/* 样衣套餐 */}
          <View className="section section-gray">
            <View className="section-header-center">
              <Text className="section-label">SAMPLE PACKAGE</Text>
              <Text className="section-title-center">样衣套餐</Text>
              <Text className="section-desc-center">从设计稿到成品样衣，一站式解决</Text>
            </View>

            {sampleData.map((pkg, idx) => (
              <View key={idx} className="collocation-card collocation-sample-card">
                <View className="sample-badge">
                  <Text className="sample-badge-text">样衣</Text>
                </View>
                <View className="collocation-card-header">
                  <Text className="collocation-card-icon">💎</Text>
                  <Text className="collocation-card-name">{pkg.name}</Text>
                </View>
                <Text className="collocation-card-desc">{pkg.desc}</Text>
                <Text className="collocation-card-price">¥{formatPriceWhole(pkg.price)}</Text>
                <Text className="collocation-card-meta">共{pkg.count}款 · 平均¥{pkg.unitPrice}/款 · {pkg.period}</Text>
                <View className="collocation-consult-btn-primary" onClick={goToContact}>
                  <Text className="collocation-consult-text-white">立即咨询</Text>
                </View>
              </View>
            ))}
          </View>

          {/* 购买须知 */}
          <View className="notice-card">
            <Text className="notice-title">ℹ️ 购买须知</Text>
            <View className="notice-list">
              <View className="notice-item">
                <Text className="notice-check">✓</Text>
                <Text className="notice-text">客人如选用数量大于以上任意一款套餐，超出部分按所适用套餐的平均单价计算</Text>
              </View>
              <View className="notice-item">
                <Text className="notice-check">✓</Text>
                <Text className="notice-text">所有合同期限均为选款无期限，实际选款周期不超过标注时间</Text>
              </View>
              <View className="notice-item">
                <Text className="notice-check">✓</Text>
                <Text className="notice-text">样衣套餐均为工艺、航管产品，具体工艺要求可咨询客服</Text>
              </View>
            </View>
          </View>

          {/* CTA */}
          <View className="cta-section">
            <Text className="cta-title">需要定制搭配方案？</Text>
            <Text className="cta-desc">联系我们的设计顾问，为您量身定制搭配方案</Text>
            <View className="cta-btn" onClick={goToContact}>
              <Text className="cta-btn-text">立即咨询</Text>
            </View>
          </View>
        </View>
      )}

      {/* ====== 合作模式 Tab ====== */}
      {activeTab === 'cooperation' && (
        <View>
          {/* 合作模式 Hero */}
          <View className="sub-hero">
            <View className="sub-hero-overlay" />
            <View className="sub-hero-content">
              <View className="sub-hero-badge">
                <Text className="sub-hero-badge-text">专业合作模式</Text>
              </View>
              <Text className="sub-hero-title">合作模式</Text>
              <Text className="sub-hero-desc">5种合作模式满足不同阶段客户需求</Text>
            </View>
          </View>

          {/* L1-L5 合作模式 */}
          <View className="section">
            <View className="section-header-center">
              <Text className="section-label">SERVICE TIERS</Text>
              <Text className="section-title-center">五大合作模式</Text>
              <Text className="section-desc-center">根据您的供应链能力和需求阶段，选择最适合的合作方式</Text>
            </View>

            {cooperationModes.map((mode, idx) => (
              <View key={idx} className="cooperation-card">
                {/* 等级徽章 */}
                <View className="cooperation-level" style={{ backgroundColor: mode.badgeColor }}>
                  <Text className="cooperation-level-text">{mode.level}</Text>
                </View>
                <Text className="cooperation-name">{mode.name}</Text>
                <Text className="cooperation-price">{mode.price}</Text>
                <Text className="cooperation-desc">{mode.desc}</Text>

                {/* 服务内容 */}
                <Text className="cooperation-section-title">服务内容</Text>
                {mode.features.map((f, i) => (
                  <View key={i} className="cooperation-feature-item">
                    <Text className="cooperation-feature-check">✓</Text>
                    <Text className="cooperation-feature-text">{f}</Text>
                  </View>
                ))}

                {/* 适合客户 */}
                <Text className="cooperation-section-title">适合客户</Text>
                <View className="cooperation-suitable">
                  <Text className="cooperation-suitable-text">{mode.suitable}</Text>
                </View>

                <View className="cooperation-consult-btn" onClick={goToContact}>
                  <Text className="cooperation-consult-text">立即咨询</Text>
                </View>
              </View>
            ))}
          </View>

          {/* 合作流程 */}
          <View className="section section-gray">
            <View className="section-header-center">
              <Text className="section-label">COOPERATION PROCESS</Text>
              <Text className="section-title-center">合作流程</Text>
              <Text className="section-desc-center">简单、高效、专业、省心的合作流程</Text>
            </View>

            <View className="flow-grid">
              {flowSteps.map((step, idx) => (
                <View key={idx} className="flow-step">
                  <View className="flow-step-num">
                    <Text className="flow-step-num-text">{idx + 1}</Text>
                  </View>
                  <Text className="flow-step-title">{step.title}</Text>
                  <Text className="flow-step-desc">{step.desc}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* CTA */}
          <View className="cta-section">
            <Text className="cta-title">不知道选哪种合作模式？</Text>
            <Text className="cta-desc">联系我们的顾问，根据您的实际情况推荐最适合的合作方案</Text>
            <View className="cta-btn" onClick={goToContact}>
              <Text className="cta-btn-text">免费咨询</Text>
            </View>
          </View>
        </View>
      )}

      {/* ====== 底部公共 CTA ====== */}
      {(activeTab === 'hot' || activeTab === 'buyer' || activeTab === 'rental') && (
        <View className="cta-section">
          <Text className="cta-title">需要爆款样衣服务？</Text>
          <Text className="cta-desc">联系我们的买手团队，为您挑选最适合的爆款样衣</Text>
          <View className="cta-btn" onClick={goToContact}>
            <Text className="cta-btn-text">立即咨询</Text>
          </View>
        </View>
      )}
    </View>
  )
}
