"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Phone, MessageCircle, CheckCircle2, XCircle, AlertCircle,
  Copy, Check, ChevronRight, ChevronLeft, Loader2,
  User, Building2, ArrowRight, SkipForward, Filter,
  Shield, ShieldCheck, ShieldAlert, ListChecks, ClipboardList,
} from "lucide-react";

interface ContactWithStore {
  id: string;
  store_id: string;
  name: string;
  phone: string;
  position: string | null;
  wechat_status: string;
  wechat_id: string | null;
  wechat_added_at: string | null;
  is_decision_maker: boolean;
  remark: string | null;
  store_name?: string;
  store_industry?: string;
}

interface WechatTemplate {
  id: string;
  title: string;
  content: string;
  industry: string;
}

// ============ 手机号验证 ============
// 中国大陆手机号号段（2024年最新）
const VALID_PREFIXES = [
  "130","131","132","133","134","135","136","137","138","139",
  "145","146","147","148","149",
  "150","151","152","153","155","156","157","158","159",
  "165","166","167",
  "170","171","172","173","174","175","176","177","178",
  "180","181","182","183","184","185","186","187","188","189",
  "190","191","192","193","195","196","197","198","199",
];

function validatePhone(phone: string): { valid: boolean; wechatable: boolean; reason?: string } {
  // 清理号码
  const cleaned = phone.replace(/[\s\-]/g, "");

  // 基本格式检查
  if (!cleaned) return { valid: false, wechatable: false, reason: "号码为空" };

  // 如果带+86前缀
  const pureNumber = cleaned.replace(/^\+?86/, "");

  if (!/^\d+$/.test(pureNumber)) return { valid: false, wechatable: false, reason: "含非数字字符" };
  if (pureNumber.length !== 11) return { valid: false, wechatable: false, reason: `位数不对（${pureNumber.length}位）` };
  if (!pureNumber.startsWith("1")) return { valid: false, wechatable: false, reason: "非大陆手机号" };

  const prefix = pureNumber.substring(0, 3);
  if (!VALID_PREFIXES.includes(prefix)) return { valid: false, wechatable: false, reason: `号段${prefix}不存在` };

  // 固话/400/800开头的不能搜微信
  if (/^(400|800)/.test(pureNumber)) return { valid: false, wechatable: false, reason: "400/800客服号" };

  // 虚拟运营商170/171段部分可搜微信但成功率低
  const lowSuccessPrefix = ["170", "171"];
  if (lowSuccessPrefix.includes(prefix)) {
    return { valid: true, wechatable: true, reason: "虚拟号段，微信绑定率较低" };
  }

  return { valid: true, wechatable: true, reason: undefined };
}

function getPhoneBadge(phone: string) {
  const result = validatePhone(phone);
  if (!result.valid) {
    return { icon: ShieldAlert, label: "无效号码", color: "bg-red-100 text-red-700", tooltip: result.reason || "" };
  }
  if (result.reason) {
    return { icon: Shield, label: "低概率", color: "bg-yellow-100 text-yellow-700", tooltip: result.reason };
  }
  return { icon: ShieldCheck, label: "可搜微信", color: "bg-green-100 text-green-700", tooltip: "有效大陆手机号，可直接在微信搜索" };
}

const WECHAT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  NOT_ADDED: { label: "未添加", color: "bg-gray-100 text-gray-600" },
  ADDED: { label: "已添加", color: "bg-green-100 text-green-700" },
  DEAL: { label: "已成交", color: "bg-purple-100 text-purple-700" },
  REFUSED: { label: "已拒绝", color: "bg-red-100 text-red-700" },
  INVALID: { label: "无效号码", color: "bg-gray-200 text-gray-500 line-through" },
};

