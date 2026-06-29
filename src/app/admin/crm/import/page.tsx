"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Upload, Download, FileText, Loader2, CheckCircle2,
  X, AlertCircle, Table,
} from "lucide-react";

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

export default function CrmImportPage() {
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importType, setImportType] = useState<"stores" | "contacts">("stores");
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
    if (typeof document !== "undefined") {
      setSupabase(createClient());
    }
  }, []);

  const downloadTemplate = (type: "stores" | "contacts") => {
    let csv = "";
    if (type === "stores") {
      csv = "店名,手机号(必填),地址,联系人,行业,经营范围,备注\n示例服装店,13800138000,杭州市西湖区xx路,张三,服装店,女装连衣裙,优质客户";
    } else {
      csv = "门店名称(必填),姓名(必填),手机号(必填),职位,微信号,是否决策人,备注\n示例服装店,李四,13900139000,老板,wx_lisi,是,老客户";
    }
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = type === "stores" ? "门店导入模板.csv" : "联系人导入模板.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!importText.trim()) { alert("请粘贴数据"); return; }
    setImporting(true);
    setImportResult(null);

    try {
      const lines = importText.trim().split("\n");
      const records: any[] = [];
      const errors: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const cols = lines[i].split(/[,\t]/).map(s => s.trim().replace(/^["']|["']$/g, ""));
        // 跳过表头
        if (i === 0 && (cols[0] === "店名" || cols[0] === "name" || cols[0] === "门店名称" || cols[0] === "姓名")) continue;
        if (cols.length < 2) { errors.push(`第${i + 1}行：字段不足`); continue; }

        if (importType === "stores") {
          if (!cols[1]) { errors.push(`第${i + 1}行：手机号不能为空`); continue; }
          records.push({
            name: cols[0] || "",
            owner_phone: cols[1],
            address: cols[2] || "",
            owner_name: cols[3] || "",
            industry: cols[4] || "服装店",
            business_scope: cols[5] || "",
            notes: cols[6] || "",
            source: "import",
            status: "active",
          });
        } else {
          // 联系人导入：需要先查找门店ID
          if (!cols[0] || !cols[1] || !cols[2]) { errors.push(`第${i + 1}行：门店名称、姓名、手机号不能为空`); continue; }
          records.push({
            store_name: cols[0],
            name: cols[1],
            phone: cols[2],
            position: cols[3] || "",
            wechat_id: cols[4] || "",
            is_decision_maker: cols[5] === "是" || cols[5] === "true",
            remark: cols[6] || "",
          });
        }
      }

      if (records.length === 0) { alert("未解析到有效数据"); setImporting(false); return; }

      if (importType === "stores") {
        const { error } = await supabase.from("crm_stores").insert(records);
        if (error) { errors.push(`批量插入失败：${error.message}`); }
        setImportResult({ total: records.length, success: error ? 0 : records.length, failed: error ? records.length : 0, errors });
      } else {
        // 联系人需要匹配门店
        const { data: storeData } = await supabase.from("crm_stores").select("id, name").is("deleted_at", null);
        const storeMap: Record<string, string> = {};
        (storeData || []).forEach(s => { storeMap[s.name] = s.id; });

        const contactRecords: any[] = [];
        for (const r of records) {
          const storeId = storeMap[r.store_name];
          if (!storeId) { errors.push(`${r.name}：未找到门店"${r.store_name}"`); continue; }
          contactRecords.push({
            store_id: storeId,
            name: r.name,
            phone: r.phone,
            position: r.position,
            wechat_id: r.wechat_id,
            is_decision_maker: r.is_decision_maker,
            remark: r.remark,
          });
        }

        if (contactRecords.length > 0) {
          const { error } = await supabase.from("crm_contacts").insert(contactRecords);
          if (error) { errors.push(`批量插入失败：${error.message}`); }
          setImportResult({
            total: records.length,
            success: error ? 0 : contactRecords.length,
            failed: records.length - contactRecords.length + (error ? contactRecords.length : 0),
            errors,
          });
        } else {
          setImportResult({ total: records.length, success: 0, failed: records.length, errors });
        }
      }
    } catch (err: any) {
      setImportResult({ total: 0, success: 0, failed: 0, errors: [err.message || "未知错误"] });
    }
    setImporting(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">批量导入</h1>
        <p className="text-muted-foreground mt-1">从 Excel/CSV 文件批量导入门店和联系人数据</p>
      </div>

      {/* 导入类型选择 */}
      <div className="flex gap-3 mb-6">
        <button onClick={() => { setImportType("stores"); setImportResult(null); }}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            importType === "stores" ? "bg-accent text-primary" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}>
          <Table className="w-4 h-4 inline mr-2" />门店数据
        </button>
        <button onClick={() => { setImportType("contacts"); setImportResult(null); }}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            importType === "contacts" ? "bg-accent text-primary" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}>
          <Table className="w-4 h-4 inline mr-2" />联系人数据
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        {/* 格式说明 */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <p className="font-medium text-blue-800 text-sm mb-2">导入格式说明</p>
          {importType === "stores" ? (
            <div>
              <p className="text-sm text-blue-700">每行一条门店数据，字段之间用逗号或Tab分隔：</p>
              <code className="block mt-2 bg-white px-3 py-2 rounded text-xs text-blue-900">店名, 手机号(必填), 地址, 联系人, 行业, 经营范围, 备注</code>
              <p className="text-xs text-blue-600 mt-2">行业可选值：服装店、轮胎店、滋补行、其他</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-blue-700">每行一条联系人数据，门店名称必须与系统中已有的门店匹配：</p>
              <code className="block mt-2 bg-white px-3 py-2 rounded text-xs text-blue-900">门店名称(必填), 姓名(必填), 手机号(必填), 职位, 微信号, 是否决策人, 备注</code>
              <p className="text-xs text-blue-600 mt-2">是否决策人填写"是"或"否"</p>
            </div>
          )}
          <p className="text-xs text-blue-600 mt-2">第一行如果是表头会自动跳过</p>
        </div>

        {/* 下载模板 */}
        <button onClick={() => downloadTemplate(importType)} className="btn-secondary flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" /> 下载导入模板
        </button>

        {/* 粘贴区域 */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">粘贴数据</label>
          <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={12}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono resize-none"
            placeholder="将 Excel/CSV 数据复制粘贴到此处..." />
        </div>

        {/* 导入按钮 */}
        <div className="flex items-center justify-end gap-3">
          <button onClick={() => { setImportText(""); setImportResult(null); }} className="btn-secondary">清空</button>
          <button onClick={handleImport} disabled={importing || !importText.trim()} className="btn-primary flex items-center gap-2">
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {importing ? "导入中..." : "开始导入"}
          </button>
        </div>

        {/* 导入结果 */}
        {importResult && (
          <div className={`rounded-lg p-4 ${importResult.success > 0 ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"}`}>
            <div className="flex items-center gap-2 mb-2">
              {importResult.success > 0 ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
              <span className="font-medium text-sm">导入完成</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm mb-2">
              <div><span className="text-muted-foreground">总计：</span><span className="font-medium">{importResult.total}</span></div>
              <div><span className="text-muted-foreground">成功：</span><span className="font-medium text-green-600">{importResult.success}</span></div>
              <div><span className="text-muted-foreground">失败：</span><span className="font-medium text-red-600">{importResult.failed}</span></div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="mt-2 space-y-1">
                {importResult.errors.map((err, i) => (
                  <div key={i} className="text-xs text-red-600">- {err}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
