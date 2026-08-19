"use client";

import { useState, useEffect } from "react";
import {
  Loader2, Save, Plus, Trash2, RefreshCw, Coins, Gift, ListChecks, Sparkles,
} from "lucide-react";

interface TaskCfg {
  key: string;
  label: string;
  icon: string;
  points: number;
  type: "once" | "daily";
  nav?: string;
}
interface Benefit {
  icon: string;
  t: string;
  d: string;
}

const DEFAULTS = {
  fortune_checkin_rewards: [100, 200, 300, 500, 800, 1000, 1600],
  fortune_tasks: [
    { key: "know_activity", label: "平台活动提前知（秋款上新福利）", icon: "📣", points: 300, type: "once" as const },
    { key: "subscribe_stall", label: "订阅档口领财富值", icon: "🔔", points: 300, type: "once" as const },
    { key: "order_rebate", label: "下单返运费", icon: "🛒", points: 1000, type: "daily" as const },
    { key: "official_group", label: "加入一手店主官方福利群", icon: "👥", points: 50, type: "once" as const, nav: "/pages/group/index" },
    { key: "browse_spot", label: "浏览现货 15s", icon: "👀", points: 50, type: "daily" as const },
    { key: "browse_hot", label: "浏览档口最爆款 15s", icon: "🔥", points: 30, type: "daily" as const },
    { key: "market_new", label: "每日看市场新款", icon: "✨", points: 20, type: "daily" as const },
    { key: "browse_invite", label: "浏览邀请 30s", icon: "🔗", points: 20, type: "daily" as const },
  ],
  fortune_exchange: { cost: 3000, amount_cents: 300 },
  group_benefits: [
    { icon: "🍂", t: "秋冬上新预告", d: "新款提前看，抢先组货不上架" },
    { icon: "💰", t: "专属批发价", d: "认证店主解锁批发价与分级退换额度" },
    { icon: "🎁", t: "集财运任务", d: "进群即领 50 财运值，兑运费券" },
    { icon: "📣", t: "活动提前知", d: "平台活动与福利第一时间推送" },
  ],
};

