import { Component } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';

export default class HomePage extends Component {
  state = {
    loading: true,
    products: [],
    msg: '',
  };

  componentDidMount() {
    console.log('=== HomePage mounted ===');
    this.loadData();
  }

  async loadData() {
    try {
      const res = await Taro.request({
        url: 'https://colour-choice.art/api/public/products?limit=6',
        method: 'GET',
        header: { 'Content-Type': 'application/json' },
      });
      console.log('API response:', JSON.stringify(res.data));
      const data = res.data && res.data.data ? res.data.data : [];
      this.setState({ loading: false, products: data });
    } catch (e) {
      console.error('loadData error:', e);
      this.setState({ loading: false, msg: e.message || '请求失败' });
    }
  }

  render() {
    const { loading, products, msg } = this.state;

    return (
      <ScrollView scrollY style={{ backgroundColor: '#f8f7f4', height: '100%' }}>
        {/* Hero */}
        <View style={{ backgroundColor: '#2d1b2e', paddingTop: 50, paddingBottom: 30, paddingLeft: 20, paddingRight: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#ffffff' }}>骆芷蝶供应链</Text>
          <Text style={{ fontSize: 13, color: '#c4b5a8', marginTop: 6 }}>服装门店一站式赋能平台</Text>

          {/* 搜索 */}
          <View
            onClick={() => Taro.navigateTo({ url: '/pages/buyer/index' })}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 25, paddingVertical: 11, paddingHorizontal: 16, marginTop: 24 }}
          >
            <Text style={{ fontSize: 14, color: '#fff' }}>🔍 搜索商品...</Text>
          </View>

          {/* 分类 */}
          <ScrollView scrollX style={{ marginTop: 20 }}>
            <View style={{ flexDirection: 'row' }}>
              {['全部', '服装', '护肤', '彩妆', '养生'].map(tag => (
                <View key={tag} style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginRight: 8 }}>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{tag}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 功能入口 */}
        <View style={{ flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, paddingVertical: 20, marginTop: -16 }}>
          <View onClick={() => Taro.navigateTo({ url: '/pages/buyer/index' })} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 28 }}>🛍️</Text>
            <Text style={{ fontSize: 11, color: '#666', marginTop: 6 }}>买手选品</Text>
          </View>
          <View onClick={() => Taro.navigateTo({ url: '/pages/courses/index' })} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 28 }}>📚</Text>
            <Text style={{ fontSize: 11, color: '#666', marginTop: 6 }}>线上课程</Text>
          </View>
          <View onClick={() => Taro.navigateTo({ url: '/pages/daily-looks/index' })} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 28 }}>🎨</Text>
            <Text style={{ fontSize: 11, color: '#666', marginTop: 6 }}>每日搭配</Text>
          </View>
          <View onClick={() => Taro.navigateTo({ url: '/pages/my/index' })} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 28 }}>👑</Text>
            <Text style={{ fontSize: 11, color: '#666', marginTop: 6 }}>VIP会员</Text>
          </View>
        </View>

        {/* 状态 / 商品列表 */}
        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center', backgroundColor: '#fff', marginTop: 16 }}>
            <Text style={{ color: '#999', fontSize: 14 }}>加载中...</Text>
          </View>
        ) : msg ? (
          <View style={{ paddingVertical: 60, alignItems: 'center', backgroundColor: '#fff', marginTop: 16 }}>
            <Text style={{ color: '#e89a5c', fontSize: 13 }}>{msg}</Text>
          </View>
        ) : (
          <View style={{ padding: 20, backgroundColor: '#fff', marginTop: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2d1b2e', marginBottom: 16 }}>🔥 热门选品</Text>

            {products.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {products.map(prod => (
                  <View key={prod.id} onClick={() => Taro.navigateTo({ url: `/pages/shop/index?id=${prod.id}` })} style={{ width: '47%', backgroundColor: '#f8f7f4', borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
                    {(prod.image_url || prod.cover_image) ? (
                      <Image src={prod.image_url || prod.cover_image} mode="aspectFill" style={{ width: '100%', height: 140 }} />
                    ) : (
                      <View style={{ width: '100%', height: 140, backgroundColor: '#e5e5e5' }} />
                    )}
                    <View style={{ padding: 8 }}>
                      <Text style={{ fontSize: 12, color: '#333' }} numberOfLines={2}>{prod.name || prod.title || '商品'}</Text>
                      <Text style={{ fontSize: 14, color: '#e89a5c', fontWeight: 'bold', marginTop: 4 }}>¥{Number(prod.price || 0).toFixed(2)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ fontSize: 30, marginBottom: 10 }}>📦</Text>
                <Text style={{ color: '#999', fontSize: 13 }}>暂无商品数据</Text>
              </View>
            )}
          </View>
        )}

        {/* 底部 */}
        <View style={{ padding: 40, alignItems: 'center', paddingBottom: 80 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2d1b2e' }}>爆款选品 · 拿货精选</Text>
          <Text style={{ fontSize: 12, color: '#888', marginTop: 6 }}>骆芷蝶智选 · 专业推荐</Text>
        </View>
      </ScrollView>
    );
  }
}
