import { Component } from 'react';
import { View, Text, Image, Swiper, SwiperItem, ScrollView, Navigator } from '@tarojs/components';
import { getBlocks, getPromotions, getProducts } from '../../services/api';
import Taro from '@tarojs/taro';

/* ========== 首页 ========== */
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
        promotions: (promosRes.data || []).filter((p) => p.status === 'active'),
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
      <ScrollView scrollY className="page-home" style={{ backgroundColor: '#f8f7f4', minHeight: '100vh' }}>
        {/* ====== Hero 区域 ====== */}
        <View style={{
          background: 'linear-gradient(135deg, #2d1b2e 0%, #1a0a1e 50%, #3d2245 100%)',
          paddingTop: 60,
          paddingBottom: 30,
          paddingLeft: 20,
          paddingRight: 20,
        }}>
          {/* Logo + 标题 */}
          <View style={{ alignItems: 'center' }}>
            <View style={{
              width: 48, height: 48, borderRadius: 12,
              background: '#fff', marginBottom: 16,
              justifyContent: 'center', alignItems: 'center',
            }}>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#2d1b2e' }}>骆</Text>
            </View>
            <Text style={{ fontSize: 13, color: '#c4b5a8', marginTop: 6, letterSpacing: 2 }}>CHOICETOB</Text>
          </View>

          {/* 主标题 */}
          <Text style={{
            fontSize: 26, fontWeight: 'bold', color: '#fff',
            textAlign: 'center', marginTop: 24,
            lineHeight: '36px',
          }}>骆芷蝶供应链智选平台</Text>

          <Text style={{
            fontSize: 13, color: 'rgba(255,255,255,0.6)',
            textAlign: 'center', marginTop: 8,
          }}>服装门店一站式赋能平台</Text>

          {/* 搜索框 */}
          <View
            onClick={() => Taro.navigateTo({ url: '/pages/buyer/index' })}
            style={{
              display: 'flex', flexDirection: 'row', alignItems: 'center',
              background: 'rgba(255,255,255,0.12)', borderRadius: 25,
              paddingVertical: 11, paddingHorizontal: 16,
              marginTop: 24,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
            }}
          >
            <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', flex: 1 }}>搜索商品名称、描述...</Text>
            <View style={{
              background: 'linear-gradient(135deg, #e89a5c 0%, #d8a0c0 100%)',
              borderRadius: 15, paddingVertical: 6, paddingHorizontal: 14,
            }}>
              <Text style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>浏览选品</Text>
            </View>
          </View>

          {/* 分类标签 */}
          <ScrollView scrollX style={{ marginTop: 20, whiteSpace: 'nowrap' }} showScrollbar={false}>
            <View style={{ flexDirection: 'row', gap: 8, paddingRight: 20 }}>
              {['全部', '服装', '护肤', '彩妆', '养生', '食品', '配饰', '文创'].map((tag) => (
                <View key={tag} onClick={() => {
                  Taro.navigateTo({ url: `/pages/buyer/index?category=${tag}` });
                }} style={{
                  paddingVertical: 6, paddingHorizontal: 14,
                  borderRadius: 20,
                  backgroundColor: tag === '全部' ? 'rgba(232,154,84,0.25)' : 'transparent',
                  borderWidth: 1,
                  borderColor: tag === '全部' ? '#e89a5c' : 'rgba(255,255,255,0.15)',
                }}>
                  <Text style={{ fontSize: 11, color: tag === '全部' ? '#e89a5c' : 'rgba(255,255,255,0.7)' }}>{tag}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* ====== 功能入口 ====== */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: '#fff',
          marginTop: -16,
          marginHorizontal: 16,
          borderRadius: 16,
          paddingVertical: 20,
          paddingHorizontal: 10,
          boxShadow: '0 4px 20px rgba(45,27,46,0.08)',
          position: 'relative',
          zIndex: 10,
        }}>
          {[
            { icon: '🛍️', label: '买手选品', url: '/pages/buyer/index' },
            { icon: '📚', label: '线上课程', url: '/pages/courses/index' },
            { icon: '🎨', label: '每日搭配', url: '/pages/daily-looks/index' },
            { icon: '👑', label: 'VIP会员', url: '/pages/my/index' },
          ].map(item => (
            <View key={item.label} onClick={() => Taro.navigateTo({ url: item.url })} style={{
              flex: 1, alignItems: 'center', gap: 6,
            }}>
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: '#f8f7f4',
                justifyContent: 'center', alignItems: 'center',
              }}>
                <Text style={{ fontSize: 20 }}>{item.icon}</Text>
              </View>
              <Text style={{ fontSize: 11, color: '#666' }}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* ====== 版块区域（后台可配置）====== */}
        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <Text style={{ color: '#999', fontSize: 14 }}>加载中...</Text>
          </View>
        ) : (
          <View style={{ marginTop: 16 }}>
            {blocks.map((block) => (
              <BlockRenderer key={block.id} block={block} />
            ))}
          </View>
        )}

        {/* ====== 热门商品 ====== */}
        {!loading && hotProducts.length > 0 && (
          <View style={{ padding: 20, backgroundColor: '#fff', marginTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2d1b2e' }}>🔥 热门选品</Text>
              <Text onClick={() => Taro.navigateTo({ url: '/pages/buyer/index' })} style={{ fontSize: 12, color: '#e89a5c' }}>查看更多 →</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {hotProducts.map((prod) => (
                <View key={prod.id} onClick={() => Taro.navigateTo({ url: `/pages/shop/index?id=${prod.id}` })} style={{
                  width: '48%', backgroundColor: '#f8f7f4', borderRadius: 12, overflow: 'hidden',
                }}>
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

        {/* ====== 营销活动横幅 ====== */}
        {promotions.length > 0 && (
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#2d1b2e', marginBottom: 12 }}>🎁 优惠活动</Text>
            <ScrollView scrollX showScrollbar={false}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {promotions.map((promo) => (
                  <View key={promo.id} onClick={() => {
                    if (promo.link_url) Taro.navigateTo({ url: promo.link_url });
                  }} style={{
                    minWidth: 200, paddingVertical: 14, paddingHorizontal: 16,
                    borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10,
                    background:
                      promo.promo_type === 'flash_sale' ? 'linear-gradient(135deg, #ef4444, #ec4899)' :
                      promo.promo_type === 'new_user' ? 'linear-gradient(135deg, #f59e0b, #f97316)' :
                      promo.promo_type === 'invite' ? 'linear-gradient(135deg, #10b981, #14b8a6)' :
                      'linear-gradient(135deg, #8b5cf6, #6366f1)',
                  }}>
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: 700, color: '#fff' }} numberOfLines={1}>
                        {promo.title}
                      </Text>
                      <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 }} numberOfLines={1}>
                        {promo.description}
                      </Text>
                    </View>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginLeft: 'auto' }}>→</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ====== 底部 ====== */}
        <View style={{ padding: 40, alignItems: 'center', paddingBottom: 80 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2d1b2e' }}>
            爆款选品 · 拿货精选
          </Text>
          <Text style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
            骆芷蝶智选 · 专业推荐
          </Text>
        </View>
      </ScrollView>
    );
  }
}

/* ========== 版块渲染器 ========== */
function BlockRenderer({ block }: { block: any }) {
  const content = block.content || {};
  const style = block.style || {};
  const bg = style.bgColor || '#ffffff';

  switch (block.type) {
    case 'products':
      return <ProductBlock block={block} bg={bg} />;
    case 'featured_banner':
      return <FeaturedBannerBlock block={block} bg={bg} />;
    case 'group_buy':
      return <GroupBuyBlock block={block} />;
    case 'flash_sale':
      return <FlashSaleBlock block={block} />;
    case 'card_quad':
      return <CardQuadBlock block={block} bg={bg} />;
    case 'circle_row':
      return <CircleRowBlock block={block} bg={bg} />;
    case 'banner_large':
    case 'banner_small':
      return <BannerBlock block={block} bg={bg} />;
    case 'category_nav':
      return <CategoryNavBlock block={block} bg={bg} />;
    case 'card_single':
      return <CardSingleBlock block={block} bg={bg} />;
    default:
      return null;
  }
}

/* ========== 各版块组件 ========== */
function ProductBlock({ block, bg }: { block: any; bg: string }) {
  const products = (block.content || {}).products || [];
  return (
    <View style={{ padding: 20, backgroundColor: bg }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 16 }}>
        {block.title || '精选商品'}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {products.slice(0, 4).map((prod: any, i: number) => (
          <View key={prod.id || i} style={{
            width: '48%', backgroundColor: '#f8f7f4', borderRadius: 12, overflow: 'hidden',
          }}>
            <Image src={prod.image || ''} mode="aspectFill" style={{ width: '100%', height: 120 }} />
            <View style={{ padding: 8 }}>
              <Text style={{ fontSize: 12, color: '#333' }} numberOfLines={1}>{prod.name || '商品'}</Text>
              <Text style={{ fontSize: 13, color: '#e89a5c', fontWeight: 'bold', marginTop: 4 }}>
                ¥{(prod.price || 0).toFixed(2)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function FeaturedBannerBlock({ block, bg }: { block: any; bg: string }) {
  const c = block.content || {};
  return (
    <View style={{ padding: 20, backgroundColor: bg }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 }}>{block.title}</Text>
      {c.image && (
        <Image src={c.image} mode="aspectFill" style={{ width: '100%', height: 180, borderRadius: 12 }} />
      )}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        {(c.images || []).slice(0, 3).map((img: string, i: number) => (
          <Image key={i} src={img} mode="aspectFill" style={{ flex: 1, height: 70, borderRadius: 8 }} />
        ))}
      </View>
    </View>
  );
}

function GroupBuyBlock({ block }: { block: any }) {
  const c = block.content || {};
  return (
    <View style={{ margin: 16, padding: 20, backgroundColor: '#fef3c7', borderRadius: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 20, marginRight: 8 }}>👥</Text>
        <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#333' }}>{block.title}</Text>
      </View>
      <Text style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
        满{c.minPeople || 3}人成团，享受{Math.round((c.discount || 0.8) * 10)}折优惠
      </Text>
      <View onClick={() => Taro.navigateTo({ url: '/pages/buyer/index' })} style={{
        paddingVertical: 12, borderRadius: 10,
        background: 'linear-gradient(135deg, #f97316, #ef4444)',
        alignItems: 'center',
      }}>
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>立即参团拼单</Text>
      </View>
    </View>
  );
}

function FlashSaleBlock({ block }: { block: any }) {
  const c = block.content || {};
  return (
    <View style={{ margin: 16, padding: 20, backgroundColor: '#fef2f2', borderRadius: 12 }}>
      <View style={{
        position: 'absolute', top: 0, right: 0,
        paddingVertical: 4, paddingHorizontal: 10,
        backgroundColor: '#ef4444', borderBottomLeftRadius: 8,
      }}>
        <Text style={{ fontSize: 10, color: '#fff', fontWeight: 'bold' }}>⚡ 限量秒杀</Text>
      </View>
      <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>{block.title}</Text>
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#ef4444' }}>
            {Math.round((c.discount || 0.7) * 10)}
          </Text>
          <Text style={{ fontSize: 10, color: '#ef4444' }}>折起</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#dc2626' }}>
            {c.minPeople || 3}
          </Text>
          <Text style={{ fontSize: 10, color: '#dc2626' }}>人成团</Text>
        </View>
      </View>
      <View onClick={() => Taro.navigateTo({ url: '/pages/buyer/index' })} style={{
        paddingVertical: 12, borderRadius: 10,
        background: 'linear-gradient(135deg, #f97316, #ef4444)',
        alignItems: 'center',
      }}>
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>限时抢购</Text>
      </View>
    </View>
  );
}

function CardQuadBlock({ block, bg }: { block: any; bg: string }) {
  const cards = (block.content || {}).cards || [];
  return (
    <View style={{ padding: 20, backgroundColor: bg }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 }}>{block.title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {cards.map((card: any, i: number) => (
          <View key={i} style={{ width: '48%', backgroundColor: '#f8f7f4', borderRadius: 10, overflow: 'hidden' }}>
            {card.image && <Image src={card.image} mode="aspectFill" style={{ width: '100%', height: 80 }} />}
            <View style={{ padding: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: 600, color: '#333' }} numberOfLines={1}>{card.title || ''}</Text>
              <Text style={{ fontSize: 10, color: '#999', marginTop: 2 }} numberOfLines={1}>{card.subtitle || ''}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function CircleRowBlock({ block, bg }: { block: any; bg: string }) {
  const items = (block.content || {}).items || [];
  return (
    <View style={{ padding: 20, backgroundColor: bg }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 }}>{block.title}</Text>
      <ScrollView scrollX showScrollbar={false}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {items.map((item: any, i: number) => (
            <View key={i} style={{ alignItems: 'center', width: 70 }}>
              <Image src={item.image || ''} mode="aspectFill" style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#f3f4f6' }} />
              <Text style={{ fontSize: 11, color: '#333', marginTop: 6, textAlign: 'center' }} numberOfLines={1}>{item.label || ''}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function BannerBlock({ block, bg }: { block: any; bg: string }) {
  const c = block.content || {};
  return (
    <View style={{ padding: 20, backgroundColor: bg }}>
      {c.image && (
        <Image src={c.image} mode="aspectFill" style={{ width: '100%', height: block.type === 'banner_large' ? 200 : 120, borderRadius: 12 }} />
      )}
    </View>
  );
}

function CategoryNavBlock({ block, bg }: { block: any; bg: string }) {
  const cats = (block.content || {}).categories || [];
  return (
    <View style={{ padding: 20, backgroundColor: bg }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 }}>{block.title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {cats.map((cat: any, i: number) => (
          <View key={i} onClick={() => Taro.navigateTo({ url: `/pages/buyer/index?category=${cat.name}` })} style={{
            paddingVertical: 8, paddingHorizontal: 16,
            backgroundColor: '#f8f7f4', borderRadius: 20,
          }}>
            <Text style={{ fontSize: 12, color: '#333' }}>{cat.name || ''}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function CardSingleBlock({ block, bg }: { block: any; bg: string }) {
  const c = block.content || {};
  return (
    <View style={{ padding: 20, backgroundColor: bg }}>
      <View onClick={() => {
        if (c.link) Taro.navigateTo({ url: c.link });
      }} style={{
        borderRadius: 12, overflow: 'hidden',
        backgroundColor: c.bgColor || '#2d1b2e',
        padding: 20,
      }}>
        {c.image && <Image src={c.image} mode="aspectFill" style={{ width: '100%', height: 140, borderRadius: 8 }} />}
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', marginTop: 12 }}>{block.title}</Text>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{c.subtitle || ''}</Text>
      </View>
    </View>
  );
}
