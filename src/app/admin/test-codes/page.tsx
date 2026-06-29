"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Copy,
  Check,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TestCode {
  id: string;
  code: string;
  package_name: string;
  price: number;
  max_attempts: number;
  used_attempts: number;
  customer_name: string | null;
  customer_phone: string | null;
  customer_wechat: string | null;
  is_active: boolean;
  note: string | null;
  created_at: string;
}

export default function TestCodesPage() {
  const [codes, setCodes] = useState<TestCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCode, setEditingCode] = useState<TestCode | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // 表单
  const [form, setForm] = useState({
    package_name: "风格测试套餐",
    price: 9900,
    max_attempts: 2,
    customer_name: "",
    customer_phone: "",
    customer_wechat: "",
    note: "",
  });

  [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
  }, [supabase]);

  const generateCode = () => {
    const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const part3 = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${part1}-${part2}-${part3}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = generateCode();
    const payload: any = {
      code,
      package_name: form.package_name,
      price: form.price,
      max_attempts: form.max_attempts,
      is_active: true,
      note: form.note || null,
    };
    if (form.customer_name) payload.customer_name = form.customer_name;
    if (form.customer_phone) payload.customer_phone = form.customer_phone;
    if (form.customer_wechat) payload.customer_wechat = form.customer_wechat;

    const { error } = await supabase.from("test_codes").insert([payload]);
    if (error) {
      showToast("error", "生成失败：" + error.message);
    } else {
      showToast("success", `测试码 ${code} 已生成！`);
      setShowForm(false);
      setForm({
        package_name: "风格测试套餐",
        price: 9900,
        max_attempts: 2,
        customer_name: "",
        customer_phone: "",
        customer_wechat: "",
        note: "",
      });
      fetchCodes();
    }
  };

  const handleToggleActive = async (code: TestCode) => {
    const { error } = await supabase
      .from("test_codes")
      .update({ is_active: !code.is_active })
      .eq("id", code.id);
    if (error) {
      showToast("error", "操作失败");
    } else {
      showToast("success", code.is_active ? "已停用" : "已启用");
      fetchCodes();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此测试码？")) return;
    const res = await fetch("/api/admin/common/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, table: "test_codes" }),
    });
    const json = await res.json();
    if (json.error) {
      showToast("error", "删除失败：" + json.error);
    } else {
      showToast("success", "已删除");
      fetchCodes();
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredCodes = codes.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.code.toLowerCase().includes(term) ||
      (c.customer_name && c.customer_name.toLowerCase().includes(term)) ||
      (c.customer_phone && c.customer_phone.includes(term))
    );
  });

  const formatPrice = (price: number) => `¥${(price / 100).toFixed(0)}`;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${
              toast.type === "success" ? "bg-primary" : "bg-red-500"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">测试码管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            生成和管理风格测试码，¥99/2次
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCode(null);
            setShowForm(true);
          }}
          className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl"
        >
          <Plus className="w-4 h-4" />
          生成测试码
        </button>
      </div>

      {/* Search */}
      <div className="max-w-6xl mx-auto mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索测试码、客户姓名、手机号..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            <p className="mt-3 text-sm">加载中...</p>
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            {searchTerm ? "没有匹配的测试码" : "暂无测试码，点击上方按钮生成"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">测试码</th>
                  <th className="px-5 py-3 font-medium">套餐</th>
                  <th className="px-5 py-3 font-medium">价格</th>
                  <th className="px-5 py-3 font-medium">次数</th>
                  <th className="px-5 py-3 font-medium">客户信息</th>
                  <th className="px-5 py-3 font-medium">状态</th>
                  <th className="px-5 py-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCodes.map((code) => (
                  <tr key={code.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-primary text-xs">
                          {code.code}
                        </span>
                        <button
                          onClick={() => handleCopy(code.code)}
                          className="text-gray-400 hover:text-primary transition-colors"
                          title="复制"
                        >
                          {copiedCode === code.code ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(code.created_at).toLocaleDateString("zh-CN")}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {code.package_name}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-accent">
                      {formatPrice(code.price)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium ${code.used_attempts >= code.max_attempts ? "text-red-500" : "text-gray-700"}`}>
                        {code.used_attempts} / {code.max_attempts}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {code.customer_name ? (
                        <div>
                          <p className="text-gray-700 text-xs">{code.customer_name}</p>
                          {code.customer_phone && (
                            <p className="text-muted-foreground text-xs">{code.customer_phone}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          code.is_active
                            ? "bg-green-50 text-green-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {code.is_active ? "启用" : "停用"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleActive(code)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            code.is_active
                              ? "text-orange-500 hover:bg-orange-50"
                              : "text-green-500 hover:bg-green-50"
                          }`}
                          title={code.is_active ? "停用" : "启用"}
                        >
                          {code.is_active ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(code.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-8"
          >
            <h3 className="text-lg font-bold text-primary mb-6">生成新测试码</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">套餐名称</label>
                <input
                  type="text"
                  required
                  value={form.package_name}
                  onChange={(e) => setForm({ ...form, package_name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">价格（分）</label>
                  <input
                    type="number"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">9900 = ¥99</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最大次数</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={10}
                    value={form.max_attempts}
                    onChange={(e) => setForm({ ...form, max_attempts: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">客户姓名（选填）</label>
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  placeholder="记录谁买了这个码"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">客户手机号（选填）</label>
                <input
                  type="tel"
                  value={form.customer_phone}
                  onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                  placeholder="预留客户手机号"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注（选填）</label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="备注信息"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  生成并复制
                </button>
              </div>
            </form>
            <p className="mt-3 text-xs text-muted-foreground text-center">
              系统将自动生成格式如 ABC1-2DEF-3GHI 的测试码
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
