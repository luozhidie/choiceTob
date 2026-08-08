"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ShoppingBag, MessageCircle, Phone, Copy, ArrowRight, Home } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/discount";

function SuccessContent() {
  const searchParams = useSearchParams();
  const title = searchParams.get("title") || "商品";
  const amount = parseInt(searchParams.get("amount") || "0", 10);
  const payment = searchParams.get("payment") || "contact";
  const [copied, setCopied] = useState("");

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-10 h-10 text-green-500" /></div>
          <h1 className="text-2xl font-bold text-primary">订单提交成功！</h1>
          <p className="text-sm text-gray-500 mt-2">客服将尽快确认您的订单</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
          <div className="flex items-center justify-between text-sm"><span className="text-gray-500">商品名称</span><span className="text-primary font-medium line-clamp-1 max-w-[200px]">{title}</span></div>
          <div className="flex items-center justify-between text-sm"><span className="text-gray-500">实付金额</span><span className="text-accent font-bold text-lg">{formatPrice(amount)}</span></div>
          <div className="flex items-center justify-between text-sm"><span className="text-gray-500">支付方式</span><span className="text-primary">{payment === "wechat" ? "微信支付" : payment === "alipay" ? "支付宝" : "联系客服"}</span></div>
        </div>

        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-bold text-primary">完成支付</h3>
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-green-600" /><span className="font-bold text-green-700 text-sm">微信支付</span></div>
              <button onClick={() => handleCopy("luozhidie666", "wechat")} className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors">{copied === "wechat" ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === "wechat" ? "已复制" : "复制"}</button>
            </div>
            <p className="text-xs text-green-600">添加微信：<span className="font-mono font-medium">luozhidie666</span>，转账 <span className="font-bold">{formatPrice(amount)}</span></p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><span className="text-sm">💙</span><span className="font-bold text-blue-700 text-sm">支付宝</span></div>
              <button onClick={() => handleCopy("13925997776", "alipay")} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors">{copied === "alipay" ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === "alipay" ? "已复制" : "复制"}</button>
            </div>
            <p className="text-xs text-blue-600">手机号：<span className="font-mono font-medium">13925997776</span>，转账 <span className="font-bold">{formatPrice(amount)}</span></p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /><span className="font-bold text-primary text-sm">电话咨询</span></div>
              <button onClick={() => handleCopy("13925997776", "phone")} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-white text-xs rounded-lg hover:bg-primary/90 transition-colors">{copied === "phone" ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === "phone" ? "已复制" : "复制"}</button>
            </div>
            <p className="text-xs text-gray-600 font-mono">13925997776</p>
          </div>
        </div>

        <div className="space-y-3">
          <Link href="/buyer" className="w-full py-3 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"><ShoppingBag className="w-4 h-4" /> 继续选购</Link>
          <Link href="/buyer-center" className="w-full py-3 border border-gray-200 text-primary text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">查看我的订单 <ArrowRight className="w-4 h-4" /></Link>
          <Link href="/" className="w-full py-3 text-gray-500 text-sm font-medium rounded-xl hover:text-primary transition-colors flex items-center justify-center gap-2"><Home className="w-4 h-4" /> 回到首页</Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
