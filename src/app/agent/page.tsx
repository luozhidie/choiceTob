"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { useAuth } from "@/lib/auth-context";
import {
  Copy,
  Check,
  QrCode,
  Link2,
  TrendingUp,
  Users,
  ShoppingBag,
  Wallet,
  Tag,
  Store,
  ShieldCheck,
  Percent,
  Coins,
  ArrowRight,
  LogIn,
  Save,
  DollarSign,
} from "lucide-react";

const ORIGIN = typeof window !== "undefined" ? window.location.origin : "https://colour-choice.art";

function fmtYuan(fen: number) {
  return `¥${((fen || 0) / 100).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function discountLabel(rate: number) {
  if (!rate || rate >= 1) return "零售价";
  return `${(rate * 10).toFixed(1)}折`;
}

export default function AgentWorkbenchPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [me, setMe] = useState<any>(null);
  const [loadErr, setLoadErr] = useState("");

  const [products, setProducts] = useState<any[]>([]);
  const [editPrices, setEditPrices] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState("");

  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [wdAmount, setWdAmount] = useState("");
  const [wdMsg, setWdMsg] = useState("");
  const [wdBusy, setWdBusy] = useState(false);

  const [qrSvg, setQrSvg] = useState("");
  const [copied, setCopied] = useState(false);

  async function authHeaders(): Promise<Record<string, string>> {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    const { data } = await sb.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function loadAll() {
    try {
      const h = await authHeaders();
      const [meRes, priceRes, wdRes] = await Promise.all([
        fetch("/api/agent/me", { headers: h }),
        fetch("/api/agent/product-price", { headers: h }),
        fetch("/api/agent/withdraw", { headers: h }),
      ]);
      const meData = await meRes.json();
      if (!meRes.ok) throw new Error(meData.error || "加载失败");
      setMe(meData);

      if (priceRes.ok) {
        const pd = await priceRes.json();
        setProducts(pd.products || []);
        const init: Record<string, string> = {};
        (pd.products || []).forEach((p: any) => {
          init[p.product_id] = p.custom_price ? String(p.custom_price / 100) : "";
        });
        setEditPrices(init);
      }
      if (wdRes.ok) {
        const wd = await wdRes.json();
        setWithdrawals(wd.withdrawals || []);
      }
    } catch (e: any) {
      setLoadErr(e.message || "加载失败");
    }
  }

  useEffect(() => {
    if (user) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const inviteCode = me?.inviteCode;
  const landingUrl = useMemo(
    () => (inviteCode ? `${ORIGIN}/agent/landing?ref=${inviteCode}` : ""),
    [inviteCode]
  );

  useEffect(() => {
    if (landingUrl) {
      QRCode.toString(landingUrl, { type: "svg", margin: 1, width: 220 })
        .then(setQrSvg)
        .catch(() => setQrSvg(""));
    }
  }, [landingUrl]);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function savePrice(productId: string) {
    const val = editPrices[productId];
    const fen = Math.round(Number(val) * 100);
    if (!fen || fen <= 0) {
      setWdMsg("请输入有效卖价");
      return;
    }
    setSavingId(productId);
    try {
      const h = await authHeaders();
      const res = await fetch("/api/agent/product-price", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...h },
        body: JSON.stringify({ product_id: productId, custom_price: fen }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "保存失败");
      setProducts((prev) =>
        prev.map((p) => (p.product_id === productId ? { ...p, custom_price: fen } : p))
      );
    } catch (e: any) {
      setWdMsg(e.message || "保存失败");
    } finally {
      setSavingId("");
    }
  }

  async function submitWithdraw() {
    const fen = Math.round(Number(wdAmount) * 100);
    if (!fen || fen <= 0) {
      setWdMsg("请输入有效金额");
      return;
    }
    setWdBusy(true);
    setWdMsg("");
    try {
      const h = await authHeaders();
      const res = await fetch("/api/agent/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...h },
        body: JSON.stringify({ amount: fen, method: "wechat" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "提现失败");
      setWdAmount("");
      setWdMsg("提现申请已提交，后台审核后打款");
      loadAll();
    } catch (e: any) {
      setWdMsg(e.message || "提现失败");
    } finally {
      setWdBusy(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2d1b2e] text-white">
        加载中…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#2d1b2e] text-center px-4">
        <LogIn className="w-12 h-12 text-[#C9A24B] mb-4" />
        <h1 className="text-2xl font-bold text-white">请先登录代理工作台</h1>
        <p className="text-white/60 mt-2">登录后可管理推广码、设置卖价、查看业绩与收益</p>
        <button
          onClick={() => router.push("/login?redirect=/agent")}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[#C9A24B] text-[#2d1b2e] font-bold rounded-xl hover:bg-[#b8945a] transition-colors"
        >
          去登录
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const perf = me?.performance || { customerCount: 0, orderCount: 0, gmv: 0 };
  const isAgent = me?.active || me?.isDepositAgent || me?.isCertified || me?.isAdmin;

  if (user && me && !isAgent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#2d1b2e] text-center px-4">
        <ShieldCheck className="w-14 h-14 text-[#C9A24B] mb-4" />
        <h1 className="text-2xl font-bold text-white">你当前还不是有效批发客户</h1>
        <p className="text-white/60 mt-2 max-w-md">
          预存货款后即可开通代理工作台、专属推广码、商品定价与佣金提现。货款支持全额退还（扣除已用部分）。
        </p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => router.push('/agent/recruit')}
            className="px-6 py-3 bg-[#C9A24B] text-[#2d1b2e] font-bold rounded-xl hover:bg-[#b8945a] transition-colors"
          >
            了解合作方式
          </button>
          <button
            onClick={() => router.push('/vip?tab=deposit')}
            className="px-6 py-3 border border-[#C9A24B]/40 text-[#C9A24B] font-bold rounded-xl hover:bg-[#C9A24B]/10 transition-colors"
          >
            去充值预存货款
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2d1b2e] text-white pb-20">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#C9A24B]/15">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#C9A24B]/10 -translate-y-1/3 translate-x-1/3 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-10">
          <div className="flex items-center gap-2 text-[#C9A24B] text-sm font-semibold tracking-widest uppercase">
            <Store className="w-4 h-4" /> AGENT WORKBENCH
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold">代理工作台</h1>
          <p className="mt-2 text-white/60 max-w-2xl">
            设置你的专属卖价，把商品转发给客户试穿下单。客户看不到批发价，差价自动结算到你的余额。
          </p>
        </div>
      </section>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 mt-8 space-y-6">
        {loadErr && (
          <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200">
            {loadErr}
          </div>
        )}

        {!isAgent && (
          <div className="p-5 rounded-2xl bg-[#C9A24B]/10 border border-[#C9A24B]/30 flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-[#C9A24B] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">你当前还不是有效代理</p>
              <p className="text-white/60 text-sm mt-1">
                认证你的店铺（免费看批发价）或预存货款（拿 2.8 折起 + 退换额度）后即可使用推广与定价功能。
              </p>
              <Link
                href="/agent/recruit"
                className="inline-flex items-center gap-1 mt-2 text-[#C9A24B] font-medium hover:underline"
              >
                了解代理方式 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* 资金账单卡 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          <StatCard icon={Percent} label="我的折扣" value={discountLabel(me?.discountRate)} hint="拿货折扣" />
          <StatCard icon={ShieldCheck} label="退换额度" value={`${Math.round((me?.returnRate || 0) * 100)}%`} hint="可退换比例" />
          <StatCard icon={Coins} label="预存货款" value={fmtYuan(me?.depositAmount)} hint="货款余额" />
          <StatCard icon={Wallet} label="可提现" value={fmtYuan(me?.walletBalance)} hint="差价收益" />
          <StatCard icon={TrendingUp} label="冻结中" value={fmtYuan(me?.frozenBalance)} hint="发货后解锁" />
          <StatCard icon={ShoppingBag} label="专业试衣" value={`${me?.tryon?.proLeft || 0}次`} hint={`剩余额度 · ${me?.tryon?.pro?.daysLeft || 0} 天`} />
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 推广工具 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-1 rounded-2xl bg-white/5 border border-[#C9A24B]/20 p-6"
          >
            <div className="flex items-center gap-2 text-[#C9A24B] font-semibold">
              <Link2 className="w-5 h-5" /> 我的推广
            </div>
            <p className="text-white/50 text-xs mt-1">客户通过你的链接下单，自动记到你名下</p>

            <div className="mt-4 bg-white rounded-2xl p-4 flex flex-col items-center">
              {qrSvg ? (
                <div dangerouslySetInnerHTML={{ __html: qrSvg }} className="w-[180px] h-[180px]" />
              ) : (
                <div className="w-[180px] h-[180px] flex items-center justify-center text-gray-300">
                  <QrCode className="w-10 h-10" />
                </div>
              )}
              <p className="text-[#2d1b2e] text-xs mt-2 font-medium">扫码进入你的专属店铺</p>
            </div>

            <div className="mt-4">
              <div className="text-xs text-white/50 mb-1">推广码</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-[#C9A24B] text-sm font-mono">
                  {inviteCode || "—"}
                </code>
                <button
                  onClick={() => inviteCode && copy(inviteCode)}
                  className="p-2 rounded-lg bg-[#C9A24B]/15 text-[#C9A24B] hover:bg-[#C9A24B]/25"
                  title="复制推广码"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="mt-3">
              <div className="text-xs text-white/50 mb-1">推广链接</div>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={landingUrl}
                  className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white/80 text-xs truncate"
                />
                <button
                  onClick={() => landingUrl && copy(landingUrl)}
                  className="p-2 rounded-lg bg-[#C9A24B]/15 text-[#C9A24B] hover:bg-[#C9A24B]/25"
                  title="复制链接"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>

          {/* 业绩 + 收益 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="grid grid-cols-3 gap-4">
              <StatCard icon={TrendingUp} label="业绩 GMV" value={fmtYuan(perf.gmv)} hint="归因销售额" />
              <StatCard icon={Users} label="带来客户" value={`${perf.customerCount}`} hint="归因客户数" />
              <StatCard icon={ShoppingBag} label="归因订单" value={`${perf.orderCount}`} hint="代理订单" />
            </div>

            {/* 提现 */}
            <div className="rounded-2xl bg-white/5 border border-[#C9A24B]/20 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#C9A24B] font-semibold">
                  <Wallet className="w-5 h-5" /> 收益与提现
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/50">可提现余额</div>
                  <div className="text-2xl font-bold text-[#C9A24B]">{fmtYuan(me?.walletBalance)}</div>
                </div>
              </div>
              <p className="text-white/50 text-xs mt-2">
                客户按你设的卖价付款后，卖价减批发成本的差价自动进入此处，可申请提现。
              </p>

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-black/30 border border-white/10">
                  <DollarSign className="w-4 h-4 text-[#C9A24B]" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="提现金额（元）"
                    value={wdAmount}
                    onChange={(e) => setWdAmount(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-white text-sm"
                  />
                </div>
                <button
                  onClick={submitWithdraw}
                  disabled={wdBusy}
                  className="px-6 py-2.5 bg-[#C9A24B] text-[#2d1b2e] font-bold rounded-lg hover:bg-[#b8945a] disabled:opacity-50 transition-colors"
                >
                  {wdBusy ? "提交中…" : "申请提现"}
                </button>
              </div>
              {wdAmount && Number(wdAmount) > 0 && (
                <div className="mt-2 text-xs text-white/60 space-y-1">
                  <p>应扣个税（估算）：¥{(() => {
                    const cents = Math.round(Number(wdAmount) * 100);
                    const taxable = cents <= 400000 ? Math.max(0, cents - 80000) : Math.round(cents * 0.8);
                    return (Math.round(taxable * 0.2) / 100).toFixed(2);
                  })()}；实际到账：¥{(() => {
                    const cents = Math.round(Number(wdAmount) * 100);
                    const taxable = cents <= 400000 ? Math.max(0, cents - 80000) : Math.round(cents * 0.8);
                    return (Math.max(0, cents - Math.round(taxable * 0.2)) / 100).toFixed(2);
                  })()}</p>
                  <p>预计到账：1-7 个工作日（当天提最快隔日，周五提最快下周一）</p>
                </div>
              )}
              {wdMsg && <p className="text-sm text-[#C9A24B] mt-2">{wdMsg}</p>}

              {withdrawals.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-xs text-white/50">提现记录</div>
                  {withdrawals.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-black/20"
                    >
                      <span className="text-white/80">{fmtYuan(w.amount)}</span>
                      <span
                        className={
                          w.status === "paid"
                            ? "text-green-400"
                            : w.status === "rejected"
                            ? "text-red-400"
                            : "text-[#C9A24B]"
                        }
                      >
                        {w.status === "paid" ? "已打款" : w.status === "rejected" ? "已驳回" : "审核中"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* 商品自定义卖价 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl bg-white/5 border border-[#C9A24B]/20 p-6"
        >
          <div className="flex items-center gap-2 text-[#C9A24B] font-semibold">
            <Tag className="w-5 h-5" /> 商品定价（对客卖价）
          </div>
          <p className="text-white/50 text-xs mt-1 mb-4">
            给每个商品设置你卖给客户的价。客户通过你的链接只看到这个价，看不到批发价，也不知道你赚多少。
          </p>

          {products.length === 0 ? (
            <p className="text-white/40 text-sm">暂无可定价商品</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {products.map((p) => (
                <div
                  key={p.product_id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/5"
                >
                  {p.cover_image ? (
                    <img src={p.cover_image} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <Tag className="w-5 h-5 text-white/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.title}</div>
                    <div className="text-xs text-white/40">平台零售价 {fmtYuan(p.retail_price)}（参考）</div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className="text-[#C9A24B] text-xs">卖价¥</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editPrices[p.product_id] ?? ""}
                        onChange={(e) =>
                          setEditPrices((prev) => ({ ...prev, [p.product_id]: e.target.value }))
                        }
                        className="w-20 px-2 py-1 rounded bg-black/40 border border-white/10 text-white text-xs outline-none focus:border-[#C9A24B]"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => savePrice(p.product_id)}
                    disabled={savingId === p.product_id}
                    className="px-3 py-2 rounded-lg bg-[#C9A24B]/15 text-[#C9A24B] hover:bg-[#C9A24B]/25 text-xs font-medium disabled:opacity-50"
                  >
                    {savingId === p.product_id ? "保存中" : "保存"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: any;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-white/5 border border-[#C9A24B]/20 p-4">
      <div className="flex items-center gap-2 text-[#C9A24B] text-sm">
        <Icon className="w-4 h-4" />
        <span className="text-white/70">{label}</span>
      </div>
      <div className="text-2xl font-bold mt-2">{value}</div>
      {hint && <div className="text-xs text-white/40 mt-0.5">{hint}</div>}
    </div>
  );
}
