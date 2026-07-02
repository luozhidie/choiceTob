import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';

export default function HomePage() {
  Taro.showToast({ title: '首页已加载', icon: 'success' });

  return (
    <View style={{ padding: 40 }}>
      <Text style={{ fontSize: 20, color: '#2d1b2e' }}>✅ 首页加载成功！</Text>
      <View style={{ marginTop: 20, padding: 20, backgroundColor: '#2d1b2e' }}>
        <Text style={{ color: '#fff', fontSize: 16 }}>深紫色背景测试</Text>
      </View>
      <View style={{ marginTop: 20, padding: 20, backgroundColor: '#e89a5c' }}>
        <Text style={{ color: '#fff', fontSize: 16 }}>橙色背景测试</Text>
      </View>
    </View>
  );
}
