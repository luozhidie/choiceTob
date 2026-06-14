import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { getCourses } from '@/services/api'
import './index.scss'

export default function CoursesPage() {
  const [activeTab, setActiveTab] = useState<'courses' | 'planning'>('courses')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '课程企划' })
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // TODO: 对接 API
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="courses-page">
      {/* Tab 切换 */}
      <View className="tab-bar">
        {[
          { key: 'courses' as const, label: '课程教学' },
          { key: 'planning' as const, label: '商品企划' },
        ].map(tab => (
          <View
            key={tab.key}
            className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text>{tab.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView className="content" scrollY>
        {activeTab === 'courses' ? (
          <>
            <View className="section">
              <Text className="section-title">课程教学</Text>
              <Text className="section-desc">专业CMB色彩形象顾问课程，助你掌握色彩搭配核心技能</Text>
            </View>
            {/* 课程列表 */}
            {[
              { id: 1, title: 'CMB色彩诊断基础课', lessons: 8, students: 1200, price: '¥299' },
              { id: 2, title: '风格定位与搭配实战', lessons: 12, students: 860, price: '¥499' },
              { id: 3, title: '买手选品高阶课', lessons: 10, students: 520, price: '¥699' },
            ].map(c => (
              <View key={c.id} className="course-card" onClick={() => Taro.navigateTo({ url: `/pages/courses/detail/index?id=${c.id}` })}>
                <View className="course-img-wrap">
                  <View className="course-img-placeholder" />
                </View>
                <View className="course-info">
                  <Text className="course-title">{c.title}</Text>
                  <Text className="course-meta">共{c.lessons}课时 · {c.students}人已学</Text>
                  <Text className="course-price">{c.price}</Text>
                </View>
              </View>
            ))}
          </>
        ) : (
          <>
            <View className="section">
              <Text className="section-title">商品企划</Text>
              <Text className="section-desc">数据驱动的商品企划工具，科学制定采购计划</Text>
            </View>
            <View className="planning-entry" onClick={() => Taro.navigateTo({ url: '/pages/planning/index' })}>
              <Text className="planning-entry-title">进入商品企划工具</Text>
              <Text className="planning-entry-desc">导入销售数据，生成企划方案</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}
