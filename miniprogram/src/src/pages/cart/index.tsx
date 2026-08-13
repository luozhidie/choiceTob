import { Component } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import TabBar from '../../components/TabBar';
import Taro from '@tarojs/taro';

/* ========== 购物车页 ========== */
export default class CartPage extends Component {
  state = {
    items: [],
    loaded: false,
  };

  componentDidMount() {
    this.loadCart();
  }

  loadCart() {
    try {
      const stored = Taro.getStorageSync('lzdzhixuan_cart');
      if (stored) {
        this.setState({ items: JSON.parse(stored), loaded: true });
      } else {
        this.setState({ loaded: true });
      }
    } catch {
      this.setState({ loaded: true });
    }
  }

  saveCart(items: any[]) {
    try { Taro.setStorageSync('lzdzhixuan_cart', JSON.stringify(items)); } catch {}
  }

  updateQuantity(id: string, qty: number) {
    if (qty <= 0) { this.removeItem(id); return; }
    const items = this.state.items.map((item: any) =>
      item.id === id ? { ...item, quantity: qty } : item
    );
    this.setState({ items }, () => this.saveCart(items));
  }

  removeItem(id: string) {
    const items = this.state.items.filter((item: any) => item.id !== id);
    this.setState({ items }, () => this.saveCart(items));
  }

  clearCart() {
    this.setState({ items: [] }, () => {
      try { Taro.removeStorageSync('lzdzhixuan_cart'); } catch {}
    });
  }

  render() {
    const { items, loaded } = this.state;
    const totalPrice = items.reduce((s: number, i: any) => s + (i.price || 0) * (i.quantity || 1), 0);
    const totalItems = items.reduce((s: number, i: any) => s + (i.quantity || 1), 0);

    return (
      <ScrollView scrollY style={{ backgroundColor: '#f8f7f4', minHeight: '100vh' }}>
        {/* 头部 */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingTop: 50, paddingBottom: 14, paddingHorizontal: 20,
          backgroundColor: '#fff',
        }}>
          <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#333' }}>购物车</Text>
          <Text style={{ fontSize: 13, color: '#999', marginLeft: 'auto' }}>{totalItems}件商品</Text>
        </View>

        <View style={{ padding: 16 }}>
          {!loaded ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <Text style={{ fontSize: 28 }}>⏳</Text>
              <Text style={{ color: '#999', marginTop: 8 }}>加载中...</Text>
            </View>
          ) : items.length === 0 ? (
            <View style={{
              paddingVertical: 80, alignItems: 'center',
              backgroundColor: '#fff', borderRadius: 16,
            }}>
              <Text style={{ fontSize: 40 }}>🛒</Text>
              <Text style={{ fontSize: 17, fontWeight: 'bold', marginTop: 16, color: '#333' }}>购物车是空的</Text>
              <Text style={{ fontSize: 13, color: '#999', marginTop: 8 }}>快去挑选心仪的商品吧</Text>
              <View
                onClick={() => Taro.switchTab({ url: '/pages/buyer/index' })}
                style={{
                  marginTop: 20, paddingVertical: 12, paddingHorizontal: 28,
                  backgroundColor: '#2d1b2e', borderRadius: 25,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>去选品</Text>
              </View>
            </View>
          ) : (
            <>
              {/* 商品列表 */}
              {items.map((item: any) => (
                <View key={item.id} style={{
                  flexDirection: 'row', backgroundColor: '#fff',
                  borderRadius: 12, padding: 12, marginBottom: 10,
                  borderWidth: 1, borderColor: '#f0f0f0',
                }}>
                  {item.image && (
                    <Image src={item.image} mode="aspectFill" style={{
                      width: 80, height: 80, borderRadius: 8, backgroundColor: '#f3f4f6'
                    }} />
                  )}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 13, fontWeight: 500, color: '#333' }} numberOfLines={1}>
                      {item.title || item.name || '商品'}
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: 700, color: '#e89a5c', marginTop: 4 }}>
                      ¥{(item.price || 0).toFixed(2)}
                    </Text>

                    {/* 数量控制 */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                      <View
                        onClick={() => this.updateQuantity(item.id, (item.quantity || 1) - 1)}
                        style={{
                          width: 28, height: 28, borderRadius: 14,
                          borderWidth: 1, borderColor: '#e5e7eb',
                          justifyContent: 'center', alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 14, color: '#666' }}>−</Text>
                      </View>
                      <Text style={{ width: 28, textAlign: 'center', fontSize: 13 }}>{item.quantity || 1}</Text>
                      <View
                        onClick={() => this.updateQuantity(item.id, (item.quantity || 1) + 1)}
                        style={{
                          width: 28, height: 28, borderRadius: 14,
                          borderWidth: 1, borderColor: '#e5e7eb',
                          justifyContent: 'center', alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 14, color: '#666' }}>+</Text>
                      </View>
                      <View
                        onClick={() => this.removeItem(item.id)}
                        style={{ marginLeft: 'auto', padding: 6 }}
                      >
                        <Text style={{ fontSize: 14, color: '#ef4444' }}>🗑️</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}

              {/* 底部结算区 */}
              <View style={{
                backgroundColor: '#fff', padding: 16,
                borderTopWidth: 1, borderTopColor: '#f0f0f0',
                borderRadius: 12, marginTop: 12,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontSize: 13, color: '#666' }}>合计</Text>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#e89a5c' }}>¥{totalPrice.toFixed(2)}</Text>
                </View>
                <View
                  onClick={() => Taro.showToast({ title: '结算功能开发中', icon: 'none' })}
                  style={{
                    paddingVertical: 12, borderRadius: 12,
                    background: 'linear-gradient(135deg, #e89a5c 0%, #d8a0c0 100%)',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>去结算 ({totalItems}件)</Text>
                </View>
              </View>

              {/* 清空按钮 */}
              <View onClick={this.clearCart.bind(this)} style={{ paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: '#999' }}>清空购物车</Text>
              </View>
            </>
          )}
        </View>

        {/* 底部推荐 */}
        {!loaded || items.length === 0 ? null : (
          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 100 }}>
            <View
              onClick={() => Taro.switchTab({ url: '/pages/buyer/index' })}
              style={{
                flex: 1, paddingVertical: 12, borderRadius: 12,
                backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee',
                alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 12, color: '#333' }}>🛍️ 继续选品</Text>
            </View>
            <View
              onClick={() => Taro.navigateTo({ url: '/pages/courses/index' })}
              style={{
                flex: 1, paddingVertical: 12, borderRadius: 12,
                backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee',
                alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 12, color: '#333' }}>📚 课程商城</Text>
            </View>
          </View>
        )}

        <TabBar activeTab="cart" />
      </ScrollView>
    );
  }
}
