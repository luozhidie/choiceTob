import { View, Text, ScrollView } from '@tarojs/components'
import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

export default function CollocationPage() {
  useEffect(() => { Taro.setNavigationBarTitle({ title: '陈列搭配' }) }, [])
  return (
    <ScrollView className="collocation-page" scrollY>
      <View className="page-header">
        <Text className="page-title">陈列搭配</Text>
        <Text className="page-desc">专业陈列方案，提升店铺坪效</Text>
      </View>
      <View className="service-list">
        {[
          { title: '搭配稿服务', desc: '春夏/秋冬搭配方案', price: '¥300起' },
          { title: '陈列指导', desc: '门店陈列布局优化', price: '面议' },
          { title: '橱窗设计', desc: '节日/季节橱窗方案', price: '面议' },
        ].map((s, i) => (
          <View key={i} className="service-card" onClick={() => Taro.navigateTo({ url: '/pages/contact/index' })}>
            <Text className="service-title">{s.title}</Text>
            <Text className="service-desc">{s.desc}</Text>
            <Text className="service-price">{s.price}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}
