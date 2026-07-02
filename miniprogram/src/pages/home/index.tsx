import { Component } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import { getBlocks, getPromotions, getProducts } from '../../services/api';
import Taro from '@tarojs/taro';

export default class HomePage extends Component {
  state = {
    blocks: [],
    promotions: [],
    hotProducts: [],
    loading: true,
  };

  componentDidMount() {
    this.loadData();
  }

  async loadData() {
    try {
      const [blocksRes, promosRes, productsRes] = await Promise.all([
        getBlocks(),
        getPromotions(4),
        getProducts({ limit: 6 }),
      ]);
      this.setState({
        blocks: blocksRes.data || [],
        promotions: (promosRes.data || []).filter(p => p.status === 'active'),
        hotProducts: (productsRes.data || []).slice(0, 6),
        loading: false,
      });
    } catch (err) {
      console.error('首页数据加载失败', err);
      this.setState({ loading: false });
    }
  }

  render() {
    const { blocks, promotions, hotProducts, loading } = this.state;

    return (
      <ScrollView scrollY className="page-home" style={{ backgroundColor: '#f8f7f4', height: '100vh' }}>
        {/* ====== Hero 区域 ====== */}
        <View style={styles.hero}>
          {/* Logo + 标题 */}
          <View style={{ alignItems: 'center' }}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>骆</Text>
            </View>
            <Text style={styles.brandText}>CHOICETOB</Text>
          </View>

          {/* 主标题 */}
          <Text style={styles.heroTitle}>骆芷蝶供应链智选平台</Text>

          <Text style={styles.heroSubTitle}>服装门店一站式赋能平台</Text>

          {/* 搜索框 */}
          <View
            onClick={() => Taro.navigateTo({ url: '/pages/buyer/index' })}
            style={styles.searchBox}
          >
            <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>搜索商品名称...</Text>
            <View style={styles.searchBtn}>
              <Text style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>浏览选品</Text>
            </View>
          </View>

          {/* 分类标签 */}
          <ScrollView scrollX showScrollbar={false} style={{ marginTop: 20 }}>
            <View style={{ flexDirection: 'row', paddingRight: 20 }}>
              {['全部', '服装', '护肤', '彩妆', '养生', '食品', '配饰', '文创'].map((tag) => (
                <View key={tag} onClick={() => {
                  Taro.navigateTo({ url: `/pages/buyer/index?category=${tag}` });
                }} style={{
                  paddingVertical: 6,
                  paddingHorizontal: 14,
                  borderRadius: 20,
                  backgroundColor: tag === '全部' ? '#e89a5c33' : 'transparent',
                  borderWidth: 1,
                  borderColor: tag === '全部' ? '#e89a5c' : 'rgba(255,255,255,0.15)',
                  marginRight: 8,
                }}>
                  <Text style={{ fontSize: 11, color: tag === '全部' ? '#e89a5c' : 'rgba(255,255,255,0.7)' }}>{tag}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* ====== 功能入口 ====== */}
        <View style={styles.funcBox}>
          {[
            { icon: '🛍️', label: '买手选品', url: '/pages/buyer/index' },
            { icon: '📚', label: '线上课程', url: '/pages/courses/index' },
            { icon: '🎨', label: '每日搭配', url: '/pages/daily-looks/index' },
            { icon: '👑', label: 'VIP会员', url: '/pages/my/index' },
          ].map(item => (
            <View key={item.label} onClick={() => Taro.navigateTo({ url: item.url })} style={{ flex: 1, alignItems: 'center' }}>
              <View style={styles.iconCircle}>
                <Text style={{ fontSize: 20 }}>{item.icon}</Text>
              </View>
              <Text style={{ fontSize: 11, color: '#666', marginTop: 6 }}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* 加载状态 */}
        {loading && (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <Text style={{ color: '#999', fontSize: 14 }}>加载中...</Text>
          </View>
        )}

        {/* 版块区域 */}
        {!loading && blocks.length > 0 && (
          <View style={{ marginTop: 16 }}>
            {blocks.map(block => (
              <BlockRenderer key={block.id} block={block} />
            ))}
          </View>
        )}

        {/* 热门商品 */}
        {!loading && hotProducts.length > 0 && (
          <View style={styles.sectionBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2d1b2e' }}>🔥 热门选品</Text>
              <Text onClick={() => Taro.navigateTo({ url: '/pages/buyer/index' })} style={{ fontSize: 12, color: '#e89a5c' }}>查看更多 →</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {hotProducts.map(prod => (
                <View key={prod.id} onClick={() => Taro.navigateTo({ url: `/pages/shop/index?id=${prod.id}` })} style={styles.productCard}>
                  <Image
                    src={prod.image_url || prod.image || ''}
                    mode="aspectFill"
                    style={{ width: '100%', height: 140 }}
                  />
                  <View style={{ padding: 8 }}>
                    <Text style={{ fontSize: 12, color: '#333', fontWeight: 500 }} numberOfLines={2}>
                      {prod.name || prod.title || '商品'}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#e89a5c', fontWeight: 'bold', marginTop: 4 }}>
                      ¥{(prod.price || 0).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 营销活动 */}
        {!loading && promotions.length > 0 && (
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#2d1b2e', marginBottom: 12 }}>🎁 优惠活动</Text>
            <ScrollView scrollX showScrollbar={false}>
              <View style={{ flexDirection: 'row' }}>
                {promotions.map(promo => (
                  <View key={promo.id} onClick={() => {
                    if (promo.link_url) Taro.navigateTo({ url: promo.link_url });
                  }} style={styles.promoCard}>
                    <Text style={{ fontSize: 13, fontWeight: 700, color: '#fff' }} numberOfLines={1}>{promo.title}</Text>
                    <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 }} numberOfLines={1}>{promo.description}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
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

/* ========== 样式常量 ========== */
const styles = {
  hero: {
    backgroundColor: '#2d1b2e',
    paddingTop: 50,
    paddingBottom: 30,
    paddingLeft: 20,
    paddingRight: 20,
  },
  logoBox: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#fff', marginBottom: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  logoText: {
    fontSize: 22, fontWeight: 'bold', color: '#2d1b2e',
  },
  brandText: {
    fontSize: 13, color: '#c4b5a8', letterSpacing: 2,
  },
  heroTitle: {
    fontSize: 26, fontWeight: 'bold', color: '#fff',
    textAlign: 'center', marginTop: 24,
    lineHeight: 36,
  },
  heroSubTitle: {
    fontSize: 13, color: 'rgba(255,255,255,0.6)',
    textAlign: 'center', marginTop: 8,
  },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 25,
    paddingVertical: 11, paddingHorizontal: 16,
    marginTop: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  searchBtn: {
    backgroundColor: '#e89a5c',
    borderRadius: 15, paddingVertical: 6, paddingHorizontal: 14,
    marginLeft: 10,
  },
  funcBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: -16,
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#f8f7f4',
    justifyContent: 'center', alignItems: 'center',
  },
  sectionBox: {
    padding: 20, backgroundColor: '#fff', marginTop: 12,
  },
  productCard: {
    width: '47%', backgroundColor: '#f8f7f4', borderRadius: 12,
    overflow: 'hidden', marginBottom: 10,
  },
  promoCard: {
    minWidth: 200, paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 12, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#e89a5c', marginRight: 10,
  },
};

/* ========== 版块渲染器 ========== */
function BlockRenderer(props) {
  const { block } = props;
  if (!block) return null;
  return (
    <View style={{ padding: 16, backgroundColor: '#fff', marginTop: 12, borderRadius: 12 }}>
      <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#333' }}>{block.title || ''}</Text>
      <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{block.type || ''}</Text>
    </View>
  );
}
