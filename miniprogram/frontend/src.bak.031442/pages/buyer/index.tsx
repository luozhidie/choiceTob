import { View, Text, ScrollView } from '@tarojs/components'
import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

export default function BuyerPage() {
  useEffect(() => { Taro.setNavigationBarTitle({ title: '买手选品' }) }, [])
  return (
    <ScrollView className="buyer-page" scrollY>
      <View className="page-header">
        <Text className="page-title">买手选品服务</Text>
        <Text className="page-desc">专业买手团队，为您精选爆款</Text>
      </View>
      <View className="service-list">
        {[
          { title: '买手爆款样衣', desc: '春夏/秋冬套餐，专业买手对接需求', price: '¥390起' },
          { title: '选品报告', desc: '数据驱动，科学选品决策', price: '¥199/份' },
          { title: '供应链对接', desc: '优质工厂资源，FOB生产供货', price: '面议' },
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
