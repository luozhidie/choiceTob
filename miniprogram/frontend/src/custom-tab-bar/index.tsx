import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

const TABS = [
  { key: 'home', path: '/pages/home/index/index', text: '首页', icon: 'home' },
  { key: 'courses', path: '/pages/courses/index/index', text: '课程企划', icon: 'courses' },
  { key: 'hot', path: '/pages/hot-picks/index/index', text: '爆款样衣', icon: 'hot' },
  { key: 'news', path: '/pages/news/index/index', text: '资讯', icon: 'news' },
  { key: 'vip', path: '/pages/vip/index/index', text: 'VIP', icon: 'vip' },
]

export default function TabBar() {
  const [active, setActive] = useState('home')

  useEffect(() => {
    const pages = Taro.getCurrentPages()
    if (pages.length === 0) return
    const route = pages[pages.length - 1].route || ''
    const tab = TABS.find(t => route.includes(t.path.replace('/', '')))
    if (tab) setActive(tab.key)
  }, [])

  const handleTap = (tab) => {
    setActive(tab.key)
    Taro.switchTab({ url: tab.path })
  }

  return (
    <View className="custom-tab-bar">
      {TABS.map(tab => (
        <View
          key={tab.key}
          className={`tab-item ${active === tab.key ? 'tab-active' : ''}`}
          onClick={() => handleTap(tab)}
        >
          <View className={`tab-icon tab-icon-${tab.icon} ${active === tab.key ? 'active' : ''}`} />
          <Text className={`tab-text ${active === tab.key ? 'active' : ''}`}>{tab.text}</Text>
        </View>
      ))}
    </View>
  )
}
