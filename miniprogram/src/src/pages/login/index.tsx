import { Component } from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { request } from '../../services/api';

const API_BASE = 'https://colour-choice.art/api';

interface LoginRes {
  success?: boolean;
  user?: any;
  token?: string;
  refresh_token?: string;
  openid?: string;
  error?: string;
}

export default class LoginPage extends Component {
  state = {
    loading: false,
    error: '',
  };

  componentDidMount() {
    // 如果已登录，直接跳转
    const token = Taro.getStorageSync('auth_token');
    if (token) {
      Taro.switchTab({ url: '/pages/my/index' });
    }
  }

  // 微信登录（主流程）
  handleWechatLogin = async () => {
    this.setState({ loading: true, error: '' });

    try {
      // 1. 获取微信登录 code
      const loginRes: any = await new Promise((resolve, reject) => {
        Taro.login({
          success: resolve,
          fail: reject,
        });
      });

      if (!loginRes.code) {
        throw new Error(loginRes.errMsg || '获取登录凭证失败');
      }

      // 2. 调后端登录接口
      const res: LoginRes = await request('/auth/wechat-login', {
        method: 'POST',
        data: {
          code: loginRes.code,
        },
      });

      if (!res.success) {
        throw new Error(res.error || '登录失败');
      }

      // 3. 存储登录信息
      Taro.setStorageSync('auth_token', res.token || '');
      Taro.setStorageSync('refresh_token', res.refresh_token || '');
      Taro.setStorageSync('user_info', JSON.stringify(res.user || {}));
      Taro.setStorageSync('wx_openid', res.openid || '');

      Taro.showToast({ title: '登录成功', icon: 'success' });

      // 4. 跳转回去
      const pages = Taro.getCurrentPages();
      if (pages.length > 1) {
        Taro.navigateBack();
      } else {
        Taro.switchTab({ url: '/pages/my/index' });
      }
    } catch (err: any) {
      console.error('微信登录失败', err);
      this.setState({ error: err.message || '登录失败，请重试' });
    } finally {
      this.setState({ loading: false });
    }
  };

  // 获取用户信息（授权昵称头像）
  handleGetUserInfo = async () => {
    try {
      const res: any = await new Promise((resolve, reject) => {
        // Taro 3.x 需要用 Taro.getUserProfile（需按钮触发）
        Taro.getUserProfile({
          desc: '用于完善用户资料',
          success: resolve,
          fail: reject,
        });
      });

      const { nickName, avatarUrl } = res.userInfo || {};
      if (nickName || avatarUrl) {
        // 更新到后端
        const token = Taro.getStorageSync('auth_token');
        if (token) {
          await request('/auth/update-profile', {
            method: 'POST',
            data: { nickName, avatarUrl },
            header: { Authorization: `Bearer ${token}` },
          });
        }
      }
    } catch (err) {
      console.log('获取用户信息失败（用户拒绝）', err);
    }
  };

  render() {
    const { loading, error } = this.state;

    return (
      <View style={{
        minHeight: '100vh',
        backgroundColor: '#2d1b2e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
      }}>
        {/* Logo */}
        <View style={{
          width: 80, height: 80, borderRadius: 20,
          backgroundColor: '#fff', marginBottom: 24,
          justifyContent: 'center', alignItems: 'center',
        }}>
          <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#2d1b2e' }}>骆</Text>
        </View>

        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 }}>
          骆芷蝶智选
        </Text>
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 48 }}>
          服装门店一站式赋能平台
        </Text>

        {/* 微信登录按钮 */}
        <View
          onClick={this.handleWechatLogin}
          style={{
            width: '100%',
            maxWidth: 300,
            paddingVertical: 14,
            backgroundColor: '#07c160',
            borderRadius: 25,
            alignItems: 'center',
            marginBottom: 16,
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
            {loading ? '登录中...' : '微信一键登录'}
          </Text>
        </View>

        {/* 错误提示 */}
        {error && (
          <View style={{
            marginTop: 16, paddingVertical: 8, paddingHorizontal: 16,
            backgroundColor: 'rgba(255,0,0,0.1)', borderRadius: 8,
          }}>
            <Text style={{ fontSize: 12, color: '#fca5a5' }}>{error}</Text>
          </View>
        )}

        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 32, textAlign: 'center' }}>
          登录即表示同意《用户协议》和《隐私政策》
        </Text>
      </View>
    );
  }
}
