"use client";

import { useState, useMemo } from "react";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  Package,
  Tag,
  Palette,
  Truck,
  CreditCard,
  Check,
  Star,
} from "lucide-react";
import {
  products,
  COLOR_SEASONS,
  STYLE_TYPES,
  COLOR_SEASON_COLORS,
} from "@/lib/mock-data";
import type { Product, OrderItem } from "@/lib/types";

export default function ProductsPage() {
  const [styleFilter, setStyleFilter] = useState("");
  const [seasonFilter, setSeasonFilter] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 99999]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);

  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("wechat");
  const [orderSuccess, setOrderSuccess] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (styleFilter && p.style_type !== styleFilter) return false;
      if (seasonFilter && p.color_season !== seasonFilter) return false;
      if (
        p.wholesale_price < priceRange[0] ||
        p.wholesale_price > priceRange[1]
      )
        return false;
      if (
        searchQuery &&
        !p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [styleFilter, seasonFilter, priceRange, searchQuery]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

  const addToCart = (product: Product, qty: number) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: item.quantity + qty,
                subtotal: (item.quantity + qty) * item.wholesale_price,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: qty,
          wholesale_price: product.wholesale_price,
          subtotal: qty * product.wholesale_price,
        },
      ];
    });
  };

  const updateCartItemQty = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product_id !== productId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return {
            ...item,
            quantity: newQty,
            subtotal: newQty * item.wholesale_price,
          };
        })
        .filter(Boolean) as OrderItem[]
    );
  };

  const removeCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const handleSubmitOrder = () => {
    setCheckoutOpen(false);
    setCartItems([]);
    setShippingName("");
    setShippingPhone("");
    setShippingAddress("");
    setPaymentMethod("wechat");
    setOrderSuccess(true);
    setTimeout(() => setOrderSuccess(false), 3000);
  };

  const stockStatus = (stock: number) => {
    if (stock === 0) return { label: "售罄", color: "bg-gray-200 text-gray-500" };
    if (stock <= 20) return { label: "低库存", color: "bg-red-100 text-red-600" };
    return { label: "有货", color: "bg-green-100 text-green-700" };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Filters */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索商品名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <select
                value={styleFilter}
                onChange={(e) => setStyleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">全部风格</option>
                {STYLE_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                value={seasonFilter}
                onChange={(e) => setSeasonFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">全部色彩季型</option>
                {COLOR_SEASONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                value={`${priceRange[0]}-${priceRange[1]}`}
                onChange={(e) => {
                  const [min, max] = e.target.value.split("-").map(Number);
                  setPriceRange([min, max]);
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="0-99999">全部价格</option>
                <option value="0-100">批发价 0-100</option>
                <option value="100-200">批发价 100-200</option>
                <option value="200-300">批发价 200-300</option>
                <option value="300-99999">批发价 300+</option>
              </select>
              {(styleFilter || seasonFilter || searchQuery) && (
                <button
                  onClick={() => {
                    setStyleFilter("");
                    setSeasonFilter("");
                    setSearchQuery("");
                    setPriceRange([0, 99999]);
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  清除筛选
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-sm text-muted-foreground mb-4">
          共 {filteredProducts.length} 件商品
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => {
            const status = stockStatus(product.stock);
            return (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => {
                  setSelectedProduct(product);
                  setQuantity(1);
                }}
              >
                {/* Image placeholder */}
                <div className="relative h-52 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <Package className="w-12 h-12 text-gray-300" />
                  {product.is_hot && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" /> 爆款
                    </span>
                  )}
                  <span
                    className={`absolute top-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors truncate">
                    {product.name}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent text-xs font-medium rounded-full">
                      <Tag className="w-3 h-3" />
                      {product.style_type}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full"
                      style={{
                        backgroundColor: `${COLOR_SEASON_COLORS[product.color_season]}20`,
                        color: COLOR_SEASON_COLORS[product.color_season],
                      }}
                    >
                      <Palette className="w-3 h-3" />
                      {product.color_season}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-lg font-bold text-primary">
                        ¥{product.wholesale_price}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        批发价
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground line-through">
                      ¥{product.retail_price}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {filteredProducts.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>未找到符合条件的商品</p>
          </div>
        )}

        {/* Login Prompt */}
        <div className="mt-12 py-12 bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl text-center">
          <div className="max-w-xl mx-auto px-6">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-lg font-bold text-primary">完整数据与深度分析</h3>
            <p className="mt-2 text-sm text-muted-foreground">详细商业数据、供应链信息与专业分析报告，仅对授权用户开放</p>
            <a href="/admin/login" className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
              登录管理后台
            </a>
          </div>
        </div>
      </div>

      {/* Floating Cart Button */}
      <button
        onClick={() => setCartOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary text-white rounded-full shadow-xl flex items-center justify-center hover:bg-primary/90 transition-colors"
      >
        <ShoppingCart className="w-6 h-6" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </button>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <Package className="w-16 h-16 text-gray-300" />
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                {selectedProduct.name}
              </h2>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full">
                  <Tag className="w-3 h-3" /> {selectedProduct.style_type}
                </span>
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full"
                  style={{
                    backgroundColor: `${COLOR_SEASON_COLORS[selectedProduct.color_season]}20`,
                    color: COLOR_SEASON_COLORS[selectedProduct.color_season],
                  }}
                >
                  <Palette className="w-3 h-3" /> {selectedProduct.color_season}
                </span>
                <span
                  className={`px-2.5 py-1 text-xs font-medium rounded-full ${stockStatus(selectedProduct.stock).color}`}
                >
                  {stockStatus(selectedProduct.stock).label}（库存 {selectedProduct.stock}）
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                {selectedProduct.description}
              </p>
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-muted-foreground">面料</span>
                  <p className="font-medium mt-0.5">
                    {selectedProduct.attributes.fabric}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-muted-foreground">适用季节</span>
                  <p className="font-medium mt-0.5">
                    {selectedProduct.attributes.season}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-muted-foreground">适用场景</span>
                  <p className="font-medium mt-0.5">
                    {selectedProduct.attributes.occasion}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-muted-foreground">版型</span>
                  <p className="font-medium mt-0.5">
                    {selectedProduct.attributes.fit}
                  </p>
                </div>
              </div>
              <div className="mb-4">
                <span className="text-sm text-muted-foreground">尺码</span>
                <div className="flex gap-2 mt-1">
                  {selectedProduct.attributes.sizes.map((size) => (
                    <span
                      key={size}
                      className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg text-sm font-medium"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-baseline gap-3 mb-5">
                <span className="text-2xl font-bold text-primary">
                  ¥{selectedProduct.wholesale_price}
                </span>
                <span className="text-sm text-muted-foreground">批发价</span>
                <span className="text-sm text-muted-foreground line-through">
                  ¥{selectedProduct.retail_price} 零售价
                </span>
              </div>
              {selectedProduct.stock > 0 ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity((q) =>
                          Math.min(selectedProduct.stock, q + 1)
                        )
                      }
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      addToCart(selectedProduct, quantity);
                      setSelectedProduct(null);
                      setQuantity(1);
                    }}
                    className="flex-1 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    加入购物车
                  </button>
                </div>
              ) : (
                <button
                  disabled
                  className="w-full py-3 bg-gray-200 text-gray-500 font-semibold rounded-lg cursor-not-allowed"
                >
                  暂时缺货
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => setCartOpen(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">购物车</h2>
              <button
                onClick={() => setCartOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p>购物车为空</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.product_name}
                        </p>
                        <p className="text-sm text-primary font-semibold">
                          ¥{item.wholesale_price}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            updateCartItemQty(item.product_id, -1)
                          }
                          className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateCartItemQty(item.product_id, 1)
                          }
                          className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right w-16 shrink-0">
                        <p className="text-sm font-bold text-gray-900">
                          ¥{item.subtotal}
                        </p>
                        <button
                          onClick={() => removeCartItem(item.product_id)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="border-t border-gray-200 p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-muted-foreground">合计</span>
                  <span className="text-xl font-bold text-primary">
                    ¥{cartTotal}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setCartOpen(false);
                    setCheckoutOpen(true);
                  }}
                  className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  去结算
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setCheckoutOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">确认订单</h2>
              <button
                onClick={() => setCheckoutOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {/* Shipping info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" /> 收货信息
                </h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="收货人姓名"
                    value={shippingName}
                    onChange={(e) => setShippingName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <input
                    type="tel"
                    placeholder="联系电话"
                    value={shippingPhone}
                    onChange={(e) => setShippingPhone(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <textarea
                    placeholder="收货地址"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  />
                </div>
              </div>

              {/* Payment method */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" /> 支付方式
                </h3>
                <div className="space-y-2">
                  {[
                    { id: "wechat", label: "微信支付", icon: "W" },
                    { id: "alipay", label: "支付宝", icon: "A" },
                    { id: "bank", label: "银行转账", icon: "B" },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === method.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === method.id
                            ? "border-primary"
                            : "border-gray-300"
                        }`}
                      >
                        {paymentMethod === method.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <div
                        className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                          method.id === "wechat"
                            ? "bg-green-500 text-white"
                            : method.id === "alipay"
                              ? "bg-blue-500 text-white"
                              : "bg-orange-500 text-white"
                        }`}
                      >
                        {method.icon}
                      </div>
                      <span className="text-sm font-medium">
                        {method.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Order summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  订单明细
                </h3>
                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-gray-600">
                        {item.product_name} x{item.quantity}
                      </span>
                      <span className="font-medium">¥{item.subtotal}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
                    <span className="font-semibold">合计</span>
                    <span className="text-lg font-bold text-primary">
                      ¥{cartTotal}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={
                  !shippingName || !shippingPhone || !shippingAddress
                }
                className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                提交订单
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Success Toast */}
      {orderSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-[fadeIn_0.3s_ease-out]">
          <Check className="w-5 h-5" />
          <span className="font-semibold">下单成功！我们将尽快安排发货</span>
        </div>
      )}
    </div>
  );
}
