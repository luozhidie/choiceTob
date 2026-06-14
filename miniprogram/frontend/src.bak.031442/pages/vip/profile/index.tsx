import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { getProfile } from '@/services/api'
import './index.scss'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '个人中心' })
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const res = await getProfile()
      setUser(res)
    } catch (e) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    Taro.removeStorageSync('auth_token')
    Taro.navigateBack()
  }

  if (loading) {
    return (
      <View className="loading">
        <Text>加载中...</Text>
      </View>
    )
  }

  return (
    <ScrollView className="profile-page" scrollY>
      {/* 用户信息 */}
      <View className="profile-header">
        <View className="avatar">{user?.name?.[0] || 'V'}</View>
        <Text className="name">{user?.name || '用户'}</Text>
        <Text className="phone">{user?.phone || '--'}</Text>
      </View>

      {/* 功能菜单 */}
      <View className="menu-section">
        {[
          { label: '我的订单', url: '/pages/vip/orders/index' },
          { label: '我的报告', url: '/pages/vip/reports/index' },
          { label: '收货地址', url: '/pages/vip/address/index' },
          { label: '风格测试记录', url: '/pages/vip/style-test/index' },
        ].map((item, i) => (
          <View key={i} className="menu-item" onClick={() => Taro.navigateTo({ url: item.url })}>
            <Text className="menu-label">{item.label}</Text>
            <Text className="menu-arrow">›</Text>
          </View>
        ))}
      </View>

      {/* 退出登录 */}
      <View className="logout-section">
        <View className="logout-btn" onClick={handleLogout}>
          <Text className="logout-text">退出登录</Text>
        </View>
      </View>
    </ScrollView>
  )
}
