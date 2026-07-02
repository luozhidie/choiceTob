import { Component } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import { getCourses } from '../../services/api';
import Taro from '@tarojs/taro';

export default class CoursesPage extends Component {
  state = {
    courses: [],
    loading: true,
    activeCategory: '全部',
    categories: ['全部', '色彩诊断', '穿搭技巧', '门店运营', 'VIP专属'],
  };

  componentDidMount() {
    this.loadData();
  }

  async loadData() {
    try {
      const res = await getCourses();
      this.setState({ courses: res.data || [], loading: false });
    } catch {
      this.setState({ loading: false });
    }
  }

  render() {
    const { courses, loading, activeCategory } = this.state;
    const filtered = activeCategory === '全部'
      ? courses
      : courses.filter((c: any) => c.category === activeCategory);

    return (
      <ScrollView scrollY style={{ backgroundColor: '#f8f7f4', minHeight: '100vh' }}>
        {/* 头部 */}
        <View style={{
          backgroundColor: '#2d1b2e',
          paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20,
        }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff' }}>线上课程</Text>
          <Text style={{ fontSize: 12, color: '#c4b5a8', marginTop: 4 }}>专业色彩诊断 · 穿搭技巧 · 门店运营</Text>
        </View>

        {/* 分类标签 */}
        <View style={{ backgroundColor: '#fff', paddingVertical: 10, paddingLeft: 16 }}>
          <ScrollView scrollX showScrollbar={false}>
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
        </View>

        {/* 课程列表 */}
        <View style={{ padding: 16 }}>
          {loading ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <Text style={{ color: '#999' }}>加载中...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <Text style={{ fontSize: 28 }}>📚</Text>
              <Text style={{ color: '#999', marginTop: 8 }}>暂无课程</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'column', gap: 12 }}>
              {filtered.map((course: any, i: number) => (
                <View key={course.id || i} style={{
                  backgroundColor: '#fff', borderRadius: 12,
                  overflow: 'hidden', borderWidth: 1, borderColor: '#f0f0f0',
                }}>
                  {course.cover_image && (
                    <Image src={course.cover_image} mode="aspectFill" style={{ width: '100%', height: 160 }} />
                  )}
                  <View style={{ padding: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      {course.is_vip && (
                        <View style={{ paddingVertical: 2, paddingHorizontal: 8, backgroundColor: '#fef3c7', borderRadius: 6 }}>
                          <Text style={{ fontSize: 10, color: '#d97706', fontWeight: 600 }}>VIP</Text>
                        </View>
                      )}
                      <Text style={{ fontSize: 12, color: '#999' }}>{course.category || '课程'}</Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#333' }} numberOfLines={2}>
                      {course.title || course.name || '课程标题'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: course.is_free ? '#10b981' : '#e89a5c' }}>
                        {course.is_free ? '免费' : `¥${(course.price || 0).toFixed(2)}`}
                      </Text>
                      {course.original_price && course.original_price > course.price && (
                        <Text style={{ fontSize: 11, color: '#999', textDecorationLine: 'line-through' }}>
                          ¥{course.original_price.toFixed(2)}
                        </Text>
                      )}
                      <Text style={{ fontSize: 11, color: '#999', marginLeft: 'auto' }}>
                        {course.student_count || 0}人已学
                      </Text>
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
