"use client";

import Link from "next/link";
import { ChevronLeft, Store, Phone, Mail, MapPin, Award, Users, Sparkles } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/settings"
            className="w-9 h-9 -ml-2 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <h1 className="text-base font-bold text-gray-900">关于我们</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 pb-12 space-y-5">
        {/* 品牌简介 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-3xl font-bold mb-4">
            骆
          </div>
          <h2 className="text-xl font-bold text-gray-900">骆芷蝶智选</h2>
          <p className="text-sm text-gray-500 mt-1">泉州鲤城服装批发个体户 · 源头好货智选平台</p>
          <p className="text-xs text-gray-400 mt-1">版本：1.0.0</p>
        </div>

        {/* 平台介绍 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4 text-sm text-gray-700 leading-relaxed">
          <p>
            骆芷蝶智选是一家专注于服装批发供应链的数字化选品平台，扎根福建泉州服装产业带，致力于为广大实体店主、买手、电商卖家提供高品质、高性价比的女装货源与专业搭配服务。
          </p>
          <p>
            平台融合色彩季型理论与个人风格诊断，通过 AI 搭配、商品企划、心愿单聚合等创新工具，帮助用户精准选品、降低库存风险、提升终端销售转化。
          </p>
        </div>

        {/* 核心优势 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-4">核心优势</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Store, title: "产业带直供", desc: "泉州源头工厂直采" },
              { icon: Sparkles, title: "智能选品", desc: "AI 搭配与企划辅助" },
              { icon: Users, title: "认证店主", desc: "批发价一键解锁" },
              { icon: Award, title: "会员权益", desc: "折扣 + 退换额度" },
            ].map((item) => (
              <div key={item.title} className="p-3 rounded-xl bg-gray-50 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-white flex items-center justify-center text-primary mb-2">
                  <item.icon className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 营业执照信息公示 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-4">营业执照信息公示</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Store className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-500">经营者</p>
                <p className="text-gray-900 font-medium">骆芷蝶</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-500">经营场所</p>
                <p className="text-gray-900 font-medium">福建省泉州市鲤城区</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Award className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-500">经营范围</p>
                <p className="text-gray-900 font-medium">服装批发、互联网销售、个人形象设计咨询等</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            注：详细营业执照信息可于国家企业信用信息公示系统查询，或联系客服索取电子副本。
          </p>
        </div>

        {/* 联系方式 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-4">联系我们</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500 w-16">电话</span>
              <span className="text-gray-900">13925997776</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500 w-16">邮箱</span>
              <span className="text-gray-900">luozhidie@live.cn</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500 w-16">地址</span>
              <span className="text-gray-900">福建省泉州市鲤城区</span>
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="text-center text-xs text-gray-400 space-y-1 pt-4">
          <p>骆芷蝶智选 © 2026 版权所有</p>
          <p>colour-choice.art</p>
        </div>
      </div>
    </div>
  );
}
