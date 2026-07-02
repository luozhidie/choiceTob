import { Component } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import TabBar from '../../components/TabBar';
import Taro from '@tarojs/taro';

export default class MyPage extends Component {
  state = {
    userInfo: null,
    isLoggedIn: false,
  };

  componentDidMount() {
    // 检查登录状态
    try {
      const user = Taro.getStorageSync('user_info');
      if (user) {
        this.setState({ userInfo: user, isLoggedIn: true });
      }
    } catch {}
  }

  handleLogout = () => {
    Taro.clearStorageSync();
    this.setState({ userInfo: null, isLoggedIn: false });
    Taro.showToast({ title: '已退出登录', icon: 'success' });
  };

  handleLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' });
  };

  render() {
    const { isLoggedIn, userInfo } = this.state;

    return (
      <ScrollView scrollY style={{ backgroundColor: '#f8f7f4', minHeight: '100vh' }}>
        {/* ====== 头部用户信息 ====== */}
        <View style={{
          background: 'linear-gradient(135deg, #2d1b2e 0%, #1a0a1e 100%)',
          paddingTop: 50,
          paddingBottom: 40,
          paddingLeft: 20,
          paddingRight: 20,
          alignItems: 'center',
        }}>
          <View style={{
            width: 64, height: 64, borderRadius: 32,
            backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
          }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#2d1b2e' }}>骆</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', marginTop: 12 }}>
            {isLoggedIn ? (userInfo?.nickname || '会员用户') : '未登录'}
          </Text>
          <Text style={{ fontSize: 12, color: '#c4b5a8', marginTop: 4 }}>
            {isLoggedIn ? 'VIP会员 · 享受专属折扣' : '登录后享受会员权益'}
          </Text>
          {!isLoggedIn && (
            <View
              onClick={this.handleLogin}
              style={{
                marginTop: 16, paddingVertical: 8, paddingHorizontal: 24,
                backgroundColor: '#e89a5c', borderRadius: 20,
              }}
            >
              <Text style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>登录 / 注册</Text>
            </View>
          )}
        </View>

        {/* ====== 会员入口 ====== */}
        <View style={{ marginHorizontal: 16, marginTop: -20, marginBottom: 12 }}>
          <View
            onClick={() => Taro.navigateTo({ url: '/pages/vip/index' })}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 10,
              backgroundColor: '#fff', borderRadius: 14,
              paddingVertical: 16, paddingHorizontal: 20,
              borderWidth: 1, borderColor: '#fef3c7',
            }}
          >
            <View style={{
              width: 40, height: 40, borderRadius: 20,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              justifyContent: 'center', alignItems: 'center',
            }}>
              <Text style={{ fontSize: 18 }}>👑</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#333' }}>VIP会员中心</Text>
              <Text style={{ fontSize: 11, color: '#999', marginTop: 2 }}>享专属折扣、优先发货</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#ccc' }}>›</Text>
          </View>
        </View>

        {/* ====== 订单入口 ====== */}
        <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
          <View style={{
            backgroundColor: '#fff', borderRadius: 14,
            overflow: 'hidden',
          }}>
            {[
              { label: '我的订单', icon: '📋', url: '/pages/orders/index' },
              { label: '收货地址', icon: '📍', url: '/pages/address/index' },
              { label: '我的积分', icon: '💎', url: '/pages/points/index' },
            ].map((item, i) => (
              <View
                key={item.label}
                onClick={() => Taro.navigateTo({ url: item.url })}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingVertical: 14, paddingHorizontal: 20,
                  borderBottomWidth: i < 2 ? 1 : 0,
                  borderBottomColor: '#f0f0f0',
                }}
              >
                <Text style={{ fontSize: 16, marginRight: 10 }}>{item.icon}</Text>
                <Text style={{ fontSize: 13, color: '#333', flex: 1 }}>{item.label}</Text>
                <Text style={{ fontSize: 12, color: '#ccc' }}>›</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ====== 功能入口 ====== */}
        <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
          <View style={{
            backgroundColor: '#fff', borderRadius: 14,
            overflow: 'hidden',
          }}>
            {[
              { label: '每日穿搭', icon: '🎨', url: '/pages/daily-looks/index' },
              { label: '课程商城', icon: '📚', url: '/pages/courses/index' },
              { label: '风格测试', icon: '✨', url: '/pages/style-test/index' },
              { label: '联系客服', icon: '💬', action: 'contact' },
            ].map((item, i) => (
              <View
                key={item.label}
                onClick={() => {
                  if (item.action === 'contact') {
                    // 微信小程序：打开客服对话
                    if (process.env.TARO_ENV === 'weapp') {
                      // 需要按钮触发，这里用 showModal 替代
                      Taro.showModal({ title: '联系客服', content: '请添加微信：luozhidie' });
                    } else {
                      Taro.navigateTo({ url: '/pages/contact/index' });
                    }
                  } else {
                    Taro.navigateTo({ url: item.url });
                  }
                }}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingVertical: 14, paddingHorizontal: 20,
                  borderBottomWidth: i < 3 ? 1 : 0,
                  borderBottomColor: '#f0f0f0',
                }}
              >
                <Text style={{ fontSize: 16, marginRight: 10 }}>{item.icon}</Text>
                <Text style={{ fontSize: 13, color: '#333', flex: 1 }}>{item.label}</Text>
                <Text style={{ fontSize: 12, color: '#ccc' }}>›</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ====== 退出登录 ====== */}
        {isLoggedIn && (
          <View style={{ marginHorizontal: 16, marginBottom: 100 }}>
            <View
              onClick={this.handleLogout}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                backgroundColor: '#fff', borderRadius: 14,
                paddingVertical: 14,
                borderWidth: 1, borderColor: '#fee2e2',
              }}
            >
              <Text style={{ fontSize: 14, color: '#ef4444', fontWeight: 500 }}>退出登录</Text>
            </View>
          </View>
        )}

        {!isLoggedIn && (
          <View style={{ height: 100 }} />
        )}

        <TabBar activeTab="my" />
      </ScrollView>
    );
  }
}
