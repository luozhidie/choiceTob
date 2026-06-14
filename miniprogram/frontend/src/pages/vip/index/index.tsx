import { View, Text, ScrollView, Image, Input } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { getProfile } from '@/services/api'
import './index.scss'

export default function VipPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState<string | null>(null) // 正在支付的套餐ID
  const [selectedPlan, setSelectedPlan] = useState<number>(1) // 当前选中的套餐索引，默认选中外会员
  const [rechargeAmount, setRechargeAmount] = useState<string>('') // 充值金额

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '会员中心' })
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const token = Taro.getStorageSync('auth_token')
      if (!token) { setLoading(false); return }
      const res = await getProfile()
      setUser(res)
    } catch (e) {
      console.error('加载用户信息失败', e)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    Taro.removeStorageSync('auth_token')
    setUser(null)
  }

  // 微信支付开通会员
  const handleWechatPay = async (planId: string, priceInt: number) => {
    // 检查登录
    if (!user) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      Taro.navigateTo({ url: '/pages/vip/login/index' })
      return
    }

    setPaying(planId)
    try {
      // 调用后端统一下单API
      const res = await Taro.request({
        url: 'https://fxeknwkmytzedkhplozn.supabase.co/functions/v1/wechat-pay-unified-order',
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Taro.getStorageSync('auth_token')}`,
        },
        data: {
          product_id: planId,
          total_fee: priceInt, // 直接传分
          platform: 'mini',      // 小程序支付
          openid: user.openid || user.id || ''
        }
      })

      const result = res.data as any
      if (result.prepay_id || result.package) {
        // 调起微信支付
        await Taro.requestPayment({
          provider: 'wxpay',
          timeStamp: String(result.timeStamp),
          nonceStr: result.nonceStr,
          package: result.package || `prepay_id=${result.prepay_id}`,
          signType: result.signType || 'MD5',
          paySign: result.paySign,
        })
        // 支付成功
        Taro.showToast({ title: '支付成功！', icon: 'success' })
        loadProfile() // 刷新用户信息
      } else {
        throw new Error(result.error || '下单失败')
      }
    } catch (err: any) {
      console.error('[微信支付]', err)
      if (err.errMsg && err.errMsg.includes('cancel')) {
        Taro.showToast({ title: '已取消支付', icon: 'none' })
      } else {
        Taro.showToast({ title: err.message || '支付失败，请重试', icon: 'none' })
      }
    } finally {
      setPaying(null)
    }
  }

  // 处理充值支付
  const handleRechargePay = () => {
    const amount = parseFloat(rechargeAmount)
    if (!amount || amount <= 0) {
      Taro.showToast({ title: '请输入有效金额', icon: 'none' })
      return
    }
    const priceInt = Math.round(amount * 100) // 转换为分
    handleWechatPay('recharge', priceInt)
  }

  // 会员套餐数据（新版5种套餐）
  const plans = [
    {
      name: '价格会员',
      planId: 'price_member',
      price: '¥29.8',
      priceInt: 2980,
      period: '30天',
      color: '#f59e0b',
      bgGradient: 'linear-gradient(135deg, #fef3c7, #fde68a)',
      features: [
        '✅ 查看商品价格信息',
        '✅ 商品价格对比',
        '✅ 价格趋势分析',
      ]
    },
    {
      name: '基础会员',
      planId: 'basic_member',
      price: '¥199',
      priceInt: 19900,
      period: '1年',
      color: '#2d1b2e',
      bgGradient: 'linear-gradient(135deg, #2d1b2e, #4a1a4b)',
      recommended: true,
      features: [
        '✅ 基础选品报告',
        '✅ 商品企划详情',
        '✅ 基础数据分析',
      ]
    },
    {
      name: '进阶会员',
      planId: 'advanced_member',
      price: '¥399',
      priceInt: 39900,
      period: '1年',
      color: '#8b5cf6',
      bgGradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
      features: [
        '✅ 全部选品报告',
        '✅ 风格测试',
        '✅ 搭配建议',
        '✅ 趋势预测',
      ]
    },
    {
      name: '高阶会员',
      planId: 'premium_member',
      price: '¥699',
      priceInt: 69900,
      period: '1年',
      color: '#dc2626',
      bgGradient: 'linear-gradient(135deg, #dc2626, #991b1b)',
      features: [
        '✅ 所有基础权益',
        '✅ 1对1咨询服务',
        '✅ 专属顾问',
        '✅ 优先支持',
      ]
    },
    {
      name: '货品充值会员',
      planId: 'recharge',
      price: '自定义',
      priceInt: 0,
      period: '充值余额',
      color: '#059669',
      bgGradient: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
      isRecharge: true,
      features: [
        '✅ 充值后可购买单品',
        '✅ 可购买样衣',
        '✅ 余额长期有效',
        '✅ 随时可充值',
      ]
    },
  ]

  if (loading) {
    return (
      <View className="loading">
        <Text>加载中...</Text>
      </View>
    )
  }

  // 未登录状态：显示登录引导卡片
  if (!user) {
    return (
      <ScrollView className="vip-page" scrollY>
        {/* 登录引导区 */}
        <View className="login-required-card">
          <View className="login-required-bg" />
          <View className="login-required-content">
            <Text className="login-required-icon">🔒</Text>
            <Text className="login-required-title">登录后解锁全部会员权益</Text>
            <Text className="login-required-subtitle">注册会员，畅享专属服务</Text>
            <View className="login-required-btn" onClick={() => Taro.navigateTo({ url: '/pages/vip/login/index' })}>
              <Text className="login-required-btn-text">立即登录</Text>
            </View>
          </View>
        </View>

        {/* 会员权益预览 */}
        <View className="section-header">
          <Text className="section-title">会员权益一览</Text>
          <Text className="section-subtitle">登录后查看详细权益内容</Text>
        </View>

        {/* 会员套餐预览（未登录时只展示，不可点击） */}
        <View className="plans-list">
          {plans.map((p, i) => (
            <View
              key={i}
              className="plan-card plan-card-preview"
              style={{ background: p.bgGradient }}
            >
              {p.recommended && (
                <View className="recommended-badge">
                  <Text className="recommended-badge-text">推荐</Text>
                </View>
              )}
              
              <View className="plan-header">
                <Text className="plan-name">{p.name}</Text>
                <Text className="plan-period">({p.period})</Text>
              </View>
              
              <View className="plan-price-wrap">
                <Text className="plan-price-symbol">¥</Text>
                <Text className="plan-price-value">{p.price === '自定义' ? '??' : p.price.replace('¥', '')}</Text>
              </View>
              
              <View className="plan-features">
                {p.features.map((f, idx) => (
                  <View key={idx} className="plan-feature-item">
                    <Text className="plan-feature-text">{f}</Text>
                  </View>
                ))}
              </View>
              
              <View className="plan-btn plan-btn-disabled">
                <Text className="plan-btn-text plan-btn-text-disabled">登录后开通</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 底部安全区 */}
        <View className="bottom-safe" />
      </ScrollView>
    )
  }

  // 已登录状态：显示完整会员中心
  return (
    <ScrollView className="vip-page" scrollY>
      {/* 用户信息区 */}
      <View className="user-header">
        <View className="user-header-bg" />
        <View className="user-info-wrap">
          <View className="avatar">
            {user.avatar_url ? (
              <Image className="avatar-img" src={user.avatar_url} mode="aspectFill" />
            ) : (
              <Text className="avatar-text">{user.name?.[0] || 'V'}</Text>
            )}
          </View>
          <Text className="user-name">{user.name || '会员用户'}</Text>
          <Text className="user-phone">{user.phone || '未绑定手机'}</Text>
          <View className="vip-badge">
            <Text className="vip-badge-text">{user.vip_level || '普通会员'}</Text>
          </View>
        </View>
      </View>

      {/* 会员权益标题 */}
      <View className="section-header">
        <Text className="section-title">选择会员套餐</Text>
        <Text className="section-subtitle">开通会员，畅享全部权益</Text>
      </View>

      {/* 会员套餐列表 */}
      <View className="plans-list">
        {plans.map((p, i) => (
          <View
            key={i}
            className={`plan-card ${p.recommended ? 'plan-card-recommended' : ''} ${selectedPlan === i ? 'plan-card-selected' : ''}`}
            style={{ background: p.bgGradient }}
            onClick={() => setSelectedPlan(i)}
          >
            {p.recommended && (
              <View className="recommended-badge">
                <Text className="recommended-badge-text">推荐</Text>
              </View>
            )}
            
            <View className="plan-header">
              <Text className="plan-name">{p.name}</Text>
              <Text className="plan-period">({p.period})</Text>
            </View>
            
            <View className="plan-price-wrap">
              <Text className="plan-price-symbol">¥</Text>
              <Text className="plan-price-value">
                {p.isRecharge ? (rechargeAmount || '??') : p.price.replace('¥', '')}
              </Text>
              {p.isRecharge && (
                <Text className="plan-price-unit">元</Text>
              )}
            </View>

            {/* 充值金额输入 */}
            {p.isRecharge && selectedPlan === i && (
              <View className="recharge-input-wrap">
                <Text className="recharge-input-label">充值金额：</Text>
                <Input
                  className="recharge-input"
                  type="digit"
                  placeholder="请输入金额"
                  value={rechargeAmount}
                  onInput={(e) => setRechargeAmount(e.detail.value)}
                />
                <Text className="recharge-input-unit">元</Text>
              </View>
            )}
            
            <View className="plan-features">
              {p.features.map((f, idx) => (
                <View key={idx} className="plan-feature-item">
                  <Text className="plan-feature-text">{f}</Text>
                </View>
              ))}
            </View>
            
            <View
              className={`plan-btn ${p.recommended ? 'plan-btn-white' : 'plan-btn-dark'}`}
              onClick={(e) => {
                e.stopPropagation()
                if (p.isRecharge) {
                  handleRechargePay()
                } else {
                  handleWechatPay(p.planId, p.priceInt)
                }
              }}
            >
              {paying === p.planId ? (
                <Text className="plan-btn-text">支付中...</Text>
              ) : (
                <Text className={`plan-btn-text ${p.recommended ? 'plan-btn-text-dark' : ''}`}>
                  {p.isRecharge ? '立即充值' : '立即开通'}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* 会员权益说明 */}
      <View className="section-block">
        <Text className="block-title">会员权益说明</Text>
        <View className="block-content">
          <View className="benefit-item">
            <Text className="benefit-icon">💰</Text>
            <View className="benefit-info">
              <Text className="benefit-name">价格会员</Text>
              <Text className="benefit-desc">查看商品价格信息、价格对比、价格趋势分析</Text>
            </View>
          </View>
          
          <View className="benefit-item">
            <Text className="benefit-icon">📦</Text>
            <View className="benefit-info">
              <Text className="benefit-name">基础会员</Text>
              <Text className="benefit-desc">基础选品报告、商品企划详情、基础数据分析</Text>
            </View>
          </View>
          
          <View className="benefit-item">
            <Text className="benefit-icon">🎯</Text>
            <View className="benefit-info">
              <Text className="benefit-name">进阶会员</Text>
              <Text className="benefit-desc">全部选品报告、风格测试、搭配建议、趋势预测</Text>
            </View>
          </View>
          
          <View className="benefit-item">
            <Text className="benefit-icon">👑</Text>
            <View className="benefit-info">
              <Text className="benefit-name">高阶会员</Text>
              <Text className="benefit-desc">所有基础权益、1对1咨询服务、专属顾问、优先支持</Text>
            </View>
          </View>

          <View className="benefit-item">
            <Text className="benefit-icon">💳</Text>
            <View className="benefit-info">
              <Text className="benefit-name">货品充值</Text>
              <Text className="benefit-desc">充值余额后可购买单品、样衣，余额长期有效</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 功能入口列表 */}
      {user && (
        <View className="section-block">
          <Text className="block-title">我的服务</Text>
          <View className="menu-list">
            {[
              { label: '我的订单', url: '/pages/vip/orders/index', icon: '📦' },
              { label: '我的报告', url: '/pages/vip/reports/index', icon: '📝' },
              { label: '收货地址', url: '/pages/vip/address/index', icon: '📍' },
              { label: '风格测试', url: '/pages/vip/style-test/index', icon: '🎯' },
            ].map((item, i) => (
              <View key={i} className="menu-item" onClick={() => Taro.navigateTo({ url: item.url })}>
                <View className="menu-item-left">
                  <Text className="menu-item-icon">{item.icon}</Text>
                  <Text className="menu-item-label">{item.label}</Text>
                </View>
                <Text className="menu-item-arrow">›</Text>
              </View>
            ))}
            <View className="menu-item menu-item-logout" onClick={handleLogout}>
              <View className="menu-item-left">
                <Text className="menu-item-icon">🚪</Text>
                <Text className="menu-item-label" style={{ color: '#ef4444' }}>退出登录</Text>
              </View>
              <Text className="menu-item-arrow">›</Text>
            </View>
          </View>
        </View>
      )}

      {/* 底部安全区 */}
      <View className="bottom-safe" />
    </ScrollView>
  )
}
