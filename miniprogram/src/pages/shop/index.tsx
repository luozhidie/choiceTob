import { Component } from 'react';
import { View, Text, Image, ScrollView, Swiper, SwiperItem } from '@tarojs/components';
import { getProduct, getProducts } from '../../services/api';
import TabBar from '../../components/TabBar';
import Taro from '@tarojs/taro';

export default class ShopPage extends Component {
  state = {
    product: null,
    relatedProducts: [],
    loading: true,
    quantity: 1,
    activeImg: 0,
  };

  componentDidMount() {
    const { id } = this.props.params || {};
    if (id) this.loadProduct(id);
  }

  async loadProduct(id: string) {
    try {
      const res = await getProduct(id);
      const product = res.data || null;
      this.setState({ product, loading: false });

      // 加载相关商品
      const relRes = await getProducts({ category: product?.category, limit: 6 });
      this.setState({ relatedProducts: (relRes.data || []).filter((p: any) => p.id !== id) });
    } catch {
      this.setState({ loading: false });
    }
  }

  addToCart = () => {
    const { product, quantity } = this.state;
    if (!product) return;
    try {
      const cart = JSON.parse(Taro.getStorageSync('lzdzhixuan_cart') || '[]');
      const existIdx = cart.findIndex((item: any) => item.id === product.id);
      if (existIdx >= 0) {
        cart[existIdx].quantity += quantity;
      } else {
        cart.push({
          id: product.id,
          title: product.name || product.title,
          price: product.price,
          image: product.image_url || product.image,
          quantity,
        });
      }
      Taro.setStorageSync('lzdzhixuan_cart', JSON.stringify(cart));
      Taro.showToast({ title: '已加入购物车', icon: 'success' });
    } catch (err) {
      Taro.showToast({ title: '加入失败', icon: 'none' });
    }
  };

  buyNow = () => {
    Taro.showToast({ title: '结算功能开发中', icon: 'none' });
  };

