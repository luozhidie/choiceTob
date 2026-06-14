import { View, Text, Input, Button } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { register } from '@/services/api'
import './index.scss'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!name || !phone || !password) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }
    if (password !== confirmPwd) {
      Taro.showToast({ title: '两次密码不一致', icon: 'none' })
      return
    }
    setSubmitting(true)
    try {
      await register({ name, phone, password })
      Taro.showToast({ title: '注册成功，请登录', icon: 'success' })
      setTimeout(() => Taro.redirectTo({ url: '/pages/vip/login/index' }), 1000)
    } catch (e: any) {
      Taro.showToast({ title: e.message || '注册失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="register-page">
      <View className="register-card">
        <Text className="register-title">注册</Text>
        <Text className="register-subtitle">创建您的会员账号</Text>

        {[
          { label: '姓名', placeholder: '请输入姓名', value: name, onChange: setName, type: 'text' },
          { label: '手机号', placeholder: '请输入手机号', value: phone, onChange: setPhone, type: 'number' },
          { label: '密码', placeholder: '请输入密码', value: password, onChange: setPassword, type: 'password' },
          { label: '确认密码', placeholder: '请再次输入密码', value: confirmPwd, onChange: setConfirmPwd, type: 'password' },
        ].map((field, i) => (
          <View key={i} className="form-item">
            <Text className="form-label">{field.label}</Text>
            <Input
              className="form-input"
              type={field.type}
              placeholder={field.placeholder}
              value={field.value}
              onInput={e => field.onChange(e.detail.value)}
            />
          </View>
        ))}

        <Button className="submit-btn" loading={submitting} onClick={handleSubmit}>
          {submitting ? '注册中...' : '注册'}
        </Button>

        <View className="footer-link">
          <Text>已有账号？</Text>
          <Text className="link" onClick={() => Taro.redirectTo({ url: '/pages/vip/login/index' })}>去登录</Text>
        </View>
      </View>
    </View>
  )
}
