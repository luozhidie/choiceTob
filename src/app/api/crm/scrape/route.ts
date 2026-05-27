import { NextRequest, NextResponse } from "next/server";

/**
 * CRM 门店信息采集 API
 * 合规说明：仅采集公开企业信息，不采集个人隐私数据
 * 数据来源：百度地图开放平台、高德地图等公开 POI 数据
 */
export async function POST(request: NextRequest) {
  try {
    const { keyword, city, industry, page = 1 } = await request.json();

    if (!keyword && !industry) {
      return NextResponse.json({ error: "请提供搜索关键词或行业" }, { status: 400 });
    }

    // 构建搜索关键词
    const searchTerm = industry
      ? `${industry}${city || ''}`
      : `${keyword}${city ? ' ' + city : ''}`;

    // 使用高德地图 POI 搜索 API（公开数据）
    // 兼容两种环境变量命名：NEXT_PUBLIC_ 前缀（前端）和普通命名（服务端）
    const amapKey = process.env.NEXT_PUBLIC_AMAP_API_KEY || process.env.AMAP_API_KEY;
    const results: any[] = [];

    if (amapKey) {
      // 高德地图 POI 搜索
      const amapUrl = `https://restapi.amap.com/v3/place/text?keywords=${encodeURIComponent(searchTerm)}&city=${encodeURIComponent(city || '')}&offset=25&page=${page}&key=${amapKey}&output=json`;
      const amapRes = await fetch(amapUrl, { next: { revalidate: 0 } });
      const amapData = await amapRes.json();

      if (amapData.pois) {
        for (const poi of amapData.pois) {
          results.push({
            name: poi.name || '',
            address: poi.address || poi.pname + poi.cityname + poi.adname + poi.address || '',
            phone: poi.tel || '',
            industry: industry || guessIndustry(poi.type || '', poi.name || ''),
            city: poi.cityname || city || '',
            district: poi.adname || '',
            business_hours: poi.business_area || '',
            source: 'scrape',
            source_detail: '高德地图',
            lat: poi.location ? poi.location.split(',')[1] : '',
            lng: poi.location ? poi.location.split(',')[0] : '',
          });
        }
      }
    }

    // 补充：百度地图 POI 搜索
    // 兼容两种环境变量命名
    const baiduKey = process.env.NEXT_PUBLIC_BAIDU_MAP_AK || process.env.BAIDU_MAP_AK;
    if (baiduKey && results.length < 20) {
      try {
        const baiduUrl = `https://api.map.baidu.com/place/v2/search?query=${encodeURIComponent(searchTerm)}&region=${encodeURIComponent(city || '全国')}&output=json&page_size=20&page_num=${page - 1}&ak=${baiduKey}`;
        const baiduRes = await fetch(baiduUrl, { next: { revalidate: 0 } });
        const baiduData = await baiduRes.json();

        if (baiduData.results) {
          for (const poi of baiduData.results) {
            // 去重
            const nameExists = results.some(r => r.name === poi.name);
            if (!nameExists) {
              results.push({
                name: poi.name || '',
                address: poi.address || '',
                phone: poi.telephone || poi.phone || '',
                industry: industry || guessIndustry(poi.detail_info?.type || '', poi.name || ''),
                city: city || '',
                district: '',
                business_hours: poi.detail_info?.shop_hours || '',
                source: 'scrape',
                source_detail: '百度地图',
                lat: poi.location?.lat || '',
                lng: poi.location?.lng || '',
              });
            }
          }
        }
      } catch (e) {
        // 百度地图API调用失败，不影响整体
        console.error('Baidu map API error:', e);
      }
    }

    // 如果没有配置任何地图 API Key，返回提示
    if (!amapKey && !baiduKey) {
      return NextResponse.json({
        results: [],
        total: 0,
        message: "未配置地图API密钥，请配置 AMAP_API_KEY 或 BAIDU_MAP_AK 环境变量。目前可使用手动搜索指引模式。",
        searchTips: getSearchTips(industry, city),
      });
    }

    return NextResponse.json({
      results: results.filter(r => r.name), // 过滤掉无名记录
      total: results.length,
    });
  } catch (error: any) {
    console.error("Scrape API error:", error);
    return NextResponse.json({ error: error.message || "采集失败" }, { status: 500 });
  }
}

// 根据POI类型猜测行业
function guessIndustry(type: string, name: string): string {
  if (type.includes('服装') || name.includes('服装') || name.includes('女装') || name.includes('男装') || name.includes('衣')) return '服装店';
  if (type.includes('轮胎') || name.includes('轮胎') || name.includes('汽配') || name.includes('车轮')) return '轮胎店';
  if (type.includes('滋补') || name.includes('滋补') || name.includes('参茸') || name.includes('药材') || name.includes('中药') || name.includes('燕窝')) return '滋补行';
  return '其他';
}

// 当没有API key时，返回搜索指引
function getSearchTips(industry: string, city: string): any[] {
  const baseIndustry = industry || '服装店';
  return [
    {
      platform: "天眼查",
      url: `https://www.tianyancha.com/search?key=${encodeURIComponent(baseIndustry + (city ? ' ' + city : ''))}`,
      desc: "搜索企业工商信息，可获取法人手机号",
    },
    {
      platform: "企查查",
      url: `https://www.qcc.com/web/search?key=${encodeURIComponent(baseIndustry + (city ? ' ' + city : ''))}`,
      desc: "搜索企业信息，可查看联系方式",
    },
    {
      platform: "百度地图",
      url: `https://map.baidu.com/search/${encodeURIComponent(baseIndustry + (city ? ' ' + city : ''))}`,
      desc: "搜索地图上的门店，可查看电话",
    },
    {
      platform: "高德地图",
      url: `https://www.amap.com/search?query=${encodeURIComponent(baseIndustry)}&city=${encodeURIComponent(city || '')}`,
      desc: "搜索地图上的门店，可查看电话",
    },
    {
      platform: "大众点评",
      url: `https://www.dianping.com/search/keyword/0/0_${encodeURIComponent(baseIndustry)}`,
      desc: "搜索门店评价和联系方式",
    },
  ];
}
