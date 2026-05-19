"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, UserRound } from "lucide-react";

export default function StyleTestPage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

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
            <div
              className={`transition-all duration-700 delay-200 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all p-8 md:p-10 text-center border border-transparent hover:border-accent/30 h-full flex flex-col">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-2">
                    男士风格测试
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    18道题，约3分钟
                  </p>
                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <div className="text-2xl font-bold text-accent mb-1">¥99</div>
                    <div className="text-xs text-muted-foreground mb-4">可测2次，有效期30天</div>
                    <Link
                      href="/style-test/male"
                      className="block w-full btn-primary text-sm py-2.5 text-center"
                    >
                      立即购买
                    </Link>
                  </div>
              </div>
            </div>

            {/* Female Card */}
            <div
              className={`transition-all duration-700 delay-400 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all p-8 md:p-10 text-center border border-transparent hover:border-accent/30 h-full flex flex-col">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                    <UserRound className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-2">
                    女士风格测试
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    14道题，约2分钟
                  </p>
                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <div className="text-2xl font-bold text-accent mb-1">¥99</div>
                    <div className="text-xs text-muted-foreground mb-4">可测2次，有效期30天</div>
                    <Link
                      href="/style-test/female"
                      className="block w-full btn-primary text-sm py-2.5 text-center"
                    >
                      立即购买
                    </Link>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section
        className={`pb-12 md:pb-16 transition-all duration-700 delay-500 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div className="container mx-auto px-4">
          <p className="text-xs text-muted-foreground text-center max-w-2xl mx-auto leading-relaxed">
            注明：此风格测试与实际测试有出入，结果仅供参考，想获知准确结果可以联系骆芷蝶CMB色彩形象顾问进行测试。联系方式：骆芷蝶
            Tal：13925997776 vx：luozhidie666
          </p>
        </div>
      </section>
    </div>
  );
}
