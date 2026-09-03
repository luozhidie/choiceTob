"use client";

import { useState, useEffect } from "react";

/**
 * 网站端可后台配置文案（vip / members / agent 三页）
 * 仅开放「展示文案」，价格 / 金额 / 会员类型等经营字段仍在页面代码里，不在本配置内。
 * 管理员在 /admin/vip-copy 的「网站文案」标签页修改，小程序与网站实时生效。
 */
export const DEFAULT_WEB_PAGE_COPY = {
  vip: {
    hero: {
      title: "骆芷蝶 · VIP会员",
      subtitle: "企划定品控方向，供应链稳货源，落地赋能提业绩",
      subtitle2: "一站式帮门店管好货、做好店、赚稳钱",
    },
    guide: {
      title: "充值解锁拿货折扣 + 退换额度",
      subtitle: "认证店主可先看批发价；折扣与退换额度需一次性充值对应档位",
    },
    depositEntry: {
      title: "充值货款折扣会员",
      subtitle: "预存货款享2.6-2.8折拿货 · 5万/10万/30万三档可选 · 充值后自动开通代理店铺",
    },
    // 套餐卡片副标题（全局默认；若某套餐有 newCustomerLabel 则优先用套餐自身的）
    planSubtitle: "适合单店/连锁/品牌",
    pay: {
      confirmTitle: "确认开通 {planName}",
      confirmSub: "开通后1年内有效，到期前可续费",
    },
    // 可选：按 plan.id 覆盖套餐展示文案（name/priceLabel/discountLabel/newCustomerLabel/features）
    plans: {} as Record<
      string,
      { name?: string; priceLabel?: string; discountLabel?: string; newCustomerLabel?: string; features?: string[] }
    >,
  },
  members: {
    heroTitle: "骆芷蝶智选 · 会员中心",
    heroSubtitle: "整合VIP服务、商品企划、爆款样衣、营销策划的一站式赋能平台",
    depositSectionTitle: "预存货款 · 折扣拿货",
    depositSectionSub: "预存越多，折扣越低。预存款可用于采购下单，随时退。",
    depositTip: "💡 预存款支持全额退还（扣除已用部分），详情请联系客服",
  },
  agent: {
    heroTag: "代理方式",
    heroTitleMain: "转发就能卖货，",
    heroTitleAccent: "差价自动到账",
    heroSub:
      "你是我们的批发客户 / 认证店主。给商品设个卖价，把链接发给客户——客户看不到批发价，每卖出一件，差价自动进你余额。",
    tierSectionTitle: "代理档级",
    faqSectionTitle: "常见问题",
  },
};

export type WebPageCopy = typeof DEFAULT_WEB_PAGE_COPY;

function deepMerge<T extends Record<string, any>>(base: T, override?: any): T {
  if (!override || typeof override !== "object") return base;
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...base };
  for (const k of Object.keys(override)) {
    const bv = (base as any)[k];
    const ov = override[k];
    if (bv && typeof bv === "object" && !Array.isArray(bv) && ov && typeof ov === "object" && !Array.isArray(ov)) {
      out[k] = deepMerge(bv, ov);
    } else {
      out[k] = ov;
    }
  }
  return out as T;
}

/** 加载网站端后台文案配置，缺失字段回退默认值 */
export function useWebCopy() {
  const [copy, setCopy] = useState<WebPageCopy>(DEFAULT_WEB_PAGE_COPY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/public/settings?keys=web_page_copy")
      .then((r) => r.json())
      .then((j) => {
        const d = j?.data?.web_page_copy;
        if (active && d) setCopy(deepMerge(DEFAULT_WEB_PAGE_COPY, d));
      })
      .catch(() => {})
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, []);

  return copy;
}
