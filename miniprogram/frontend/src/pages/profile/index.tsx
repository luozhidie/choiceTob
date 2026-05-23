import { View, Text } from '@tarojs/components';
import './index.scss';

export default function ProfilePage() {
  const menus = [
    { label: '店铺管理', icon: '🏪' },
    { label: '消息通知', icon: '🔔' },
    { label: '操作手册', icon: '📖' },
    { label: '联系客服', icon: '💬' },
    { label: '关于我们', icon: 'ℹ️' },
  ];

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
          <View key={i} className='menu-item'>
            <Text className='menu-icon'>{m.icon}</Text>
            <Text className='menu-label'>{m.label}</Text>
            <Text className='menu-arrow'>›</Text>
          </View>
        ))}
      </View>
      <View className='version'>骆芷蝶智选 v1.0.0</View>
    </View>
  );
}
