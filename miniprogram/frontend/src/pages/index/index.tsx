import { View, Text, ScrollView } from '@tarojs/components';
import { useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

interface StoreInfo { id: string; name: string; }
interface DashboardStats {
  vipCount: number; inventoryValue: number; lowStockCount: number;
  pendingOrders: number; todaySales: number; monthSales: number;
}

export default function IndexPage() {
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [currentStore, setCurrentStore] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    vipCount: 0, inventoryValue: 0, lowStockCount: 0,
    pendingOrders: 0, todaySales: 0, monthSales: 0,
  });

  useEffect(() => {
    // 临时模拟数据 - 后续对接真实API
    setStores([{ id: '1', name: '骆芷蝶旗舰店' }, { id: '2', name: '分店' }]);
    setCurrentStore('1');
    setStats({ vipCount: 126, inventoryValue: 385000, lowStockCount: 8, pendingOrders: 3, todaySales: 12800, monthSales: 256000 });
  }, []);

  const quickActions = [
    { label: 'VIP录入', icon: '👤', path: '/pages/vip/list/index' },
    { label: '新建采购', icon: '📦', path: '/pages/inventory/purchase/index' },
    { label: '销售录入', icon: '💰', path: '/pages/inventory/sales/index' },
    { label: 'AI企划', icon: '✨', path: '/pages/planning/index/index' },
  ];

  return (
    <View className='page'>
      {/* 顶部店铺选择 */}
      <View className='store-header'>
        <View className='store-selector' onClick={() => {
          const names = stores.map(s => s.name);
          Taro.showActionSheet({ itemList: names }).then(res => {
            setCurrentStore(stores[res.tapIndex].id);
          });
        }}>
          <Text className='store-name'>🏪 {stores.find(s => s.id === currentStore)?.name || '选择店铺'}</Text>
          <Text className='store-arrow'>▼</Text>
        </View>
      </View>

      {/* 核心指标 */}
      <View className='card stats-grid'>
        <View className='stat-item'>
          <Text className='stat-value'>{stats.vipCount}</Text>
          <Text className='stat-label'>VIP客户</Text>
        </View>
        <View className='stat-item'>
          <Text className='stat-value'>¥{(stats.inventoryValue / 10000).toFixed(1)}万</Text>
          <Text className='stat-label'>库存价值</Text>
        </View>
        <View className='stat-item'>
          <Text className='stat-value danger'>{stats.lowStockCount}</Text>
          <Text className='stat-label'>低库存</Text>
        </View>
        <View className='stat-item'>
          <Text className='stat-value warning'>{stats.pendingOrders}</Text>
          <Text className='stat-label'>待收货</Text>
        </View>
      </View>

      {/* 今日/本月 */}
      <View className='card revenue-card'>
        <View className='revenue-row'>
          <View className='revenue-item'>
            <Text className='revenue-label'>今日营业额</Text>
            <Text className='revenue-value'>¥{stats.todaySales.toLocaleString()}</Text>
          </View>
          <View className='revenue-divider' />
          <View className='revenue-item'>
            <Text className='revenue-label'>本月营业额</Text>
            <Text className='revenue-value'>¥{stats.monthSales.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* 快捷操作 */}
      <View className='card'>
        <Text className='section-title'>快捷操作</Text>
        <View className='quick-actions'>
          {quickActions.map((a, i) => (
            <View key={i} className='action-item' onClick={() => Taro.switchTab({ url: a.path })}>
              <Text className='action-icon'>{a.icon}</Text>
              <Text className='action-label'>{a.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 待办提醒 */}
      <View className='card'>
        <Text className='section-title'>待办提醒</Text>
        <View className='todo-item'>
          <Text className='todo-dot warning' />
          <Text className='todo-text'>8款商品库存不足，建议补货</Text>
        </View>
        <View className='todo-item'>
          <Text className='todo-dot primary' />
          <Text className='todo-text'>3笔采购订单待收货</Text>
        </View>
        <View className='todo-item'>
          <Text className='todo-dot success' />
          <Text className='todo-text'>5位VIP客户本周生日</Text>
        </View>
      </View>
    </View>
  );
}
