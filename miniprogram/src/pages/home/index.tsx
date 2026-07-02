import { Component } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './index.scss';

export default class HomePage extends Component {
  state = {
    loaded: false,
    products: [],
  };

  componentDidMount() {
    this.setState({ loaded: true });
    this.fetchData();
  }

  async fetchData() {
    try {
      const res = await Taro.request({
        url: 'https://colour-choice.art/api/public/products?limit=6',
        method: 'GET',
        header: { 'Content-Type': 'application/json' },
      });
      const list = res.data && res.data.data ? res.data.data : [];
      this.setState({ products: list });
    } catch (e) {}
  }

  render() {
    const { loaded, products } = this.state;
    return (
      <View className="home-page">
        {/* Hero 区域 */}
        <View className="hero">
          <Text className="hero-title">骆芷蝶供应链</Text>
          <Text className="hero-sub">服装门店一站式赋能平台</Text>
          <View className="search-bar" onClick={() => Taro.navigateTo({ url: '/pages/buyer/index' })}>
            <Text>🔍 搜索商品...</Text>
          </View>
          <View className="tags-row">
            {['全部', '服装', '护肤', '彩妆'].map(tag => (
              <View key={tag} className="tag-item"><Text>{tag}</Text></View>
            ))}
          </View>
        </View>

        {/* 功能入口 */}
        <View className="func-row">
          <View className="func-item" onClick={() => Taro.navigateTo({ url: '/pages/buyer/index' })}>
            <Text className="func-icon">🛍️</Text>
            <Text className="func-label">买手选品</Text>
          </View>
          <View className="func-item" onClick={() => Taro.navigateTo({ url: '/pages/courses/index' })}>
            <Text className="func-icon">📚</Text>
            <Text className="func-label">线上课程</Text>
          </View>
          <View className="func-item" onClick={() => Taro.navigateTo({ url: '/pages/daily-looks/index' })}>
            <Text className="func-icon">🎨</Text>
            <Text className="func-label">每日搭配</Text>
          </View>
          <View className="func-item" onClick={() => Taro.navigateTo({ url: '/pages/my/index' })}>
            <Text className="func-icon">👑</Text>
            <Text className="func-label">VIP会员</Text>
          </View>
        </View>

        {/* 商品列表 */}
        <View className="section">
          <Text className="section-title">🔥 热门选品</Text>
          <View className="product-grid">
            {products.length > 0 ? products.map(prod => (
              <View key={prod.id} className="product-card" onClick={() => Taro.navigateTo({ url: '/pages/shop/index?id=' + prod.id })}>
                {(prod.image_url || prod.cover_image) ? (
                  <Image src={prod.image_url || prod.cover_image} mode="aspectFill" className="product-img" />
                ) : (
                  <View className="product-img-placeholder" />
                )}
                <View className="product-info">
                  <Text numberOfLines={2} className="product-name">{prod.name || prod.title || '商品'}</Text>
                  <Text className="product-price">¥{Number(prod.price || 0).toFixed(2)}</Text>
                </View>
              </View>
            )) : (
              <View className="empty-hint">
                <Text style={{ fontSize: 30 }}>📦</Text>
                <Text style={{ color: '#999', fontSize: 13, marginTop: 10 }}>暂无商品数据</Text>
              </View>
            )}
          </View>
        </View>

        {/* 底部 */}
        <View style={{ padding: 40, alignItems: 'center', paddingBottom: 80 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2d1b2e' }}>爆款选品 · 拿货精选</Text>
          <Text style={{ fontSize: 12, color: '#888', marginTop: 6 }}>骆芷蝶智选 · 专业推荐</Text>
        </View>
      </View>
    );
  }
}
