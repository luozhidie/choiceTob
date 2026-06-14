import { View, Text, ScrollView, Image, Button } from '@tarojs/components'
import { useState, useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import { submitStyleTest } from '@/services/api'
import './index.scss'

/* ============ 题目定义（和网页版一致）============ */
const INPUT_QUESTIONS = [
  { id: 'full_name', label: '1. 你的名字', type: 'text', placeholder: '请输入', required: true },
  { id: 'wechat_qr', label: '2. 请提供你的微信二维码', type: 'upload', required: true, maxFiles: 1, maxSize: 10 },
  { id: 'age', label: '3. 年龄', type: 'text', placeholder: '请输入', required: true },
  { id: 'video_course_info', label: '4. 是否视频课学员，你在几号社群，微信名？（优先连唛）', type: 'text', placeholder: '请输入', required: true },
  { id: 'look_vs_age', label: '5. 看上去会比同年人（ ）？', type: 'text', placeholder: '请输入', required: true },
  { id: 'height', label: '6. 身高：', type: 'text', placeholder: '请输入', required: true },
]

const CHOICE_QUESTIONS = [
  { id: 'q7', label: '7. 你看起来的身高和实际身高相比会：', options: ['A. 显高', 'B. 显矮', 'C. 正常', 'D. 不知道'], required: true },
  { id: 'q8', label: '8. 有没有擅长体育项目', options: ['A. 有', 'B. 没有'], required: true },
  { id: 'q9', label: '9. 你穿正装与休闲装哪个好看？', options: ['A. 正装有气质', 'B. 休闲装好看', 'C. 都差不多', 'D. 不知道'], required: true },
  { id: 'q10', label: '10. 穿裤装和裙装哪个好看？', options: ['A. 裤装', 'B. 裙装', 'C. 都差不多，没区别', 'D. 不知道'], required: true },
  { id: 'q11', label: '11. 你穿连衣裙和半裙哪个好看？', options: ['A. 连衣裙', 'B. 半裙', 'C. 都差不多', 'D. 不知道'], required: true },
  { id: 'q12', label: '12. 你穿上衣（不是风衣大衣）到哪个长度好看？', options: ['A. 短款', 'B. 中款', 'C. 长款', 'D. 都差不多'], required: true },
  { id: 'q13', label: '13. 有没有这样的现象：你穿的衣服的面料看上去价值感高就好看', options: ['A. 有', 'B. 没有'], required: true },
  { id: 'q14', label: '14. 你小时候会不会调皮淘气，上墙爬树的行为？', options: ['A. 有', 'B. 没有'], required: true },
  { id: 'q15', label: '15. 你在青春期身型发育上和同年人相比', options: ['A. 会早些', 'B. 正常发育', 'C. 较晚'], required: true },
  { id: 'q16', label: '16. 洗完脸后当时皮肤会不会白一些', options: ['A. 会', 'B. 不会'], required: true },
  { id: 'q17', label: '17. 平时会不会容易脸红', options: ['A. 容易', 'B. 不容易'], required: true },
]

export default function StyleTestPage() {
  const [user, setUser] = useState<any>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [photos, setPhotos] = useState<{ photos_1: string[]; photos_2: string[]; photos_3: string[] }>({ photos_1: [], photos_2: [], photos_3: [] })
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '色彩风格诊断' })
    checkLogin()
  }, [])

  const checkLogin = () => {
    const token = Taro.getStorageSync('auth_token')
    if (!token) {
      // 未登录，引导去登录
      return
    }
    // TODO: 验证 token 有效性
  }

  const handleUpload = async (field: string, filePath: string) => {
    setUploading(prev => ({ ...prev, [field]: true }))
    try {
      // TODO: 上传到 Supabase Storage
      // 小程序用 Taro.uploadFile
      Taro.showToast({ title: '上传功能开发中', icon: 'none' })
    } finally {
      setUploading(prev => ({ ...prev, [field]: false }))
    }
  }

  const validate = (): string => {
    for (const q of INPUT_QUESTIONS) {
      if (q.required && !form[q.id]) return `请填写：${q.label.replace(/^\d+\.\s*/, '')}`
    }
    for (const q of CHOICE_QUESTIONS) {
      if (q.required && !answers[q.id]) return `请选择：${q.label.replace(/^\d+\.\s*/, '')}`
    }
    if (photos.photos_1.length === 0) return '请上传：图片文件一'
    return ''
  }

  const handleSubmit = async () => {
    const errMsg = validate()
    if (errMsg) { setError(errMsg); return }
    setSubmitting(true)
    setError('')
    try {
      await submitStyleTest({
        full_name: form.full_name,
        wechat_qr_url: form.wechat_qr || null,
        age: form.age,
        video_course_info: form.video_course_info || null,
        look_vs_age: form.look_vs_age || null,
        height: form.height || null,
        answers,
        photo_urls_1: photos.photos_1,
        photo_urls_2: photos.photos_2,
        photo_urls_3: photos.photos_3,
      })
      setSuccess(true)
      Taro.showToast({ title: '提交成功！', icon: 'success' })
    } catch (e: any) {
      setError(e.message || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  // 未登录引导
  const token = Taro.getStorageSync('auth_token')
  if (!token) {
    return (
      <View className="login-guide">
        <View className="guide-card">
          <Text className="guide-icon">📝</Text>
          <Text className="guide-title">请先登录</Text>
          <Text className="guide-desc">登录后即可进行色彩风格诊断测试</Text>
          <View className="guide-btns">
            <Button className="btn-primary" onClick={() => Taro.navigateTo({ url: '/pages/vip/login/index' })}>去登录</Button>
            <Button className="btn-outline" onClick={() => Taro.navigateTo({ url: '/pages/vip/register/index' })}>去注册</Button>
          </View>
        </View>
      </View>
    )
  }

  // 提交成功
  if (success) {
    return (
      <View className="success-page">
        <Text className="success-icon">✅</Text>
        <Text className="success-title">提交成功！</Text>
        <Text className="success-desc">您的色彩风格诊断问卷已提交，专业顾问将在24小时内与您联系</Text>
        <Button className="btn-primary" onClick={() => Taro.switchTab({ url: '/pages/vip/index' })}>返回会员中心</Button>
      </View>
    )
  }

  return (
    <ScrollView className="style-test-page" scrollY>
      <View className="page-header">
        <Text className="page-title">色彩风格诊断问卷</Text>
        <Text className="page-desc">请详细填写以下内容，我们将以微信形式通知你结果</Text>
      </View>

      {error && (
        <View className="error-bar">
          <Text className="error-text">{error}</Text>
        </View>
      )}

      <View className="form-section">
        {/* 输入题 1-6 */}
        {INPUT_QUESTIONS.map(q => (
          <View key={q.id} className="form-group">
            <Text className="form-label">{q.label} {q.required && <Text className="required">*</Text>}</Text>
            {q.type === 'text' ? (
              <Input
                className="form-input"
                placeholder={q.placeholder}
                value={form[q.id] || ''}
                onInput={e => setForm(prev => ({ ...prev, [q.id]: e.detail.value }))}
              />
            ) : (
              <View className="upload-area" onClick={() => {
                Taro.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'] }).then(res => {
                  if (res.tempFilePaths[0]) handleUpload(q.id, res.tempFilePaths[0])
                })
              }}>
                <Text className="upload-text">{form[q.id] ? '已上传' : '点击上传图片'}</Text>
                {uploading[q.id] && <Text className="upload-loading">上传中...</Text>}
              </View>
            )}
          </View>
        ))}

        {/* 单选题 7-17 */}
        {CHOICE_QUESTIONS.map(q => (
          <View key={q.id} className="form-group">
            <Text className="form-label">{q.label} {q.required && <Text className="required">*</Text>}</Text>
            <View className="options-list">
              {q.options.map(opt => (
                <View
                  key={opt}
                  className={`option-item ${answers[q.id] === opt ? 'active' : ''}`}
                  onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                >
                  <Text className={`option-text ${answers[q.id] === opt ? 'active' : ''}`}>{opt}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* 第18题 照片要求 */}
        <View className="form-group">
          <Text className="form-label">18. 需要提供的照片</Text>
          <View className="photo-requirements">
            <Text className="req-text">多张生活照 要求：</Text>
            <Text className="req-item">1. 最好全身照或大半身照</Text>
            <Text className="req-item">2. 不能戴口罩</Text>
            <Text className="req-item">3. 面部清晰</Text>
            <Text className="req-item">4. 最好不同场合，不同颜色、款式</Text>
          </View>
        </View>

        {/* 图片上传 19-21 */}
        {[
          { id: 'photos_1', label: '19. 图片文件一（必填）', required: true },
          { id: 'photos_2', label: '20. 图片文件二（选填）', required: false },
          { id: 'photos_3', label: '21. 图片文件三（选填）', required: false },
        ].map(p => (
          <View key={p.id} className="form-group">
            <Text className="form-label">{p.label} {p.required && <Text className="required">*</Text>}</Text>
            <View className="upload-area" onClick={() => {
              Taro.chooseImage({ count: 10, sizeType: ['compressed'], sourceType: ['album', 'camera'] }).then(res => {
                const newPaths = res.tempFilePaths.slice(0, 10 - photos[p.id as keyof typeof photos].length)
                setPhotos(prev => ({ ...prev, [p.id]: [...prev[p.id as keyof typeof prev], ...newPaths] }))
              })
            }}>
              <Text className="upload-text">点击选择图片（{photos[p.id as keyof typeof photos].length}/10）</Text>
            </View>
            {photos[p.id as keyof typeof photos].length > 0 && (
              <View className="photo-preview-list">
                {photos[p.id as keyof typeof photos].map((url, i) => (
                  <View key={i} className="photo-preview-item">
                    <Image src={url} className="photo-thumb" />
                    <View className="photo-delete" onClick={(e) => {
                      e.stopPropagation()
                      setPhotos(prev => ({ ...prev, [p.id]: prev[p.id as keyof typeof prev].filter((_, idx) => idx !== i) }))
                    }}>
                      <Text className="delete-text">删除</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* 提交按钮 */}
        <View className="submit-section">
          <Button className="submit-btn" loading={submitting} onClick={handleSubmit}>
            {submitting ? '提交中...' : '提交'}
          </Button>
        </View>
      </View>

      <Text className="footer-note">所有信息仅用于色彩风格诊断，严格保密</Text>
    </ScrollView>
  )
}
