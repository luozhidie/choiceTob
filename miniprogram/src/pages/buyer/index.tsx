import { Component } from 'react';
import { View, Text, Image, ScrollView, Input } from '@tarojs/components';
import { getBlocks, getPromotions, getProducts } from '../../services/api';
import Taro from '@tarojs/taro';

/* ========== 买手选品页 ========== */
export default class BuyerPage extends Component {
  state = {
    blocks: [],
    promotions: [],
    products: [],
    loading: true,
    keyword: '',
    activeCategory: '全部',
    activeStyle: '',
    activeColor: '',
    categories: ['全部', '平台自营', '供应商货源', '穿搭', '服装', '配饰'],
    styles: ['淑女风', '知性风', '名媛风', '中性风', '潮牌风', '职业风'],
    colors: ['深色系', '浅色系', '冷色系', '暖色系'],
  };

  componentDidMount() {
    this.loadData();
  }

  async loadData() {
    try {
      const [blocksRes, promosRes, prodsRes] = await Promise.all([
        getBlocks(),
        getPromotions(4),
        getProducts({ limit: 20 }),
      ]);
      this.setState({
        blocks: (blocksRes.data || []).filter(b => (b.content || {}).position === 'buyer_page'),
        promotions: (promosRes.data || []).filter(p => p.status === 'active'),
        products: prodsRes.data || [],
        loading: false,
      });
    } catch (err) {
      console.error('买手页数据加载失败', err);
      this.setState({ loading: false });
    }
  }

  // 处理搜索
  onSearch = () => {
    const { keyword } = this.state;
    if (!keyword) return;
    Taro.navigateTo({ url: `/pages/buyer/index?search=${encodeURIComponent(keyword)}` });
  };

  // 筛选商品
  getFilteredProducts() {
    const { products, activeCategory, activeStyle, activeColor } = this.state;
    return products.filter((p: any) => {
      if (activeCategory !== '全部' && p.category !== activeCategory) return false;
      if (activeStyle && p.style !== activeStyle) return false;
      if (activeColor && p.color_family !== activeColor) return false;
      return true;
    });
  }

