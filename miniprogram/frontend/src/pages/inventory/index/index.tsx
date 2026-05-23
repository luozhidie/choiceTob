import { View, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

interface InventoryItem {
  id: string; sku_code: string; product_name: string; category: string;
  current_stock: number; sales_qty: number; status: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  normal: { label: '正常', color: '#07c160' },
  low_stock: { label: '低库存', color: '#fa9d3b' },
  out_of_stock: { label: '断货', color: '#e74c3c' },
  overstock: { label: '滞销', color: '#999' },
};

export default function InventoryPage() {
  const [tab, setTab] = useState<'inventory' | 'purchase' | 'sales'>('inventory');
  const [items, setItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    // 模拟数据，后续对接API
    setItems([
      { id: '1', sku_code: 'TX001', product_name: '真丝衬衫', category: '上衣', current_stock: 25, sales_qty: 18, status: 'normal' },
      { id: '2', sku_code: 'DY001', product_name: '羊绒大衣', category: '大衣', current_stock: 3, sales_qty: 12, status: 'low_stock' },
      { id: '3', sku_code: 'KZ001', product_name: '休闲裤', category: '裤装', current_stock: 0, sales_qty: 30, status: 'out_of_stock' },
      { id: '4', sku_code: 'LQ001', product_name: '碎花连衣裙', category: '裙装', current_stock: 45, sales_qty: 2, status: 'overstock' },
    ]);
  }, []);

  const tabs = [
    { key: 'inventory', label: '库存' },
    { key: 'purchase', label: '采购' },
    { key: 'sales', label: '销售' },
  ];

  return (
    <View className='page'>
      <View className='tab-bar'>
        {tabs.map(t => (
          <View key={t.key} className={`tab-item ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key as any)}>
            <Text className='tab-text'>{t.label}</Text>
          </View>
        ))}
      </View>

      {tab === 'inventory' && (
        <View>
          <View className='card stats-row'>
            <View className='stats-col'>
              <Text className='stats-num'>98</Text>
              <Text className='stats-label'>在库SKU</Text>
            </View>
            <View className='stats-col'>
              <Text className='stats-num danger'>8</Text>
              <Text className='stats-label'>低库存</Text>
            </View>
            <View className='stats-col'>
              <Text className='stats-num warning'>3</Text>
              <Text className='stats-label'>断货</Text>
            </View>
          </View>
          {items.map(item => {
            const st = STATUS_MAP[item.status] || STATUS_MAP.normal;
            return (
              <View key={item.id} className='card inventory-item'>
                <View className='item-header'>
                  <Text className='item-sku'>{item.sku_code}</Text>
                  <Text className='item-status' style={{ color: st.color, borderColor: st.color }}>{st.label}</Text>
                </View>
                <Text className='item-name'>{item.product_name}</Text>
                <View className='item-footer'>
                  <Text className='item-stock'>库存：{item.current_stock}</Text>
                  <Text className='item-sales'>已售：{item.sales_qty}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {tab === 'purchase' && (
        <View className='card'>
          <Text className='section-title'>采购订单</Text>
          <Text className='hint'>暂无采购订单</Text>
          <View className='btn-primary' onClick={() => Taro.navigateTo({ url: '/pages/inventory/purchase/index' })}>
            <Text className='btn-text'>+ 新建采购单</Text>
          </View>
        </View>
      )}

      {tab === 'sales' && (
        <View className='card'>
          <Text className='section-title'>销售录入</Text>
          <Text className='hint'>今日暂无销售记录</Text>
          <View className='btn-primary' onClick={() => Taro.navigateTo({ url: '/pages/inventory/sales/index' })}>
            <Text className='btn-text'>+ 录入销售</Text>
          </View>
        </View>
      )}
    </View>
  );
}
