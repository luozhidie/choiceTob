// ProductBlock：根据版块配置加载并渲染商品
import { useState, useEffect } from "react";
import Link from "next/link";
import { isValidImage } from "@/components/ProductCollage";

// 价格格式化
function formatPrice(price: number | null | undefined): string {
  if (!price) return "0";
  const p = Number(price);
  const yuan = p >= 100 ? Math.round(p / 100) : p;
  return "¥" + (yuan % 1 === 0 ? yuan.toFixed(0) : yuan.toFixed(2));
}

interface ProductBlockProps {
  block: any;
  bg: string;
  textColor: string;
  pad: number;
  radius: number;
  content: any;
  layout: string;
  columns: number;
}

export default function ProductBlock({ block, bg, textColor, pad, radius, content, layout, columns }: ProductBlockProps) {
  const [blockProducts, setBlockProducts] = useState<any[]>([]);
  const [loadingBlock, setLoadingBlock] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      setLoadingBlock(true);
      let result: any[] = [];

      try {
        // 第一级：按指定ID查
        if (content.productIds) {
          const ids = content.productIds.split(",").map((s: string) => s.trim()).filter(Boolean);
          if (ids.length > 0) {
            // 先查 products 表
            const res = await fetch(`/api/public/products?ids=${ids.join(",")}&limit=${ids.length}`);
            const json = await res.json();
            if (json.success && json.data && json.data.length > 0) {
              result = ids.map((id: string) => json.data.find((p: any) => p.id === id)).filter(Boolean);
            }
            // products 表没查到，再查 buyer_products 表
            if (result.length === 0) {
              const res2 = await fetch(`/api/public/buyer-products?ids=${ids.join(",")}&limit=${ids.length}`);
              const json2 = await res2.json();
              if (json2.success && json2.data) {
                result = ids.map((id: string) => json2.data.find((p: any) => p.id === id)).filter(Boolean);
              }
            }
          }
        }

        // 第二级：按分类加载
        if (result.length === 0 && content.category && content.category !== "hot_picks") {
          const catMap: Record<string, string> = {
            clothing: "穿搭", accessories: "穿搭", shoes: "穿搭", lingerie: "穿搭",
            skincare: "护肤", makeup: "彩妆", wellness: "养生",
            food: "食品", home: "家居", creative: "文创", art: "艺术",
          };
          const categoryParam = catMap[content.category] || content.category;
          if (categoryParam) {
            const res = await fetch(`/api/public/products?category=${encodeURIComponent(categoryParam)}&limit=20`);
            const json = await res.json();
            if (json.success && json.data && json.data.length > 0) {
              result = json.data;
            } else {
              // products 表没数据，fallback 到 buyer_products
              const res2 = await fetch(`/api/public/buyer-products?category=${encodeURIComponent(content.category)}&limit=20`);
              const json2 = await res2.json();
              if (json2.success && json2.data) result = json2.data;
            }
          }
        }

        // 第三级：加载全部商品兜底
        if (result.length === 0) {
          const res = await fetch("/api/public/products?limit=20");
          const json = await res.json();
          if (json.success && json.data) {
            result = json.data;
          } else {
            const res2 = await fetch("/api/public/buyer-products?limit=20");
            const json2 = await res2.json();
            if (json2.success && json2.data) result = json2.data;
          }
        }

        setBlockProducts(result);
      } catch (err) {
        console.error("[ProductBlock] 加载失败:", err);
        setBlockProducts([]);
      }
      setLoadingBlock(false);
    };
    loadProducts();
  }, [content.category, content.productIds, block.id]);

  const gridCls = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 5: "grid-cols-5", 6: "grid-cols-6" }[columns] || "grid-cols-4";

  if (loadingBlock) {
    return (
      <section style={{ backgroundColor: bg, padding: `${pad}px`, borderRadius: `${radius}px` }} className="w-full">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-bold text-lg mb-4">{block.title}</h2>
          <div className={`grid ${gridCls} gap-4`}>
            {[1,2,3,4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-100 rounded-xl aspect-[3/4] mb-2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (blockProducts.length === 0) {
    return (
      <section style={{ backgroundColor: bg, padding: `${pad}px`, borderRadius: `${radius}px` }} className="w-full">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-bold text-lg mb-4">{block.title}</h2>
          <p className="text-sm text-gray-400 py-8 text-center">暂无商品，请在后台添加商品并发布</p>
        </div>
      </section>
    );
  }

  return (
    <section style={{ backgroundColor: bg, padding: `${pad}px`, borderRadius: `${radius}px` }} className="w-full">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-bold text-lg mb-4">{block.title}</h2>
        {/* 版块宣传横幅 */}
        {content.promoBanner && isValidImage(content.promoBanner) && (
          <div className="mb-4 rounded-xl overflow-hidden shadow-sm">
            <img src={content.promoBanner} alt="" className="w-full h-auto" />
          </div>
        )}
        <div className={layout === "carousel" ? "flex gap-4 overflow-x-auto" : `grid ${gridCls} gap-4`}>
          {blockProducts.map((product: any) => (
            <Link key={product.id} href={`/shop/${product.id}`} className="group block min-w-[180px]">
              <div className="relative overflow-hidden rounded-xl bg-gray-50 mb-2 aspect-[3/4]">
                {(product.image_url && isValidImage(product.image_url)) || (product.cover_image && isValidImage(product.cover_image)) ? (
                  <img src={product.image_url || product.cover_image} alt={product.name || product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">暂无图片</div>
                )}
              </div>
              <h4 className="font-medium text-gray-900 group-hover:text-rose-500 transition-colors leading-snug text-[13px] line-clamp-2">{product.name || product.title || "商品"}</h4>
              <p className="text-red-500 font-bold mt-1 text-[15px]">{formatPrice(product.price)}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