  render() {
    const { blocks, promotions, loading, keyword, activeCategory, activeStyle, activeColor } = this.state;
    const filteredProducts = this.getFilteredProducts();

    return (
      <ScrollView scrollY style={{ backgroundColor: '#f8f7f4', minHeight: '100vh' }}>
        {/* ====== 头部 ====== */}
        <View style={{
          background: '#2d1b2e',
          paddingTop: 50,
          paddingBottom: 16,
          paddingLeft: 20,
          paddingRight: 20,
        }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff' }}>买手选品</Text>
          <Text style={{ fontSize: 12, color: '#c4b5a8', marginTop: 4 }}>
            精选优质货源，按风格、色彩季型精准筛选
          </Text>

          {/* 搜索框 */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 25,
            paddingVertical: 10, paddingHorizontal: 16,
            marginTop: 16,
          }}>
            <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
            <Input
              placeholder="搜索商品名称、描述..."
              value={keyword}
              onInput={(e: any) => this.setState({ keyword: e.detail.value })}
              onConfirm={this.onSearch}
              style={{ flex: 1, fontSize: 13, color: '#fff' }}
              placeholderStyle={{ color: 'rgba(255,255,255,0.3)' }}
            />
          </View>
        </View>

        {/* ====== 分类标签 ====== */}
        <ScrollView scrollX showScrollbar={false} style={{ backgroundColor: '#fff', paddingVertical: 10, paddingLeft: 16 }}>
          <View style={{ flexDirection: 'row' }}>
            {this.state.categories.map(cat => (
              <View
                key={cat}
                onClick={() => this.setState({ activeCategory: cat })}
                style={{
                  paddingVertical: 6, paddingHorizontal: 14,
                  borderRadius: 20, marginRight: 8,
                  backgroundColor: activeCategory === cat ? '#2d1b2e' : '#f5f5f5',
                }}
              >
                <Text style={{
                  fontSize: 11, fontWeight: activeCategory === cat ? '600' : '400',
                  color: activeCategory === cat ? '#fff' : '#666',
                }}>{cat}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* ====== 营销活动横幅 ====== */}
        {promotions.length > 0 && (
          <View style={{ padding: 16, backgroundColor: '#fff', marginTop: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 10 }}>🎁 优惠活动</Text>
            <ScrollView scrollX showScrollbar={false}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {promotions.map((promo: any) => (
                  <View
                    key={promo.id}
                    onClick={() => {
                      if (promo.link_url) Taro.navigateTo({ url: promo.link_url });
                    }}
                    style={{
                      minWidth: 200, paddingVertical: 12, paddingHorizontal: 16,
                      borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8,
                      backgroundColor:
                        promo.promo_type === 'flash_sale' ? '#ef4444' :
                        promo.promo_type === 'new_user' ? '#f59e0b' :
                        promo.promo_type === 'invite' ? '#10b981' :
                        promo.promo_type === 'vip_exclusive' ? '#ec4899' :
                        promo.promo_type === 'brand_collab' ? '#06b6d4' :
                        promo.promo_type === 'clearance' ? '#6b7280' :
                        '#8b5cf6',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: 700, color: '#fff' }} numberOfLines={1}>
                        {promo.title}
                      </Text>
                      <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }} numberOfLines={1}>
                        {promo.description}
                      </Text>
                    </View>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>→</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ====== 风格筛选 ====== */}
        <View style={{ backgroundColor: '#fff', marginTop: 8, padding: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>✨ 风格</Text>
          <ScrollView scrollX showScrollbar={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {this.state.styles.map(s => (
                <View
                  key={s}
                  onClick={() => this.setState({ activeStyle: activeStyle === s ? '' : s })}
                  style={{
                    paddingVertical: 5, paddingHorizontal: 12,
                    borderRadius: 16,
                    backgroundColor: activeStyle === s ? '#2d1b2e' : '#f5f5f5',
                  }}
                >
                  <Text style={{ fontSize: 11, color: activeStyle === s ? '#fff' : '#666' }}>{s}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* ====== 色系筛选 ====== */}
        <View style={{ backgroundColor: '#fff', marginTop: 1, padding: 16, paddingTop: 0 }}>
          <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 12 }}>🎨 色系</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {this.state.colors.map(c => (
              <View
                key={c}
                onClick={() => this.setState({ activeColor: activeColor === c ? '' : c })}
                style={{
                  paddingVertical: 6, paddingHorizontal: 14,
                  borderRadius: 16,
                  backgroundColor: activeColor === c ? '#2d1b2e' : '#f5f5f5',
                }}
              >
                <Text style={{ fontSize: 11, color: activeColor === c ? '#fff' : '#666' }}>{c}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ====== 商品列表 ====== */}
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#333' }}>
              商品列表 ({filteredProducts.length})
            </Text>
            {(activeCategory !== '全部' || activeStyle || activeColor) && (
              <Text onClick={() => this.setState({ activeCategory: '全部', activeStyle: '', activeColor: '' })} style={{ fontSize: 12, color: '#e89a5c' }}>
                清除筛选
              </Text>
            )}
          </View>

          {loading ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <Text style={{ color: '#999', fontSize: 14 }}>加载中...</Text>
            </View>
          ) : filteredProducts.length === 0 ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <Text style={{ fontSize: 28 }}>📦</Text>
              <Text style={{ color: '#999', marginTop: 8, fontSize: 13 }}>暂无商品</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'column', gap: 12 }}>
              {filteredProducts.map((p: any, idx: number) => (
                <View
                  key={p.id || idx}
                  onClick={() => Taro.navigateTo({ url: `/pages/shop/index?id=${p.id}` })}
                  style={{
                    flexDirection: 'row', backgroundColor: '#fff',
                    borderRadius: 12, padding: 12,
                    borderWidth: 1, borderColor: '#f0f0f0',
                  }}
                >
                  <Image
                    src={p.image_url || p.image || ''}
                    mode="aspectFill"
                    style={{ width: 90, height: 90, borderRadius: 8, backgroundColor: '#f3f4f6' }}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 13, fontWeight: 600, color: '#333' }} numberOfLines={2}>
                      {p.name || p.title || '商品标题'}
                    </Text>
                    {p.color_family && (
                      <Text style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{p.color_family}</Text>
                    )}
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#e89a5c', marginTop: 6 }}>
                      ¥{(p.price || 0).toFixed(2)}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <View style={{
                        paddingVertical: 4, paddingHorizontal: 10,
                        borderRadius: 10, borderWidth: 1, borderColor: '#e89a5c', backgroundColor: '#fff8f0',
                      }}>
                        <Text style={{ fontSize: 10, color: '#e89a5c', fontWeight: 600 }}>加入购物车</Text>
                      </View>
                      <View style={{
                        paddingVertical: 5, paddingHorizontal: 12,
                        borderRadius: 10, backgroundColor: '#2d1b2e',
                      }}>
                        <Text style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>立即拿货</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 底部留白给 TabBar */}
        <View style={{ height: 80 }} />
      </ScrollView>
    );
  }
}
