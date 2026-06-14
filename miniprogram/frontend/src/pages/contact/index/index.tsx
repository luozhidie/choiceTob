import { View, Text, Button } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

export default function ContactPage() {
  return (
    <View className="contact-page">
      <View className="contact-hero">
        <Text className="contact-hero-title">联系我们</Text>
        <Text className="contact-hero-desc">如有任何问题，请拨打热线 13925997776</Text>
      </View>
      <View className="contact-section">
        <Button onClick={() => Taro.makePhoneCall({ phoneNumber: '13925997776' })}>
          拨打电话 13925997776
        </Button>
      </View>
    </View>
  )
}
