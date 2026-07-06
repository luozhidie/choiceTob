const { createClient } = require('@supabase/supabase-js');

exports.main = async (event, context) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { urls } = JSON.parse(event.body || '{}');
  if (!urls || !Array.isArray(urls)) {
    return { success: false, error: '请提供 urls 数组' };
  }

  const results = [];
  for (const url of urls.slice(0, 10)) {
    try {
      // 1. 获取 HTML
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        redirect: 'follow',
      });
      const html = await response.text();

      // 2. 提取标题
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
        || html.match(/itemprop="name"[^>]*content="([^"]+)"/)
        || html.match(/class="d-title"[^>]*>([^<]+)/i);
      const title = titleMatch ? titleMatch[1].trim() : '';

      // 3. 提取价格
      const priceMatch = html.match(/[¥￥]\s*(\d+\.?\d*)/)
        || html.match(/"priceText"\s*:\s*"(\d+)"/i)
        || html.match(/"price"\s*:\s*"(\d+)"/);
      const price = priceMatch ? Math.round(parseFloat(priceMatch[1]) * 100) : 0;

      // 4. 提取图片
      const imgRegex = /<img[^>]+(?:src|data-src|data-original)\s*=\s*["']([^"']+\.(jpg|jpeg|png|webp))["']/gi;
      const images = [];
      let m;
      while ((m = imgRegex.exec(html)) !== null && images.length < 10) {
        let src = m[1];
        if (src.startsWith('//')) src = 'https:' + src;
        if (src.startsWith('/')) src = new URL(src, url).href;
        if (src.startsWith('http')) images.push(src);
      }

      // 5. 下载图片到 Storage
      const uploadedImages = [];
      for (const imgUrl of images.slice(0, 5)) {
        try {
          const imgResp = await fetch(imgUrl);
          const buf = await imgResp.arrayBuffer();
          const ext = imgUrl.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg';
          const filename = `import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

          const { data, error } = await supabase.storage
            .from('products')
            .upload(filename, Buffer.from(buf), { contentType: `image/${ext}`, upsert: false });

          if (!error && data) {
            const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(data.path);
            uploadedImages.push(publicUrl);
          }
        } catch {}
      }

      // 6. 创建商品
      if (title || uploadedImages.length > 0) {
        const { data, error } = await supabase
          .from('products')
          .insert({
            title: title || `导入商品_${Date.now()}`,
            price,
            original_price: price,
            cover_image: uploadedImages[0] || null,
            images: JSON.stringify(uploadedImages),
            category: '',
            is_published: true,
            stock: 0,
            tags: ['导入'],
          })
          .select()
          .single();

        if (!error && data) {
          results.push({
            url,
            status: 'success',
            productId: data.id,
            title: data.title,
            price: data.price ? (data.price / 100).toString() : '',
            imageCount: uploadedImages.length,
          });
        } else {
          results.push({ url, status: 'error', message: error?.message || '创建失败' });
        }
      } else {
        results.push({ url, status: 'error', message: '未提取到标题或图片' });
      }
    } catch (err) {
      results.push({ url, status: 'error', message: err.message || '处理异常' });
    }
  }

  return {
    success: results.filter(r => r.status === 'success').length > 0,
    total: urls.length,
    successCount: results.filter(r => r.status === 'success').length,
    errorCount: results.filter(r => r.status === 'error').length,
    results,
  };
};
