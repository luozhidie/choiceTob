import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { getProfile } from '@/services/api'
import './index.scss'

export default function VipPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <View className="loading">
        <Text>加载中...</Text>
      </View>
    )
  }

  return (
    <ScrollView className="vip-page" scrollY>
      {/* 用户信息区 */}
      {user ? (
        <View className="user-header">
          <View className="avatar">{user.name?.[0] || 'V'}</View>
          <Text className="user-name">{user.name}</Text>
          <Text className="user-phone">{user.phone}</Text>
          <View className="vip-badge">{user.vip_level || '普通会员'}</View>
        </View>
      ) : (
        <View className="user-header">
          <View className="avatar">V</View>
          <Text className="login-hint" onClick={() => Taro.navigateTo({ url: '/pages/vip/login/index' })}>点击登录 / 注册</Text>
        </View>
      )}

      {/* 会员权益 */}
      <View className="section">
        <Text className="section-title">会员权益</Text>
        <View className="plans">
          {[
            { name: 'Base会员', price: '¥365/年', desc: '查看色彩报告、基础选品', color: '#3b82f6' },
            { name: 'Advanced会员', price: '¥3650/年', desc: '全部选品报告、商品企划', color: '#8b5cf6' },
            { name: '爆款样衣会员', price: '¥998/月', desc: '查看高清爆款、价格详情', color: '#f59e0b' },
          ].map((p, i) => (
            <View key={i} className="plan-card" style={{ borderColor: p.color }}>
              <Text className="plan-name" style={{ color: p.color }}>{p.name}</Text>
              <Text className="plan-price">{p.price}</Text>
              <Text className="plan-desc">{p.desc}</Text>
              <View className="plan-btn" style={{ background: p.color }} onClick={() => Taro.navigateTo({ url: '/pages/contact/index' })}>
                <Text className="plan-btn-text">联系客服开通</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 功能入口 */}
      {user && (
        <View className="section">
          <Text className="section-title">我的服务</Text>
          {[
            { label: '我的订单', url: '/pages/vip/orders/index' },
            { label: '我的报告', url: '/pages/vip/reports/index' },
            { label: '收货地址', url: '/pages/vip/address/index' },
            { label: '风格测试', url: '/pages/vip/style-test/index' },
          ].map((item, i) => (
            <View key={i} className="menu-item" onClick={() => Taro.navigateTo({ url: item.url })}>
              <Text className="menu-label">{item.label}</Text>
              <Text className="menu-arrow">›</Text>
            </View>
          ))}
          <View className="menu-item logout" onClick={handleLogout}>
            <Text className="menu-label" style={{ color: '#ef4444' }}>退出登录</Text>
          </View>
        </View>
      )}
    </ScrollView>
  )
}
