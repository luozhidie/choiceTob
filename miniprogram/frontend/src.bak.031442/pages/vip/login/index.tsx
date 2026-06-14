import { View, Text, Input, Button } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { login } from '@/services/api'
import './index.scss'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!phone || !password) {
      Taro.showToast({ title: '请填写手机号和密码', icon: 'none' })
      return
    }
    setSubmitting(true)
    try {
      const res = await login(phone, password)
      Taro.setStorageSync('auth_token', res.token)
      Taro.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1000)
    } catch (e: any) {
      Taro.showToast({ title: e.message || '登录失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="login-page">
      <View className="login-card">
        <Text className="login-title">登录</Text>
        <Text className="login-subtitle">登录后享受完整会员服务</Text>

        <View className="form-item">
          <Text className="form-label">手机号</Text>
          <Input
            className="form-input"
            type="number"
            maxlength={11}
            placeholder="请输入手机号"
            value={phone}
            onInput={e => setPhone(e.detail.value)}
          />
        </View>

        <View className="form-item">
          <Text className="form-label">密码</Text>
          <Input
            className="form-input"
            type="password"
            placeholder="请输入密码"
            value={password}
            onInput={e => setPassword(e.detail.value)}
          />
        </View>

        <Button className="submit-btn" loading={submitting} onClick={handleSubmit}>
          {submitting ? '登录中...' : '登录'}
        </Button>

        <View className="footer-link">
          <Text>没有账号？</Text>
          <Text className="link" onClick={() => Taro.redirectTo({ url: '/pages/vip/register/index' })}>去注册</Text>
        </View>
      </View>
    </View>
  )
}
