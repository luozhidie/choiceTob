"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, UserRound, CreditCard, QrCode, Loader2, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function StyleTestPage() {
  const [visible, setVisible] = useState(false);
  const [payConfirming, setPayConfirming] = useState(false);
  const [payError, setPayError] = useState("");
  const [selectedGender, setSelectedGender] = useState<"male" | "female" | null>(null);

  const supabase = createClient();

  useEffect(() => {
    setVisible(true);
  }, []);

  const handlePayConfirm = async (gender: "male" | "female") => {
    setPayConfirming(true);
    setPayError("");
    try {
      const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const part3 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const newCode = `${part1}-${part2}-${part3}`;

      const { error } = await supabase.from("test_codes").insert([{
        code: newCode,
        package_name: gender === "male" ? "男士风格测试" : "女士风格测试",
        price: 9900,
        max_attempts: 2,
        is_active: true,
        note: "微信扫码自动生成",
      }]);

      if (error) throw error;

      // 跳转到测试页面
      window.location.href = `/style-test/${gender}`;
    } catch (err: any) {
      setPayError("支付确认失败，请重试或联系客服");
    } finally {
      setPayConfirming(false);
    }
  };

  // 选择了性别，显示支付页
  if (selectedGender) {
    const isMale = selectedGender === "male";
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center"
        >
          <button
            onClick={() => setSelectedGender(null)}
            className="text-xs text-gray-400 hover:text-gray-600 mb-4 inline-flex items-center gap-1"
          >
            ← 返回选择
          </button>

          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${isMale ? "bg-primary/10" : "bg-accent/10"}`}>
            {isMale ? <User className="w-8 h-8 text-primary" /> : <UserRound className="w-8 h-8 text-accent" />}
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">
            {isMale ? "男士" : "女士"}风格测试
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            微信扫码支付后即可开始测试
          </p>

          <div className="text-4xl font-bold text-accent mb-6">¥99</div>

          <div className="bg-gray-100 rounded-xl p-4 mb-4 inline-block">
            <img
              src="/images/wechat-pay-qr.png"
              alt="微信收款码"
              className="w-48 h-48 mx-auto object-cover rounded-lg"
            />
          </div>
          <p className="text-xs text-gray-400 mb-4">
            请使用微信扫描上方二维码完成付款
          </p>

          {payError && (
            <p className="text-sm text-red-500 mb-3">{payError}</p>
          )}
          <button
            onClick={() => handlePayConfirm(selectedGender)}
            disabled={payConfirming}
            className="w-full bg-accent text-white flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-60"
          >
            {payConfirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                确认支付中...
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4" />
                我已支付，开始测试
              </>
            )}
          </button>
          <p className="text-xs text-muted-foreground mt-3">
            支付成功后点击按钮 · 自动生成测试码
            <br />
            客服微信：luozhidie666
          </p>
        </motion.div>
      </div>
    );
  }

  // 未选择性别：选择页面
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-16 md:py-24">
        <div
          className={`container mx-auto px-4 text-center transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            穿衣风格测试
          </h1>
          <p className="text-base md:text-lg text-white/80 leading-relaxed max-w-xl mx-auto">
            发现你的专属穿衣风格，科学定位你的美学密码
          </p>
        </div>
      </section>

      {/* Gender Selection */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Male Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all p-8 md:p-10 text-center border border-transparent hover:border-accent/30 h-full flex flex-col cursor-pointer"
              onClick={() => setSelectedGender("male")}
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <User className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">男士风格测试</h3>
              <p className="text-sm text-muted-foreground mb-6">18道题，约3分钟</p>
              <div className="mt-auto pt-4 border-t border-gray-100">
                <div className="text-2xl font-bold text-accent mb-1">¥99</div>
                <div className="text-xs text-muted-foreground mb-4">可测2次 · 微信扫码支付</div>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-accent">
                  立即购买 <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </motion.div>

            {/* Female Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all p-8 md:p-10 text-center border border-transparent hover:border-accent/30 h-full flex flex-col cursor-pointer"
              onClick={() => setSelectedGender("female")}
            >
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                <UserRound className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">女士风格测试</h3>
              <p className="text-sm text-muted-foreground mb-6">14道题，约2分钟</p>
              <div className="mt-auto pt-4 border-t border-gray-100">
                <div className="text-2xl font-bold text-accent mb-1">¥99</div>
                <div className="text-xs text-muted-foreground mb-4">可测2次 · 微信扫码支付</div>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-accent">
                  立即购买 <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="pb-12 md:pb-16">
        <div className="container mx-auto px-4">
          <p className="text-xs text-muted-foreground text-center max-w-2xl mx-auto leading-relaxed">
            注明：此风格测试与实际测试有出入，结果仅供参考，想获知准确结果可以联系骆芷蝶CMB色彩形象顾问进行测试。联系方式：骆芷蝶
            Tel：13925997776 WX：luozhidie666
          </p>
        </div>
      </section>
    </div>
  );
}
