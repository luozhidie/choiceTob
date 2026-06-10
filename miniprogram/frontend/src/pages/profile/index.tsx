import { View, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

export default function ProfilePage() {
  const [reportCount, setReportCount] = useState(0);

  useEffect(() => {
    // 统计本地报告数量（从storage）
    try {
      const reports = Taro.getStorageSync('ai_reports') || [];
      setReportCount(reports.length);
    } catch (e) {}
  }, []);

  const menus = [
    { label: '我的报告', icon: '📊', url: '/pages/reports/list/index' },
    { label: '店铺管理', icon: '🏪', url: '' },
    { label: '消息通知', icon: '🔔', url: '' },
    { label: '操作手册', icon: '📖', url: '' },
    { label: '联系客服', icon: '💬', url: '' },
    { label: '关于我们', icon: 'ℹ️', url: '' },
  ];

  const handleMenu = (m) => {
    if (m.url) Taro.navigateTo({ url: m.url });
  };

  return (
    <View className='page'>
      <View className='user-card'>
        <View className='user-avatar'>骆</View>
        <View className='user-info'>
          <Text className='user-name'>骆芷蝶智选</Text>
          <Text className='user-role'>店铺管理员</Text>
        </View>
      </View>
      <View className='card menu-card'>
        {menus.map((m, i) => (
          <View key={i} className='menu-item' onClick={() => handleMenu(m)}>
            <Text className='menu-icon'>{m.icon}</Text>
            <Text className='menu-label'>{m.label}</Text>
            {m.label === '我的报告' && reportCount > 0 && (
              <View className='menu-badge'>{reportCount}</View>
            )}
            <Text className='menu-arrow'>›</Text>
          </View>
        ))}
      </View>
      <View className='version'>骆芷蝶智选 v1.0.0</View>
    </View>
  );
}