  render() {
    const { product, relatedProducts, loading, quantity, activeImg } = this.state;

    if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 }}>
          <Text style={{ color: '#999' }}>加载中...</Text>
        </View>
      );
    }

    if (!product) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 }}>
          <Text style={{ fontSize: 28 }}>😕</Text>
          <Text style={{ color: '#999', marginTop: 8 }}>商品不存在</Text>
        </View>
      );
    }

    const images = [product.image_url || product.image, product.image2, product.image3].filter(Boolean);
    const displayPrice = product.price || 0;

    return (
      <View style={{ backgroundColor: '#f8f7f4', minHeight: '100vh', paddingBottom: 60 }}>
        <ScrollView scrollY style={{ minHeight: '100vh' }}>
          {/* 轮播图 */}
          <Swiper
            indicatorDots
            indicatorColor="rgba(0,0,0,0.2)"
            indicatorActiveColor="#e89a5c"
            style={{ width: '100%', height: 350 }}
            current={activeImg}
            onChange={(e: any) => this.setState({ activeImg: e.detail.current })}
          >
            {(images.length > 0 ? images : ['']).map((img: string, i: number) => (
              <SwiperItem key={i}>
                <View style={{ width: '100%', height: 350, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' }}>
                  {img ? (
                    <Image src={img} mode="aspectFill" style={{ width: '100%', height: 350 }} />
                  ) : (
                    <Text style={{ fontSize: 60 }}>🛍️</Text>
                  )}
                </View>
              </SwiperItem>
            ))}
          </Swiper>

          {/* 商品信息 */}
          <View style={{ backgroundColor: '#fff', padding: 16, marginTop: -1 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>{product.name || product.title}</Text>

            {/* 价格 */}
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#e89a5c' }}>
                ¥{displayPrice.toFixed(2)}
              </Text>
              {product.original_price && product.original_price > displayPrice && (
                <Text style={{ fontSize: 13, color: '#999', textDecorationLine: 'line-through' }}>
                  ¥{product.original_price.toFixed(2)}
                </Text>
              )}
            </View>

            {/* 标签 */}
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              {product.category && (
                <View style={{ paddingVertical: 4, paddingHorizontal: 10, backgroundColor: '#f8f7f4', borderRadius: 10 }}>
                  <Text style={{ fontSize: 10, color: '#666' }}>{product.category}</Text>
                </View>
              )}
              {product.style && (
                <View style={{ paddingVertical: 4, paddingHorizontal: 10, backgroundColor: '#f0f9ff', borderRadius: 10 }}>
                  <Text style={{ fontSize: 10, color: '#3b82f6' }}>{product.style}</Text>
                </View>
              )}
              {product.color_family && (
                <View style={{ paddingVertical: 4, paddingHorizontal: 10, backgroundColor: '#fef3c7', borderRadius: 10 }}>
                  <Text style={{ fontSize: 10, color: '#d97706' }}>{product.color_family}</Text>
                </View>
              )}
            </View>

            {/* 销量 */}
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' }}>
              <Text style={{ fontSize: 11, color: '#999' }}>销量 {product.sales || 0}</Text>
              <Text style={{ fontSize: 11, color: '#999' }}>库存 {product.stock || '充足'}</Text>
            </View>
          </View>

          {/* 商品详情 */}
          {(product.description || product.details) && (
            <View style={{ backgroundColor: '#fff', marginTop: 8, padding: 16 }}>
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 10 }}>商品详情</Text>
              <Text style={{ fontSize: 13, color: '#666', lineHeight: '20px' }}>
                {product.description || product.details || ''}
              </Text>
            </View>
          )}

          {/* 相关推荐 */}
          {relatedProducts.length > 0 && (
            <View style={{ backgroundColor: '#fff', marginTop: 8, padding: 16 }}>
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 12 }}>相关推荐</Text>
              <ScrollView scrollX showScrollbar={false}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {relatedProducts.map((p: any) => (
                    <View
                      key={p.id}
                      onClick={() => Taro.navigateTo({ url: `/pages/shop/index?id=${p.id}` })}
                      style={{ width: 140, backgroundColor: '#f8f7f4', borderRadius: 10, overflow: 'hidden' }}
                    >
                      <View style={{ width: 140, height: 120, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' }}>
                        {p.image_url || p.image ? (
                          <Image src={p.image_url || p.image} mode="aspectFill" style={{ width: 140, height: 120 }} />
                        ) : (
                          <Text>🛍️</Text>
                        )}
                      </View>
                      <View style={{ padding: 8 }}>
                        <Text style={{ fontSize: 11, color: '#333' }} numberOfLines={1}>{p.name || p.title}</Text>
                        <Text style={{ fontSize: 13, color: '#e89a5c', fontWeight: 'bold', marginTop: 2 }}>
                          ¥{(p.price || 0).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* 底部操作栏 */}
        <View style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 16,
          borderTopWidth: 1, borderTopColor: '#f0f0f0',
          flexDirection: 'row', alignItems: 'center', gap: 10,
          zIndex: 100,
        }}>
          {/* 数量选择 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View
              onClick={() => this.setState({ quantity: Math.max(1, quantity - 1) })}
              style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' }}
            >
              <Text style={{ fontSize: 14, color: '#666' }}>−</Text>
            </View>
            <Text style={{ width: 32, textAlign: 'center', fontSize: 14 }}>{quantity}</Text>
            <View
              onClick={() => this.setState({ quantity: quantity + 1 })}
              style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' }}
            >
              <Text style={{ fontSize: 14, color: '#666' }}>+</Text>
            </View>
          </View>

          {/* 加入购物车 */}
          <View
            onClick={this.addToCart}
            style={{
              flex: 1, paddingVertical: 10, borderRadius: 10,
              borderWidth: 1, borderColor: '#e89a5c', backgroundColor: '#fff8f0',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 13, color: '#e89a5c', fontWeight: 600 }}>加入购物车</Text>
          </View>

          {/* 立即购买 */}
          <View
            onClick={this.buyNow}
            style={{
              flex: 1, paddingVertical: 10, borderRadius: 10,
              background: 'linear-gradient(135deg, #e89a5c 0%, #d8a0c0 100%)',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>立即拿货</Text>
          </View>
        </View>
      </View>
    );
  }
}
