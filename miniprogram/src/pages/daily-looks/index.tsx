import { Component } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import { getDailyLooks } from '../../services/api';
import Taro from '@tarojs/taro';

export default class DailyLooksPage extends Component {
  state = {
    looks: [],
    loading: true,
    activeSeason: '全部',
    seasons: ['全部', '春季', '夏季', '秋季', '冬季'],
  };

  componentDidMount() {
    this.loadData();
  }

  async loadData() {
    try {
      const res = await getDailyLooks();
      this.setState({ looks: res.data || [], loading: false });
    } catch {
      // 使用本地模拟数据
      this.setState({
        looks: [
          {
            id: 1,
            title: '夏日清新穿搭',
            description: '浅色系搭配，清爽一夏',
            image_url: '',
            season: '夏季',
            style: '淑女风',
            colors: ['浅色系', '冷色系'],
          },
          {
            id: 2,
            title: '职场知性风',
            description: '深色系职业装，气场全开',
            image_url: '',
            season: '春秋',
            style: '知性风',
            colors: ['深色系', '中性色'],
          },
        ],
        loading: false,
      });
    }
  }

  render() {
    const { looks, loading, activeSeason } = this.state;
    const filtered = activeSeason === '全部'
      ? looks
      : looks.filter((l) => (l.season || '').includes(activeSeason));

    return (
      <ScrollView scrollY style={{ backgroundColor: '#f8f7f4', minHeight: '100vh' }}>
        {/* 头部 */}
        <View style={{
          backgroundColor: '#2d1b2e',
          paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20,
        }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff' }}>每日穿搭</Text>
          <Text style={{ fontSize: 12, color: '#c4b5a8', marginTop: 4 }}>根据您的色彩季型，每日推荐精选搭配</Text>
        </View>

        {/* 季节筛选 */}
        <View style={{ backgroundColor: '#fff', paddingVertical: 10, paddingLeft: 16 }}>
          <ScrollView scrollX showScrollbar={false}>
            <View style={{ flexDirection: 'row' }}>
              {this.state.seasons.map(s => (
                <View
                  key={s}
                  onClick={() => this.setState({ activeSeason: s })}
                  style={{
                    paddingVertical: 6, paddingHorizontal: 14,
                    borderRadius: 20, marginRight: 8,
                    backgroundColor: activeSeason === s ? '#2d1b2e' : '#f5f5f5',
                  }}
                >
                  <Text style={{
                    fontSize: 11, fontWeight: activeSeason === s ? '600' : '400',
                    color: activeSeason === s ? '#fff' : '#666',
                  }}>{s}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 穿搭列表 */}
        <View style={{ padding: 16 }}>
          {loading ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <Text style={{ color: '#999' }}>加载中...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <Text style={{ fontSize: 28 }}>🎨</Text>
              <Text style={{ color: '#999', marginTop: 8 }}>暂无穿搭推荐</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'column', gap: 16 }}>
              {filtered.map((look: any, i: number) => (
                <View key={look.id || i} style={{
                  backgroundColor: '#fff', borderRadius: 16,
                  overflow: 'hidden', borderWidth: 1, borderColor: '#f0f0f0',
                }}>
                  {/* 主图 */}
                  <View style={{
                    width: '100%', height: 200,
                    backgroundColor: '#f3f4f6',
                    justifyContent: 'center', alignItems: 'center',
                  }}>
                    {look.image_url ? (
                      <Image src={look.image_url} mode="aspectFill" style={{ width: '100%', height: 200 }} />
                    ) : (
                      <Text style={{ fontSize: 40 }}>👗</Text>
                    )}
                  </View>

                  {/* 内容 */}
                  <View style={{ padding: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>{look.title}</Text>
                    <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{look.description}</Text>

                    {/* 标签 */}
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                      {look.style && (
                        <View style={{ paddingVertical: 4, paddingHorizontal: 10, backgroundColor: '#f8f7f4', borderRadius: 12 }}>
                          <Text style={{ fontSize: 10, color: '#666' }}>{look.style}</Text>
                        </View>
                      )}
                      {(look.colors || []).map((c: string, ci: number) => (
                        <View key={ci} style={{ paddingVertical: 4, paddingHorizontal: 10, backgroundColor: '#f0f9ff', borderRadius: 12 }}>
                          <Text style={{ fontSize: 10, color: '#3b82f6' }}>{c}</Text>
                        </View>
                      ))}
                      {look.season && (
                        <View style={{ paddingVertical: 4, paddingHorizontal: 10, backgroundColor: '#fef3c7', borderRadius: 12 }}>
                          <Text style={{ fontSize: 10, color: '#d97706' }}>{look.season}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    );
  }
}
