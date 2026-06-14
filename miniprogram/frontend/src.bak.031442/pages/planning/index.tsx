import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

export default function PlanningPage() {
  useEffect(() => { Taro.setNavigationBarTitle({ title: '商品企划' }) }, [])
  return (
    <ScrollView className="planning-page" scrollY>
      <View className="page-header">
        <Text className="page-title">商品企划工具</Text>
        <Text className="page-desc">导入销售数据，生成科学企划方案</Text>
      </View>
      <View className="tool-section">
        <View className="tool-card" onClick={() => Taro.navigateTo({ url: '/pages/contact/index' })}>
          <Text className="tool-title">开始新建企划</Text>
          <Text className="tool-desc">上传销售数据，AI生成企划方案</Text>
        </View>
        <View className="tool-card">
          <Text className="tool-title">历史企划</Text>
          <Text className="tool-desc">查看过往企划方案</Text>
        </View>
      </View>
    </ScrollView>
  )
}
