import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import './index.scss';

interface ReportItem { id: string; title: string; created_at: string; status: string; }

export default function ReportsListPage() {
  const [list, setList] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await Taro.request({ url: 'https://colour-choice.art/api/reports/mine', method: 'GET' });
      setList(res.data || []);
    } catch (e) {
      // 离线兜底：从本地读
      const local = Taro.getStorageSync('ai_reports') || [];
      setList(local);
    }
    setLoading(false);
  };

  const goDetail = (item: ReportItem) => {
    Taro.navigateTo({ url: `/pages/reports/detail/index?id=${item.id}` });
  };

  return (
    <View className='page'>
      <View className='header'>
        <Text className='header-title'>我的报告</Text>
      </View>

      {loading ? (
        <View className='empty'>加载中...</View>
      ) : list.length === 0 ? (
        <View className='empty'>
          <Text className='empty-icon'>📊</Text>
          <Text className='empty-text'>暂无报告</Text>
          <View className='empty-btn' onClick={() => Taro.switchTab({ url: '/pages/planning/index/index' })}>
            <Text>去生成报告</Text>
          </View>
        </View>
      ) : (
        <ScrollView className='list'>
          {list.map(item => (
            <View key={item.id} className='report-card' onClick={() => goDetail(item)}>
              <Text className='report-title'>{item.title}</Text>
              <Text className='report-date'>{item.created_at}</Text>
              <Text className='report-arrow'>›</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
