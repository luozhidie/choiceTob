import { View, Text, ScrollView, Input, Textarea, Picker } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

const experienceOptions = ['无', '1年以下', '1-3年', '3-5年', '5年以上']
const storeCountOptions = ['1-2家', '3-5家', '6-10家', '10家以上']

export default function AgentRecruitPage() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    wechatId: '',
    experience: 0,
    storeCount: 0,
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!form.name || !form.phone) {
      Taro.showToast({ title: '请填写姓名和电话', icon: 'none' })
      return
    }
    setSubmitting(true)
    // TODO: 后面接 API /api/agent/apply
    setTimeout(() => {
      Taro.showToast({ title: '提交成功，我们会尽快联系您', icon: 'success' })
      setSubmitting(false)
      Taro.navigateBack()
    }, 1500)
  }

  return (
    <ScrollView className="agent-recruit-page" scrollY>
      {/* Hero */}
      <View className="hero">
        <View className="hero-overlay" />
        <View className="hero-content">
          <Text className="hero-badge">JOIN AGENT</Text>
          <Text className="hero-title">加盟招募</Text>
          <Text className="hero-desc">成为我们的合作伙伴，共享时尚产业红利</Text>
        </View>
      </View>

      {/* 加盟优势 */}
      <View className="advantages-section">
        <View className="section-header">
          <Text className="section-label">ADVANTAGES</Text>
          <Text className="section-title">加盟优势</Text>
        </View>
        <View className="advantages-grid">
          {[
            { icon: '📈', title: '数据驱动', desc: 'AI选品+销售预测，降低库存风险' },
            { icon: '🎨', title: '设计支持', desc: '专业设计团队，季度更新300+款' },
            { icon: '📦', title: '供应链', desc: '广州/杭州直采，价格优势明显' },
            { icon: '🎓', title: '培训体系', desc: '从零基础到专业买手的全链路培训' },
          ].map((a, i) => (
            <View key={i} className="advantage-card">
              <Text className="adv-icon">{a.icon}</Text>
              <Text className="adv-title">{a.title}</Text>
              <Text className="adv-desc">{a.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 加盟条件 */}
      <View className="conditions-section">
        <View className="section-header">
          <Text className="section-label">CONDITIONS</Text>
          <Text className="section-title">加盟条件</Text>
        </View>
        <View className="conditions-list">
          {[
            '认同品牌理念，遵纪守法',
            '有实体门店或线上销售渠道',
            '具备一定的资金实力和抗风险能力',
            '愿意接受总部统一管理和培训',
            '有良好的商业信誉和服务意识',
          ].map((c, i) => (
            <View key={i} className="condition-item">
              <Text className="condition-check">✅</Text>
              <Text className="condition-text">{c}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 报名表单 */}
      <View className="form-section">
        <View className="section-header">
          <Text className="section-label">APPLY NOW</Text>
          <Text className="section-title">立即报名</Text>
        </View>
        <View className="form-card">
          <View className="form-item">
            <Text className="form-label">姓名 *</Text>
            <Input
              className="form-input"
              placeholder="请输入您的姓名"
              value={form.name}
              onInput={(e) => setForm({ ...form, name: e.detail.value })}
            />
          </View>
          <View className="form-item">
            <Text className="form-label">电话 *</Text>
            <Input
              className="form-input"
              placeholder="请输入联系电话"
              value={form.phone}
              onInput={(e) => setForm({ ...form, phone: e.detail.value })}
            />
          </View>
          <View className="form-item">
            <Text className="form-label">邮箱</Text>
            <Input
              className="form-input"
              placeholder="选填"
              value={form.email}
              onInput={(e) => setForm({ ...form, email: e.detail.value })}
            />
          </View>
          <View className="form-item">
            <Text className="form-label">公司/店铺名</Text>
            <Input
              className="form-input"
              placeholder="选填"
              value={form.company}
              onInput={(e) => setForm({ ...form, company: e.detail.value })}
            />
          </View>
          <View className="form-item">
            <Text className="form-label">微信号</Text>
            <Input
              className="form-input"
              placeholder="选填"
              value={form.wechatId}
              onInput={(e) => setForm({ ...form, wechatId: e.detail.value })}
            />
          </View>
          <View className="form-item">
            <Text className="form-label">从业经验</Text>
            <Picker
              mode="selector"
              range={experienceOptions}
              value={form.experience}
              onChange={(e) => setForm({ ...form, experience: Number(e.detail.value) })}
            >
              <View className="form-picker">
                <Text className="picker-text">{experienceOptions[form.experience]}</Text>
                <Text className="picker-arrow">▼</Text>
              </View>
            </Picker>
          </View>
          <View className="form-item">
            <Text className="form-label">预计门店数</Text>
            <Picker
              mode="selector"
              range={storeCountOptions}
              value={form.storeCount}
              onChange={(e) => setForm({ ...form, storeCount: Number(e.detail.value) })}
            >
              <View className="form-picker">
                <Text className="picker-text">{storeCountOptions[form.storeCount]}</Text>
                <Text className="picker-arrow">▼</Text>
              </View>
            </Picker>
          </View>
          <View className="form-item">
            <Text className="form-label">留言</Text>
            <Textarea
              className="form-textarea"
              placeholder="请输入您的留言或问题"
              value={form.message}
              onInput={(e) => setForm({ ...form, message: e.detail.value })}
            />
          </View>

          <View className="form-submit" onClick={handleSubmit}>
            <Text className="submit-text">{submitting ? '提交中...' : '提交报名'}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}
