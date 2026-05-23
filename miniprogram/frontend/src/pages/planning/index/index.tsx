import { View, Text, Picker, Input } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

export default function PlanningPage() {
  const [form, setForm] = useState({
    brandName: '', season: '2026夏季', colorPref: '', styleLabel: '',
    priceBand: '600-3000元', targetAge: '25-45岁',
  });
  const [generating, setGenerating] = useState(false);

  const seasons = ['2026夏季', '2026秋冬', '2027春季', '2027夏季'];
  const priceBands = ['199-399元', '399-899元', '600-3000元', '1000-5000元'];
  const ages = ['20-30岁', '25-40岁', '25-45岁', '30-50岁', '35-55岁'];

  const generate = async () => {
    if (!form.brandName) { Taro.showToast({ title: '请输入品牌名', icon: 'none' }); return; }
    setGenerating(true);
    try {
      const res = await fetch('https://colour-choice.art/api/generate-planning', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.report) {
        Taro.setStorageSync('ai_report', JSON.stringify(data.report));
        Taro.setStorageSync('ai_source', data.source);
        Taro.navigateTo({ url: '/pages/planning/result/index' });
      } else {
        Taro.showToast({ title: '生成失败', icon: 'none' });
      }
    } catch (e) {
      Taro.showToast({ title: '网络错误', icon: 'none' });
    }
    setGenerating(false);
  };

  return (
    <View className='page'>
      <View className='card'>
        <Text className='section-title'>✨ AI 商品企划生成</Text>
        <Text className='hint'>基于店铺定位和会员画像，智能生成季节企划方案</Text>

        <View className='form-group'>
          <Text className='form-label'>品牌名 *</Text>
          <Input className='form-input' placeholder='输入品牌名' value={form.brandName} onInput={e => setForm({ ...form, brandName: e.detail.value })} />
        </View>

        <View className='form-group'>
          <Text className='form-label'>季节</Text>
          <Picker mode='selector' range={seasons} onChange={e => setForm({ ...form, season: seasons[e.detail.value] })}>
            <View className='form-picker'>{form.season} ▼</View>
          </Picker>
        </View>

        <View className='form-group'>
          <Text className='form-label'>价格带</Text>
          <Picker mode='selector' range={priceBands} onChange={e => setForm({ ...form, priceBand: priceBands[e.detail.value] })}>
            <View className='form-picker'>{form.priceBand} ▼</View>
          </Picker>
        </View>

        <View className='form-group'>
          <Text className='form-label'>目标年龄段</Text>
          <Picker mode='selector' range={ages} onChange={e => setForm({ ...form, targetAge: ages[e.detail.value] })}>
            <View className='form-picker'>{form.targetAge} ▼</View>
          </Picker>
        </View>

        <View className='btn-primary' onClick={generate}>
          <Text className='btn-text'>{generating ? '生成中...' : '🚀 一键生成企划'}</Text>
        </View>
      </View>
    </View>
  );
}