export default function AdminActivityConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [checkin, setCheckin] = useState<number[]>(DEFAULTS.fortune_checkin_rewards);
  const [exchange, setExchange] = useState(DEFAULTS.fortune_exchange);
  const [tasks, setTasks] = useState<TaskCfg[]>(DEFAULTS.fortune_tasks as TaskCfg[]);
  const [benefits, setBenefits] = useState<Benefit[]>(DEFAULTS.group_benefits);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const res = await fetch(
        "/api/public/settings?keys=fortune_checkin_rewards,fortune_tasks,fortune_exchange,group_benefits"
      );
      const json = await res.json();
      const d = json.data || {};
      if (Array.isArray(d.fortune_checkin_rewards)) setCheckin(d.fortune_checkin_rewards);
      if (d.fortune_tasks) setTasks(d.fortune_tasks);
      if (d.fortune_exchange) setExchange(d.fortune_exchange);
      if (d.group_benefits) setBenefits(d.group_benefits);
    } catch (e: any) {
      showToast("error", "加载失败：" + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveOne(key: string, value: any) {
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || "保存失败");
    }
  }

  async function saveAll() {
    setSaving(true);
    try {
      await saveOne("fortune_checkin_rewards", checkin);
      await saveOne("fortune_tasks", tasks);
      await saveOne("fortune_exchange", exchange);
      await saveOne("group_benefits", benefits);
      showToast("success", "全部已保存，小程序实时生效");
    } catch (e: any) {
      showToast("error", "保存失败：" + e.message);
    } finally {
      setSaving(false);
    }
  }

  // 任务行操作
  function updateTask(i: number, patch: Partial<TaskCfg>) {
    setTasks((arr) => arr.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }
  function addTask() {
    const n = tasks.length + 1;
    setTasks((arr) => [...arr, { key: "custom_" + n, label: "新任务", icon: "⭐", points: 50, type: "daily" }]);
  }
  function delTask(i: number) {
    setTasks((arr) => arr.filter((_, idx) => idx !== i));
  }
  // 福利行操作
  function updateBenefit(i: number, patch: Partial<Benefit>) {
    setBenefits((arr) => arr.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }
  function addBenefit() {
    setBenefits((arr) => [...arr, { icon: "✨", t: "新福利", d: "福利说明" }]);
  }
  function delBenefit(i: number) {
    setBenefits((arr) => arr.filter((_, idx) => idx !== i));
  }

  if (loading) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="w-10 h-10 animate-spin mx-auto text-accent mb-4" />
        <p className="text-sm text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <AnimatedToast toast={toast} />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">活动配置</h1>
          <p className="text-sm text-muted-foreground mt-1">
            集财运 / 店主福利社群 的全部数值与文案，改完小程序实时生效，无需重新部署
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadAll} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-white border border-border rounded-lg hover:bg-muted transition-colors">
            <RefreshCw className="w-4 h-4" /> 刷新
          </button>
          <button
            onClick={saveAll}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-accent rounded-lg hover:brightness-110 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            保存全部
          </button>
        </div>
      </div>

      {/* 签到奖励 */}
      <Section icon={Coins} title="集财运 · 7天签到奖励（财运值）" desc="第1天到第7天连续签到发放的财运值，断签重置">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {checkin.map((v, i) => (
            <div key={i} className="text-center">
              <div className="text-xs text-muted-foreground mb-1">第 {i + 1} 天</div>
              <input
                type="number"
                value={v}
                onChange={(e) => setCheckin((arr) => arr.map((x, idx) => (idx === i ? Number(e.target.value) || 0 : x)))}
                className="w-full px-2 py-2 text-center rounded-lg border border-border bg-white"
              />
            </div>
          ))}
        </div>
      </Section>

      {/* 兑换规则 */}
      <Section icon={Gift} title="集财运 · 财运值兑换运费券" desc="攒满财运值可兑换运费券">
        <div className="flex flex-wrap gap-6">
          <Field label="所需财运值">
            <input type="number" value={exchange.cost} onChange={(e) => setExchange({ ...exchange, cost: Number(e.target.value) || 0 })} className="w-32 px-3 py-2 rounded-lg border border-border bg-white" />
          </Field>
          <Field label="券金额（元）">
            <input type="number" step="0.01" value={(exchange.amount_cents / 100).toFixed(2)} onChange={(e) => setExchange({ ...exchange, amount_cents: Math.round(Number(e.target.value) * 100) })} className="w-32 px-3 py-2 rounded-lg border border-border bg-white" />
          </Field>
        </div>
      </Section>

      {/* 任务列表 */}
      <Section icon={ListChecks} title="集财运 · 任务列表" desc="每个任务的分值与类型；key 为系统标识（固定），官方群任务保留跳转">
        <div className="space-y-3">
          {tasks.map((t, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-border bg-white">
              <input value={t.icon} onChange={(e) => updateTask(i, { icon: e.target.value })} className="w-12 px-2 py-2 text-center rounded-lg border border-border" />
              <input value={t.label} onChange={(e) => updateTask(i, { label: e.target.value })} placeholder="任务名称" className="flex-1 min-w-[160px] px-3 py-2 rounded-lg border border-border" />
              <input type="number" value={t.points} onChange={(e) => updateTask(i, { points: Number(e.target.value) || 0 })} className="w-24 px-2 py-2 rounded-lg border border-border" title="分值" />
              <select value={t.type} onChange={(e) => updateTask(i, { type: e.target.value as "once" | "daily" })} className="px-2 py-2 rounded-lg border border-border bg-white">
                <option value="daily">每日</option>
                <option value="once">一次性</option>
              </select>
              <span className="text-[11px] font-mono text-gray-400 px-1">{t.key}{t.nav ? " ↪群" : ""}</span>
              <button onClick={() => delTask(i)} className="ml-auto p-2 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button onClick={addTask} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-accent border border-accent rounded-lg hover:bg-accent/5">
            <Plus className="w-4 h-4" /> 新增任务
          </button>
        </div>
      </Section>

      {/* 社群福利 */}
      <Section icon={Sparkles} title="店主福利社群 · 福利文案" desc="社群页展示的福利条目">
        <div className="space-y-3">
          {benefits.map((b, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-border bg-white">
              <input value={b.icon} onChange={(e) => updateBenefit(i, { icon: e.target.value })} className="w-12 px-2 py-2 text-center rounded-lg border border-border" />
              <input value={b.t} onChange={(e) => updateBenefit(i, { t: e.target.value })} placeholder="标题" className="w-40 px-3 py-2 rounded-lg border border-border" />
              <input value={b.d} onChange={(e) => updateBenefit(i, { d: e.target.value })} placeholder="说明" className="flex-1 min-w-[160px] px-3 py-2 rounded-lg border border-border" />
              <button onClick={() => delBenefit(i)} className="ml-auto p-2 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button onClick={addBenefit} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-accent border border-accent rounded-lg hover:bg-accent/5">
            <Plus className="w-4 h-4" /> 新增福利
          </button>
        </div>
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, desc, children }: { icon: any; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="fashion-card p-6 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-5 h-5 text-accent" />
        <h3 className="font-bold text-primary text-base">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{desc}</p>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function AnimatedToast({ toast }: { toast: { type: "success" | "error"; message: string } | null }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-primary" : "bg-red-500"}`}>
      {toast.message}
    </div>
  );
}
