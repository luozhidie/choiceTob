// ProductBlock：根据版块配置加载并渲染商品
function ProductBlock({ block, bg, textColor, pad, radius, content, layout, columns }: {
  block: any;
  bg: string;
  textColor: string;
  pad: number;
  radius: number;
  content: any;
  layout: string;
  columns: number;
}) {
  const [blockProducts, setBlockProducts] = useState<any[]>([]);
  const [loadingBlock, setLoadingBlock] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      setLoadingBlock(true);
      try {
        const catMap: Record<string, string> = {
          clothing: "穿搭", accessories: "穿搭", shoes: "穿搭", lingerie: "穿搭",
          skincare: "护肤", makeup: "彩妆", wellness: "养生",
          food: "食品", home: "家居", creative: "文创", art: "艺术",
        };

        let result: any[] = [];

        // 第一级：按指定ID查
        if (content.productIds) {
          const ids = content.productIds.split(",").map((s: string) => s.trim()).filter(Boolean);
          if (ids.length > 0) {
            const res = await fetch(`/api/public/products?ids=${ids.join(",")}&limit=${ids.length}`);
            const json = await res.json();
            if (json.success && json.data && json.data.length > 0) {
              result = ids.map((id: string) => json.data.find((p: any) => p.id === id)).filter(Boolean);
            }
          }
        }

        // 第二级：按分类加载
        let categoryParam = "";
        if (result.length === 0 && content.category && content.category !== "hot_picks") {
          categoryParam = catMap[content.category] || content.category;
          if (categoryParam) {
            const catRes = await fetch(`/api/public/products?category=${encodeURIComponent(categoryParam)}&limit=20`);
            const catJson = await catRes.json();
            if (catJson.success && catJson.data && catJson.data.length > 0) {
              result = catJson.data;
            }
          }
        }

        // 第三级：加载全部商品兜底
        if (result.length === 0) {
          const allRes = await fetch("/api/public/products?limit=20");
          const allJson = await allRes.json();
          if (allJson.success && allJson.data) {
            result = allJson.data;
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

  return (
    <section style={{ backgroundColor: bg, padding: `${pad}px`, color: textColor, borderRadius: `${radius}px` }} className="w-full">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-bold text-lg mb-4">{block.title}</h2>
        {loadingBlock ? (
          <div className={`grid ${gridCls} gap-4`}>
            {[1,2,3,4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="rounded-xl aspect-[3/4]"></div>
              </div>
            ))}
          </div>
        ) : blockProducts.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">暂无商品，请在后台添加商品并发布</p>
        ) : (
          <div className={layout === "carousel" ? "flex gap-4 overflow-x-auto" : `grid ${gridCls} gap-4`}>
            {blockProducts.map((p: any) => (
              <Link key={p.id} href={`/shop/${p.id}`} className="group block min-w-[180px]">
                <div className="relative overflow-hidden rounded-xl bg-gray-50 mb-2 aspect-[3/4]">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">暂无图片</div>
                  )}
                </div>
                <h4 className="font-medium text-gray-900 group-hover:text-rose-500 transition-colors leading-snug text-[13px] line-clamp-2">{p.name}</h4>
                <p className="text-red-500 font-bold mt-1 text-[15px]">¥{formatPrice(p.price)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
