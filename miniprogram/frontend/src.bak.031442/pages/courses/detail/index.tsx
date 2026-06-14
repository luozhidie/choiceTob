import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { getCourseDetail } from '@/services/api'
import './index.scss'

export default function CourseDetailPage() {
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const params = Taro.useRouter()?.params

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '课程详情' })
    if (params?.id) loadDetail(params.id)
  }, [params?.id])

  const loadDetail = async (id: string) => {
    try {
      // const data = await getCourseDetail(id)
      // setCourse(data)
      setCourse({
        title: 'CMB色彩诊断基础课',
        lessons: 8,
        students: 1200,
        price: '¥299',
        desc: '系统学习CMB色彩诊断理论，掌握肤色冷暖判断、色彩季型定位核心方法。',
        cover: '',
      })
    } catch (e) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  if (loading || !course) {
    return <View className="loading"><Text>加载中...</Text></View>
  }

  return (
    <ScrollView className="course-detail-page" scrollY>
      <View className="course-cover">
        <View className="cover-placeholder" />
      </View>
      <View className="course-info">
        <Text className="course-title">{course.title}</Text>
        <Text className="course-meta">共{course.lessons}课时 · {course.students}人已学</Text>
        <Text className="course-price">{course.price}</Text>
        <Text className="course-desc">{course.desc}</Text>
      </View>
      <View className="buy-section">
        <View className="buy-btn" onClick={() => Taro.navigateTo({ url: '/pages/contact/index' })}>
          <Text className="buy-btn-text">联系客服购买</Text>
        </View>
      </View>
    </ScrollView>
  )
}
