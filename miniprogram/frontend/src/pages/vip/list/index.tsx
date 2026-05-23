import { View, Text, Input } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

interface VipCustomer {
  id: string; name: string; phone: string; color_season: string;
  main_style: string; vip_level: string; last_visit: string;
}

export default function VipListPage() {
  const [keyword, setKeyword] = useState('');
  const [customers, setCustomers] = useState<VipCustomer[]>([]);
  const [filtered, setFiltered] = useState<VipCustomer[]>([]);

  useEffect(() => {
    // 模拟数据
    const mock: VipCustomer[] = [
      { id: '1', name: '张女士', phone: '138****1234', color_season: '深暖型', main_style: '古典偏浪漫', vip_level: '钻石卡', last_visit: '2026-05-20' },
      { id: '2', name: '李女士', phone: '139****5678', color_season: '浅冷型', main_style: '优雅偏少女', vip_level: '金卡', last_visit: '2026-05-18' },
      { id: '3', name: '王女士', phone: '136****9012', color_season: '暖亮型', main_style: '自然偏少年', vip_level: '银卡', last_visit: '2026-05-15' },
    ];
    setCustomers(mock);
    setFiltered(mock);
  }, []);

  useEffect(() => {
    if (!keyword) { setFiltered(customers); return; }
    setFiltered(customers.filter(c => c.name.includes(keyword) || c.phone.includes(keyword)));
  }, [keyword, customers]);

  return (
    <View className='page'>
      {/* 搜索栏 */}
      <View className='search-bar'>
        <Input className='search-input' placeholder='搜索客户姓名/手机号' value={keyword} onInput={e => setKeyword(e.detail.value)} />
      </View>

      {/* 统计 */}
      <View className='card stats-bar'>
        <View className='stats-item'>
          <Text className='stats-num'>{customers.length}</Text>
          <Text className='stats-label'>总VIP</Text>
        </View>
        <View className='stats-item'>
          <Text className='stats-num'>86</Text>
          <Text className='stats-label'>已测色</Text>
        </View>
        <View className='stats-item'>
          <Text className='stats-num'>72</Text>
          <Text className='stats-label'>已测风格</Text>
        </View>
      </View>

      {/* 客户列表 */}
      <View className='customer-list'>
        {filtered.map(c => (
          <View key={c.id} className='card customer-item' onClick={() => Taro.navigateTo({ url: `/pages/vip/detail/index?id=${c.id}` })}>
            <View className='customer-avatar'>{c.name[0]}</View>
            <View className='customer-info'>
              <View className='customer-name-row'>
                <Text className='customer-name'>{c.name}</Text>
                <Text className='customer-level'>{c.vip_level}</Text>
              </View>
              <Text className='customer-meta'>{c.color_season} · {c.main_style}</Text>
              <Text className='customer-meta'>最近到店：{c.last_visit}</Text>
            </View>
            <Text className='customer-arrow'>›</Text>
          </View>
        ))}
      </View>

      {/* 添加按钮 */}
      <View className='fab' onClick={() => Taro.navigateTo({ url: '/pages/vip/detail/index?mode=add' })}>
        <Text className='fab-text'>+</Text>
      </View>
    </View>
  );
}
