import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { supabase } from '@/services/supabase'
import './index.scss'

interface PlaningReport {
  id: string
  title: string | null
  cover_image: string | null
  status: string | null
  category: string | null
  created_at: string
  member_only: boolean
}

export default function PlanningPage() {
  const [reports, setReports] = useState<PlanningReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '商品企划' })
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('planning_reports')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .getList<PlanningReport>()

    if (data) setReports(data)
    setLoading(false)
  }

  return (
    <ScrollView className="planning-page" scrollY>
      {/* 页面头部 */}
      <View className="page-hero">
        <View className="hero-overlay" />
        <View className="hero-content">
          <Text className="hero-badge">AI 智能企划</Text>
          <Text className="hero-title">商品企划</Text>
          <Text className="hero-desc">输入数据，AI自动生成完整企划方案</Text>
        </View>
      </View>

      {/* 企划工具入口 */}
      <View className="tools-section">
        <View className="tool-card" onClick={() => Taro.navigateTo({ url: '/pages/planning/ai/index' })}>
          <Text className="tool-icon">📊</Text>
          <Text className="tool-title">AI 生成企划</Text>
          <Text className="tool-desc">填写基本信息，一键生成企划报告</Text>
        </View>
        <View className="tool-card" onClick={() => Taro.navigateTo({ url: '/pages/planning/upload/index' })}>
          <Text className="tool-icon">📁</Text>
          <Text className="tool-title">上传销售数据</Text>
          <Text className="tool-desc">上传Excel，AI分析并生成企划</Text>
        </View>
      </View>

      {/* 企划报告列表 */}
      <View className="reports-section">
        <View className="section-header">
          <Text className="section-title">企划报告</Text>
          <Text className="section-subtitle">浏览已生成的企划方案</Text>
        </View>

        {loading ? (
          <View className="loading">加载中...</View>
        ) : reports.length === 0 ? (
          <View className="empty">
            <Text className="empty-icon">📄</Text>
            <Text className="empty-text">暂无企划报告</Text>
            <Text className="empty-hint">点击上方工具开始生成</Text>
          </View>
        ) : (
          <View className="report-list">
            {reports.map(report => (
              <View key={report.id} className="report-card" onClick={() => Taro.navigateTo({ url: `/pages/planning/detail/index?id=${report.id}` })}>
                <View className="report-cover">
                  {report.cover_image ? (
                    <Image className="cover-img" src={report.cover_image} mode="aspectFill" />
                  ) : (
                    <View className="cover-placeholder">
                      <Text>📊</Text>
                    </View>
                  )}
                  {report.member_only && (
                    <View className="member-badge">
                      <Text>会员专享</Text>
                    </View>
                  )}
                </View>
                <View className="report-info">
                  <Text className="report-title">{report.title || '未命名企划'}</Text>
                  <View className="report-meta">
                    <Text className="report-category">{report.category || '通用'}</Text>
                    <Text className="report-date">{new Date(report.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  )
}