export default function CrmWechatAddPage() {
  return (
    <Suspense fallback={<div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-accent" /></div>}>
      <CrmWechatAddInner />
    </Suspense>
  );
}

function CrmWechatAddInner() {
  const [contacts, setContacts] = useState<ContactWithStore[]>([]);
  const [templates, setTemplates] = useState<WechatTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterIndustry, setFilterIndustry] = useState("");
  const [filterPhoneStatus, setFilterPhoneStatus] = useState<"all" | "searchable" | "invalid">("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState<"list" | "flow" | "batch">("list");
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [copiedBatch, setCopiedBatch] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [updating, setUpdating] = useState(false);
  [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
    if (typeof document !== "undefined") {
      setSupabase(createClient());
    }
  }, []);
  const router = useRouter();

  useEffect(() => { fetchData(); }, [filterIndustry]);

  const fetchData = async () => {
    setLoading(true);
    let query = supabase
      .from("crm_contacts")
      .select("*, crm_stores!inner(name, industry)")
      .eq("wechat_status", "NOT_ADDED")
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (filterIndustry) query = query.eq("crm_stores.industry", filterIndustry);
    const { data, error } = await query;

    if (!error && data) {
      const enriched = data.map((c: any) => ({
        ...c,
        store_name: c.crm_stores?.name,
        store_industry: c.crm_stores?.industry,
      }));
      setContacts(enriched);
    }

    const { data: tplData } = await supabase
      .from("crm_wechat_templates")
      .select("id, title, content, industry")
      .eq("category", "首次添加")
      .order("sort_order");
    setTemplates(tplData || []);

    setLoading(false);
  };

  const fetchFunnelStats = async () => {
    const { data: allContacts } = await supabase
      .from("crm_contacts")
      .select("wechat_status, phone")
      .is("deleted_at", null);

    const stats = {
      total: allContacts?.length || 0,
      notAdded: allContacts?.filter(c => c.wechat_status === "NOT_ADDED").length || 0,
      added: allContacts?.filter(c => c.wechat_status === "ADDED").length || 0,
      deal: allContacts?.filter(c => c.wechat_status === "DEAL").length || 0,
      refused: allContacts?.filter(c => c.wechat_status === "REFUSED").length || 0,
      invalid: allContacts?.filter(c => c.wechat_status === "INVALID").length || 0,
      searchable: allContacts?.filter(c => c.wechat_status === "NOT_ADDED" && validatePhone(c.phone).wechatable).length || 0,
    };
    return stats;
  };

  const [funnel, setFunnel] = useState({ total: 0, notAdded: 0, added: 0, deal: 0, refused: 0, invalid: 0, searchable: 0 });

  useEffect(() => { fetchFunnelStats().then(setFunnel); }, [loading]);

  // 筛选后的列表
  const filteredContacts = contacts.filter(c => {
    if (filterPhoneStatus === "searchable") return validatePhone(c.phone).wechatable;
    if (filterPhoneStatus === "invalid") return !validatePhone(c.phone).wechatable;
    return true;
  });

  const currentContact = filteredContacts[currentIndex];

  const copyText = async (text: string, type: "phone" | "msg" | "batch") => {
    await navigator.clipboard.writeText(text);
    if (type === "phone") { setCopiedPhone(true); setTimeout(() => setCopiedPhone(false), 2000); }
    else if (type === "msg") { setCopiedMsg(true); setTimeout(() => setCopiedMsg(false), 2000); }
    else { setCopiedBatch(true); setTimeout(() => setCopiedBatch(false), 2000); }
  };

  const handleWechatAction = async (newStatus: string) => {
    if (!currentContact) return;
    setUpdating(true);
    const update: any = { wechat_status: newStatus };
    if (newStatus === "ADDED") update.wechat_added_at = new Date().toISOString();
    await supabase.from("crm_contacts").update(update).eq("id", currentContact.id);

    const { data: userData } = await supabase.auth.getUser();
    if (userData.user && newStatus === "ADDED") {
      await supabase.from("crm_notifications").insert([{
        user_id: userData.user.id,
        type: "WECHAT_ADD_REMINDER",
        title: "微信添加成功",
        content: `已成功添加 ${currentContact.name}（${currentContact.store_name}）的微信`,
        related_id: currentContact.id,
        related_type: "contact",
        is_read: false,
      }]);
    }

    const next = filteredContacts.filter((_, i) => i !== currentIndex);
    setContacts(contacts.filter(c => c.id !== currentContact.id));
    if (currentIndex >= next.length) setCurrentIndex(Math.max(0, next.length - 1));
    setUpdating(false);
    setStep("list");
    setCopiedPhone(false);
    setCopiedMsg(false);
    setSelectedTemplate("");
    fetchFunnelStats().then(setFunnel);
  };

  const startFlow = (index: number) => {
    setCurrentIndex(index);
    setStep("flow");
    setCopiedPhone(false);
    setCopiedMsg(false);
    setSelectedTemplate("");
  };

  const addRate = funnel.total > 0 ? Math.round(((funnel.added + funnel.deal) / funnel.total) * 100) : 0;
  const dealRate = funnel.total > 0 ? Math.round((funnel.deal / funnel.total) * 100) : 0;

  // 可搜微信的号码列表（用于批量复制）
  const searchablePhones = contacts.filter(c => validatePhone(c.phone).wechatable);
  const invalidPhones = contacts.filter(c => !validatePhone(c.phone).wechatable);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">加微信管理</h1>
          <p className="text-muted-foreground mt-1">自动识别可搜微信号码 · 待添加清单 · 话术推荐 · 添加率漏斗</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setStep("batch")}
            className="btn-secondary text-sm flex items-center gap-2">
            <ListChecks className="w-4 h-4" /> 批量搜索
          </button>
          <button onClick={() => { fetchData(); fetchFunnelStats().then(setFunnel); }}
            className="btn-secondary text-sm">刷新</button>
        </div>
      </div>

      {/* 号码识别统计 */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-muted-foreground">总联系人</div>
          <div className="text-xl font-bold text-primary">{funnel.total}</div>
        </div>
        <div className="bg-white rounded-xl border border-green-100 p-4">
          <div className="text-xs text-green-700 flex items-center gap-1"><ShieldCheck className="w-3 h-3" />可搜微信</div>
          <div className="text-xl font-bold text-green-600">{funnel.searchable}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-muted-foreground">已添加</div>
          <div className="text-xl font-bold text-green-700">{funnel.added + funnel.deal}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-muted-foreground">添加率</div>
          <div className="text-xl font-bold text-accent">{addRate}%</div>
        </div>
        <div className="bg-white rounded-xl border border-purple-100 p-4">
          <div className="text-xs text-purple-700">已成交</div>
          <div className="text-xl font-bold text-purple-600">{funnel.deal}</div>
        </div>
        <div className="bg-white rounded-xl border border-red-100 p-4">
          <div className="text-xs text-red-700 flex items-center gap-1"><ShieldAlert className="w-3 h-3" />无效/拒绝</div>
          <div className="text-xl font-bold text-red-600">{funnel.refused + funnel.invalid}</div>
        </div>
      </div>

      {/* 行业 + 号码状态筛选 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs text-muted-foreground">行业：</span>
        {[{ label: "全部", value: "" }, { label: "服装店", value: "服装店" }, { label: "轮胎店", value: "轮胎店" }, { label: "滋补行", value: "滋补行" }].map(opt => (
          <button key={opt.value} onClick={() => setFilterIndustry(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterIndustry === opt.value ? "bg-accent text-primary" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>{opt.label}</button>
        ))}
        <span className="text-gray-300 mx-1">|</span>
        <span className="text-xs text-muted-foreground">号码：</span>
        {[{ label: "全部", value: "all" as const, count: contacts.length }, { label: "可搜微信", value: "searchable" as const, count: searchablePhones.length }, { label: "无效号码", value: "invalid" as const, count: invalidPhones.length }].map(opt => (
          <button key={opt.value} onClick={() => setFilterPhoneStatus(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterPhoneStatus === opt.value ? "bg-accent text-primary" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>{opt.label} ({opt.count})</button>
        ))}
      </div>

      {/* ========== 批量搜索模式 ========== */}
      {step === "batch" && (
        <div className="bg-white rounded-xl border border-accent/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-primary">批量搜索微信</h3>
            <button onClick={() => setStep("list")} className="text-sm text-muted-foreground hover:text-primary">返回列表</button>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800"><strong>使用方法：</strong>复制下方号码列表 → 打开微信"添加朋友" → 搜索手机号 → 逐个添加</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* 可搜微信号码 */}
            <div>
              <h4 className="font-medium text-primary text-sm mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                可搜微信号码 ({searchablePhones.length})
              </h4>
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="space-y-1.5 font-mono text-sm">
                  {searchablePhones.map(c => (
                    <div key={c.id} className="flex items-center justify-between">
                      <span>{c.phone}</span>
                      <span className="text-xs text-muted-foreground font-sans">{c.name} · {c.store_name}</span>
                    </div>
                  ))}
                  {searchablePhones.length === 0 && <div className="text-muted-foreground text-xs">暂无</div>}
                </div>
              </div>
              <button onClick={() => copyText(searchablePhones.map(c => c.phone).join("\n"), "batch")}
                className={`mt-3 w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  copiedBatch ? "bg-green-100 text-green-700" : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}>
                {copiedBatch ? <><Check className="w-4 h-4 inline mr-1" />已复制全部号码</> : <><Copy className="w-4 h-4 inline mr-1" />复制全部号码（{searchablePhones.length}个）</>}
              </button>
            </div>

            {/* 无效号码 */}
            {invalidPhones.length > 0 && (
              <div>
                <h4 className="font-medium text-primary text-sm mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  无效/不可搜号码 ({invalidPhones.length})
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="space-y-1.5 font-mono text-sm">
                    {invalidPhones.map(c => {
                      const v = validatePhone(c.phone);
                      return (
                        <div key={c.id} className="flex items-center justify-between">
                          <span className="text-red-600 line-through">{c.phone}</span>
                          <span className="text-xs text-red-500 font-sans">{v.reason}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <button onClick={async () => {
                  if (!confirm(`确认将 ${invalidPhones.length} 个无效号码标记为"无效号码"？`)) return;
                  for (const c of invalidPhones) {
                    await supabase.from("crm_contacts").update({ wechat_status: "INVALID" }).eq("id", c.id);
                  }
                  fetchData();
                  fetchFunnelStats().then(setFunnel);
                }} className="mt-3 w-full py-2.5 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
                  一键标记为无效号码
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== 单人添加流程 ========== */}
      {step === "flow" && currentContact ? (
        <div className="bg-white rounded-xl border border-accent/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-primary">添加微信流程</h3>
            <button onClick={() => setStep("list")} className="text-sm text-muted-foreground hover:text-primary">返回列表</button>
          </div>

          {/* 联系人信息 */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xl font-bold">
                {currentContact.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">{currentContact.name}</span>
                  {currentContact.is_decision_maker && <span className="px-1.5 py-0.5 bg-accent/10 text-accent rounded text-xs">决策人</span>}
                  {(() => {
                    const badge = getPhoneBadge(currentContact.phone);
                    const BadgeIcon = badge.icon;
                    return (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${badge.color}`} title={badge.tooltip}>
                        <BadgeIcon className="w-3 h-3" />{badge.label}
                      </span>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{currentContact.store_name}</span>
                  <span>{currentContact.position}</span>
                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{currentContact.store_industry}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-1">当前进度</div>
                <div className="text-sm font-medium">{currentIndex + 1} / {filteredContacts.length}</div>
              </div>
            </div>
          </div>

          {/* 号码验证提示 */}
          {(() => {
            const v = validatePhone(currentContact.phone);
            if (!v.wechatable) return (
              <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-red-800 font-medium text-sm">
                  <ShieldAlert className="w-5 h-5" />此号码无法搜索微信
                </div>
                <p className="text-sm text-red-600 mt-1">原因：{v.reason}，建议标记为无效号码</p>
                <button onClick={() => handleWechatAction("INVALID")}
                  className="mt-3 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium">
                  标记为无效号码
                </button>
              </div>
            );
            if (v.reason) return (
              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-yellow-800 font-medium text-sm">
                  <Shield className="w-5 h-5" />注意：{v.reason}
                </div>
                <p className="text-sm text-yellow-700 mt-1">该号码可以尝试搜索，但成功率可能较低</p>
              </div>
            );
            return null;
          })()}

          {/* 步骤指引 */}
          <div className="space-y-4 mb-6">
            {/* Step 1 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">1</div>
              <div className="flex-1">
                <div className="font-medium text-primary text-sm mb-2">复制手机号，在微信搜索添加</div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-blue-50 px-4 py-2.5 rounded-lg">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span className="font-mono text-lg font-bold text-blue-800">{currentContact.phone}</span>
                  </div>
                  <button onClick={() => copyText(currentContact.phone, "phone")}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      copiedPhone ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    }`}>
                    {copiedPhone ? <><Check className="w-4 h-4 inline mr-1" />已复制</> : <><Copy className="w-4 h-4 inline mr-1" />复制号码</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">2</div>
              <div className="flex-1">
                <div className="font-medium text-primary text-sm mb-2">选择加微信话术，发送好友申请</div>
                <div className="space-y-2">
                  {templates
                    .filter(t => t.industry === "通用" || t.industry === currentContact.store_industry)
                    .map(tpl => (
                      <button key={tpl.id} onClick={() => setSelectedTemplate(tpl.content)}
                        className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                          selectedTemplate === tpl.content
                            ? "bg-green-50 border-2 border-green-300"
                            : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                        }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-primary">{tpl.title}</span>
                          <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">{tpl.industry}</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{tpl.content}</p>
                      </button>
                    ))}
                  {selectedTemplate && (
                    <button onClick={() => copyText(selectedTemplate.replace("[姓名]", ""), "msg")}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        copiedMsg ? "bg-green-100 text-green-700" : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}>
                      {copiedMsg ? <><Check className="w-4 h-4 inline mr-1" />话术已复制</> : <><Copy className="w-4 h-4 inline mr-1" />复制话术</>}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">3</div>
              <div className="flex-1">
                <div className="font-medium text-primary text-sm mb-3">记录添加结果</div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleWechatAction("ADDED")} disabled={updating}
                    className="px-5 py-2.5 bg-green-100 text-green-800 hover:bg-green-200 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
                    <CheckCircle2 className="w-4 h-4" /> 已添加成功
                  </button>
                  <button onClick={() => handleWechatAction("REFUSED")} disabled={updating}
                    className="px-5 py-2.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
                    <XCircle className="w-4 h-4" /> 被拒绝
                  </button>
                  <button onClick={() => handleWechatAction("INVALID")} disabled={updating}
                    className="px-5 py-2.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
                    <AlertCircle className="w-4 h-4" /> 号码无效
                  </button>
                  <button onClick={() => {
                    const next = filteredContacts.filter((_, i) => i !== currentIndex);
                    setContacts(contacts.filter(c => c.id !== currentContact.id));
                    if (currentIndex >= next.length) setCurrentIndex(Math.max(0, next.length - 1));
                    setStep("list");
                  }} disabled={updating}
                    className="px-5 py-2.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
                    <SkipForward className="w-4 h-4" /> 稍后再加
                  </button>
                </div>
              </div>
            </div>
          </div>

          {currentContact.remark && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-sm text-yellow-800">
              <strong>备注：</strong>{currentContact.remark}
            </div>
          )}
        </div>
      ) : step === "list" ? (
        /* ========== 待添加清单 ========== */
        <>
          {loading ? (
            <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-accent" /></div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {filterPhoneStatus === "searchable" ? "没有可搜微信的号码" : filterPhoneStatus === "invalid" ? "没有无效号码" : "所有联系人都已添加微信！"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredContacts.map((c, i) => {
                const badge = getPhoneBadge(c.phone);
                const BadgeIcon = badge.icon;
                return (
                  <div key={c.id} className={`rounded-xl border p-4 hover:shadow-sm transition-shadow flex items-center gap-4 ${
                    !validatePhone(c.phone).wechatable ? "bg-red-50/50 border-red-100" : "bg-white border-gray-100"
                  }`}>
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">
                      {c.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-primary text-sm">{c.name}</span>
                        {c.is_decision_maker && <span className="px-1 py-0.5 bg-accent/10 text-accent rounded text-xs">决策人</span>}
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{c.store_industry}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${badge.color}`} title={badge.tooltip}>
                          <BadgeIcon className="w-3 h-3" />{badge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{c.store_name}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>
                        {c.position && <span>{c.position}</span>}
                      </div>
                    </div>
                    {validatePhone(c.phone).wechatable ? (
                      <button onClick={() => startFlow(i)}
                        className="btn-primary flex items-center gap-2 text-sm px-4 py-2 whitespace-nowrap">
                        <MessageCircle className="w-4 h-4" /> 加微信
                      </button>
                    ) : (
                      <button onClick={async () => {
                        if (!confirm("确认标记为无效号码？")) return;
                        await supabase.from("crm_contacts").update({ wechat_status: "INVALID" }).eq("id", c.id);
                        setContacts(prev => prev.filter(x => x.id !== c.id));
                        fetchFunnelStats().then(setFunnel);
                      }} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" /> 标记无效
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
