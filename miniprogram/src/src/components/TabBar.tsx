import { Component } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';

interface TabBarProps {
  activeTab?: string;
}

const tabs = [
  { key: 'home', label: '首页', emoji: '🏠', path: '/pages/home/index' },
  { key: 'buyer', label: '选品', emoji: '🛍️', path: '/pages/buyer/index' },
  { key: 'cart', label: '购物车', emoji: '🛒', path: '/pages/cart/index' },
  { key: 'my', label: '我的', emoji: '👤', path: '/pages/my/index' },
];

export default class TabBar extends Component<TabBarProps> {
  handleTap(tab: typeof tabs[0]) {
    if (tab.key === (this.props.activeTab || 'home').replace('/pages/', '').split('/')[0]) return;
    Taro.switchTab({ url: tab.path });
  }

  render() {
    const { activeTab = 'home' } = this.props;
    const currentTab = activeTab.split('/')[0];

    return (
      <View style={{
        position: 'fixed', left: 0, right: 0,
        bottom: 0, zIndex: 999,
        backgroundColor: '#fff',
        borderTopWidth: 1, borderTopColor: '#e5e7eb',
        flexDirection: 'row',
        paddingVertical: 4, paddingBottom: 8,
      }}>
        {tabs.map(tab => {
          const isActive = currentTab.includes(tab.key) || (tab.key === 'home' && !activeTab);
          return (
            <View
              key={tab.key}
              onClick={() => this.handleTap(tab)}
              style={{
                flex: 1, alignItems: 'center', justifyContent: 'center',
                paddingTop: 6, paddingBottom: 2,
              }}
            >
              <Text style={{ fontSize: 18 }}>{tab.emoji}</Text>
              <Text style={{
                fontSize: 10, marginTop: 1,
                fontWeight: isActive ? '600' : '400',
                color: isActive ? '#2d1b2e' : '#999',
              }}>{tab.label}</Text>
            </View>
          );
        })}
      </View>
    );
  }
}
