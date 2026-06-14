"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag, Lock, Eye, Loader2, Tag, ChevronRight,
  Crown, MessageCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

interface HotProduct {
  id: string;
  name: string;
  description: string | null;
  details: string | null;
  price: number;
  original_price: number | null;
  tags: string[];
  images: string[];
  category: string | null;
  season: string | null;
  is_members_only: boolean;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" as const },
  }),
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

export function HotProductsSection() {
  const [products, setProducts] = useState<HotProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<HotProduct | null>(null);
  const { isHotPicksMember, user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("hot_products")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (!error && data) setProducts(data as HotProduct[]);
    setLoading(false);
  };

  const isMember = isHotPicksMember;

  // 统一微信支付
  const handleWechatPay = async (productId: string, price: number) => {
    if (!user) { window.location.href = '/login?redirect=/hot-picks'; return; }
    try {
      const res = await fetch('/api/wechat-pay/unified-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, total_fee: price, platform: 'mp', openid: user.id || '' }),
      });
      const result = await res.json();
      if (result.prepay_id && typeof window !== 'undefined' && (window as any).WeixinJSBridge) {
        (window as any).WeixinJSBridge.invoke('getBrandWCPayRequest', {
          appId: result.appId, timeStamp: result.timeStamp, nonceStr: result.nonceStr,
          package: result.package, signType: result.signType || 'MD5', paySign: result.paySign,
        }, (res: any) => {
          if (res.err_msg === "get_brand_wcpay_request:ok") { alert('支付成功！已开通会员'); window.location.reload(); }
          else if (res.err_msg === "get_brand_wcpay_request:cancel") alert('支付已取消');
          else alert('支付失败：' + res.err_msg);
        });
      } else alert('请在微信中打开此页面进行支付');
    } catch (e) { console.error('[pay]', e); alert('支付发起失败'); }
  };

  const categories = ["全部", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[]];
  const [selectedCategory, setSelectedCategory] = useState("全部");

  const filteredProducts = selectedCategory === "全部"
    ? products
    : products.filter((p) => p.category === selectedCategory);

  return (
    <>
      {/* 爆款样衣列表 */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              Hot Products
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              爆款样衣展示
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              精选市场最新爆款样衣，会员可查看完整详情与价格，看中即可咨询下单
            </p>
          </div>

          {/* 分类筛选 */}
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-8 justify-center">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-accent text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-accent mr-3" />
              <span className="text-muted-foreground">加载中...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {selectedCategory !== "全部" ? "该分类暂无爆款样衣" : "暂无爆款样衣，敬请期待"}
              </p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
            >
              {filteredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  variants={fadeUp}
                  custom={i}
                  className="group cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-transparent hover:border-accent/30">
                    {/* 图片区域 */}
                    <div className="relative aspect-[3/4] bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                            !isMember && product.is_members_only ? "blur-lg brightness-75" : ""
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-12 h-12 text-primary/20" />
                        </div>
                      )}

                      {/* 非会员遮罩 */}
                      {!isMember && product.is_members_only && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[2px]">
                          <Lock className="w-8 h-8 text-white/80 mb-2" />
                          <span className="text-white text-sm font-medium">会员专属</span>
                          <span className="text-white/70 text-xs mt-1">开通会员查看详情</span>
                        </div>
                      )}

                      {/* 标签 */}
                      {product.tags && product.tags.length > 0 && (
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                          {product.tags.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/80 text-white font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 季节标签 */}
                      {product.season && (
                        <div className="absolute top-3 right-3">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/90 text-white font-medium">
                            {product.season}
                          </span>
                        </div>
                      )}

                      {/* 悬浮提示 */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <span className="px-4 py-2 bg-white/90 text-primary text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                          {isMember || !product.is_members_only ? "查看详情" : "开通会员"}
                        </span>
                      </div>
                    </div>

                    {/* 内容区域 */}
                    <div className="p-4">
                      <h3 className="font-bold text-primary group-hover:text-accent transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      )}

                      {/* 价格 - 会员可见 */}
                      {(isMember || !product.is_members_only) ? (
                        <div className="mt-3 flex items-baseline gap-2">
                          <span className="text-xl font-bold text-accent">
                            ¥{(product.price / 100).toLocaleString()}
                          </span>
                          {product.original_price && product.original_price > product.price && (
                            <span className="text-sm text-gray-400 line-through">
                              ¥{(product.original_price / 100).toLocaleString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
                          <Lock className="w-4 h-4" />
                          <span>会员可见价格</span>
                        </div>
                      )}

                      {/* 立即咨询按钮 */}
                      <button
                        onClick={() => handleWechatPay('hotpicks_monthly', 99800)}
                        className="mt-3 block w-full py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors text-center"
                      >
                        立即开通
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* 商品详情弹窗 */}
      {selectedProduct && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 图片 */}
            <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/10 to-accent/10">
              {selectedProduct.images && selectedProduct.images.length > 0 ? (
                <img
                  src={selectedProduct.images[0]}
                  alt={selectedProduct.name}
                  className={`w-full h-full object-cover ${
                    !isMember && selectedProduct.is_members_only ? "blur-lg brightness-75" : ""
                  }`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-16 h-16 text-primary/20" />
                </div>
              )}
              {!isMember && selectedProduct.is_members_only && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                  <Lock className="w-10 h-10 text-white/80 mb-2" />
                  <span className="text-white font-medium">会员专属内容</span>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/wechat-pay/unified-order', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            product_id: 'hotpicks_monthly',
                            total_fee: 99800,
                            platform: 'mp',
                            openid: user?.id || ''
                          })
                        });
                        const result = await response.json();
                        if (result.prepay_id && typeof window !== 'undefined' && (window as any).WeixinJSBridge) {
                          (window as any).WeixinJSBridge.invoke('getBrandWCPayRequest', {
                            appId: result.appId,
                            timeStamp: result.timeStamp,
                            nonceStr: result.nonceStr,
                            package: result.package,
                            signType: result.signType,
                            paySign: result.paySign
                          }, function(res: any) {
                            if (res.err_msg === "get_brand_wcpay_request:ok") {
                              alert('支付成功！已开通会员');
                              window.location.reload();
                            }
                          });
                        } else if (!user) {
                          window.location.href = '/login?redirect=/hot-picks';
                        } else {
                          alert('请在微信中打开此页面进行支付');
                        }
                      } catch (error) {
                        console.error('[wechat pay]', error);
                        alert('支付发起失败，请稍后重试');
                      }
                      setSelectedProduct(null); // 关闭弹窗
                    }}
                    className="mt-3 px-5 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition-colors"
                  >
                    微信支付 ¥998/月 开通
                  </button>
                </div>
              )}
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* 详情 */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                {selectedProduct.tags?.map((tag, idx) => (
                  <span key={idx} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {tag}
                  </span>
                ))}
                {selectedProduct.season && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                    {selectedProduct.season}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-primary">{selectedProduct.name}</h3>
              {selectedProduct.description && (
                <p className="mt-2 text-muted-foreground">{selectedProduct.description}</p>
              )}

              {/* 价格 */}
              {(isMember || !selectedProduct.is_members_only) ? (
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-accent">
                    ¥{(selectedProduct.price / 100).toLocaleString()}
                  </span>
                  {selectedProduct.original_price && selectedProduct.original_price > selectedProduct.price && (
                    <span className="text-lg text-gray-400 line-through">
                      ¥{(selectedProduct.original_price / 100).toLocaleString()}
                    </span>
                  )}
                </div>
              ) : (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl flex items-center gap-3">
                  <Lock className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-500">开通会员后查看价格与商品详情</span>
                </div>
              )}

              {/* 商品详情 */}
              {(isMember || !selectedProduct.is_members_only) && selectedProduct.details && (
                <div className="mt-4">
                  <h4 className="font-semibold text-primary mb-2">商品详情</h4>
                  <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                    {selectedProduct.details}
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => handleWechatPay('hotpicks_monthly', 99800)}
                  className="flex-1 py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent/90 transition-colors text-center"
                >
                  立即开通
                </button>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="px-5 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
