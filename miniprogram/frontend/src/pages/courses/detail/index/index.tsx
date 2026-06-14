import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Page() {
  return (
    <ScrollView className="page" scrollY>
      <View className="section">
        <Text className="section-title">页面开发中</Text>
        <Text className="section-desc">内容即将上线，敬请期待</Text>
      </View>
    </ScrollView>
  )
}
